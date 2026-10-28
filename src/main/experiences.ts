import type { WebContents } from 'electron'
import {
  defaultExperienceState,
  sanitizeExperiencePatch,
  switchesFor,
  TEXT_SPACING_CSS,
  type ExperienceReport,
  type ExperienceState,
  type Observations,
  type SiteSwitches,
} from '../shared/experiences'
import type { Locale } from '../shared/i18n'
import { emptyKeyboardReport, isKeyboardReport, type KeyboardReport } from '../shared/keyboard'
import { sortIssues, toScanIssue, type ScanResult } from '../shared/scan'
import { highlightSource } from './highlight'
import {
  keyboardHelperSource,
  keyboardReportSource,
  keyboardResetSource,
  keyboardUninstallSource,
  MOUSE_OFF_CSS,
} from './keyboard-helper'
import { observeSource } from './observe'
import { isRawScan, runAxe } from './scan'

/** The isolated world the helpers run in. Any id above 0 is out of the site's reach. */
const HELPER_WORLD = 1

/** How long after a page settles the helper looks for motion and media, so autoplay has started. */
const OBSERVE_DELAY = 800

/** The same pause before a scan, so content that renders late is on the page. */
const SCAN_DELAY = 800

/** How often the keyboard helper is asked what it has seen. */
const KEYBOARD_POLL = 400

/** The style sheets Ansy inserts into the page, by what they do. */
type Sheet = 'spacing' | 'mouse'

/**
 * Applies an ExperienceState to the site view. Every switch that changes how
 * the site renders is a DevTools command or a WebContents setting, the same
 * ones Chrome's own DevTools use, so what the owner sees matches that user's
 * setup. Re-applied on every navigation, because some of them do not survive one.
 */
export class ExperienceEngine {
  private state: ExperienceState = { ...defaultExperienceState }
  private applied: SiteSwitches = switchesFor(this.state)
  private observations: Observations | null = null
  private keyboard: KeyboardReport | null = null
  private scan: ScanResult | null = null
  /** A scan is due or under way; the card says so. */
  private scanning = false
  private running = false
  private rerun = false
  /** Keys of the sheets inserted into the current page. */
  private sheets: Record<Sheet, string | null> = { spacing: null, mouse: null }
  private observeTimer: ReturnType<typeof setTimeout> | null = null
  private scanTimer: ReturnType<typeof setTimeout> | null = null
  private keyboardTimer: ReturnType<typeof setInterval> | null = null
  /** Bumped on every change and every load, so a late result from before is dropped. */
  private generation = 0

  constructor(
    private readonly contents: WebContents,
    private readonly onReport: (report: ExperienceReport) => void,
    private readonly onNarrow: (narrow: boolean) => void,
    private readonly getLocale: () => Locale,
  ) {
    // Zoom, injected CSS and the helpers are per page; bring them back after a load.
    contents.on('did-navigate', () => void this.reapplyAfterNavigation())
    contents.on('dom-ready', () => void this.reapplyAfterLoad())
    contents.once('destroyed', () => this.dispose())
  }

  getReport(): ExperienceReport {
    return {
      state: { ...this.state },
      observations: this.observations,
      keyboard: this.keyboard,
      scan: this.scan,
      scanning: this.scanning,
    }
  }

  async set(patch: unknown): Promise<ExperienceReport> {
    const next = sanitizeExperiencePatch(this.state, patch)
    const changed = JSON.stringify(next) !== JSON.stringify(this.state)
    this.state = next
    if (changed) await this.apply()
    return this.getReport()
  }

  /** Scans the current page again, now, if the scan is on. */
  scanNow(): ExperienceReport {
    if (this.applied.scan) {
      if (this.scanTimer) clearTimeout(this.scanTimer)
      this.scanTimer = null
      void this.runScan()
    }
    return this.getReport()
  }

  /** Rings an element in the site. False when it is no longer there. */
  async show(target: string): Promise<boolean> {
    return (await this.runInWorld<boolean>(highlightSource(target))) === true
  }

  /** Starts the keyboard trail over, keeping what the page cannot reach. */
  async resetKeyboard(): Promise<void> {
    if (!this.applied.keyboard) return
    await this.runInWorld(keyboardResetSource)
    this.keyboard = { ...emptyKeyboardReport, unreachable: this.keyboard?.unreachable ?? [] }
    this.report()
  }

  private async apply(): Promise<void> {
    const want = switchesFor(this.state)
    const was = this.applied
    this.applied = want
    const generation = ++this.generation

    if (want.observe !== was.observe) this.observations = null
    this.onNarrow(want.narrow)

    if (this.contents.isDestroyed()) return
    const tasks: Promise<unknown>[] = []

    if (want.visionDeficiency !== was.visionDeficiency) {
      tasks.push(
        this.send('Emulation.setEmulatedVisionDeficiency', { type: want.visionDeficiency }),
      )
    }
    if (JSON.stringify(want.mediaFeatures) !== JSON.stringify(was.mediaFeatures)) {
      tasks.push(this.send('Emulation.setEmulatedMedia', { features: want.mediaFeatures }))
    }
    if (want.fontSize !== was.fontSize) {
      tasks.push(
        this.send('Page.setFontSizes', {
          fontSizes: { standard: want.fontSize, fixed: Math.round(want.fontSize * 0.8125) },
        }),
      )
    }
    if (want.textSpacingCss !== was.textSpacingCss) {
      tasks.push(this.applySheet('spacing', TEXT_SPACING_CSS, want.textSpacingCss))
    }
    if (want.mouseOff !== was.mouseOff) {
      tasks.push(this.applySheet('mouse', MOUSE_OFF_CSS, want.mouseOff))
    }
    if (want.keyboard !== was.keyboard) tasks.push(this.applyKeyboard(want.keyboard))
    if (want.scan !== was.scan) {
      if (want.scan) this.scheduleScan()
      else this.dropScan()
    }
    if (want.zoomFactor !== was.zoomFactor) this.contents.setZoomFactor(want.zoomFactor)
    if (want.muted !== was.muted) this.contents.setAudioMuted(want.muted)

    await Promise.all(tasks)
    this.report()
    if (want.observe) this.scheduleObserve(generation)
  }

  private async reapplyAfterNavigation(): Promise<void> {
    if (this.contents.isDestroyed()) return
    const want = this.applied
    if (want.zoomFactor !== 1) this.contents.setZoomFactor(want.zoomFactor)
  }

  private async reapplyAfterLoad(): Promise<void> {
    if (this.contents.isDestroyed()) return
    const want = this.applied
    this.generation += 1
    this.sheets = { spacing: null, mouse: null }
    if (want.textSpacingCss) await this.applySheet('spacing', TEXT_SPACING_CSS, true)
    if (want.mouseOff) await this.applySheet('mouse', MOUSE_OFF_CSS, true)
    if (want.keyboard) {
      await this.runInWorld(keyboardHelperSource)
      this.keyboard = { ...emptyKeyboardReport }
    }
    if (want.observe) {
      this.observations = null
      this.scheduleObserve(this.generation)
    }
    if (want.scan) {
      this.scan = null
      this.scheduleScan()
    }
    if (want.keyboard || want.observe || want.scan) this.report()
  }

  private async applySheet(sheet: Sheet, css: string, on: boolean): Promise<void> {
    try {
      if (on && !this.sheets[sheet]) {
        // Author origin: Electron cannot remove a user-origin sheet again.
        this.sheets[sheet] = await this.contents.insertCSS(css)
      } else if (!on && this.sheets[sheet]) {
        const key = this.sheets[sheet]
        this.sheets[sheet] = null
        await this.contents.removeInsertedCSS(key)
      }
    } catch {
      // No page yet, or the page went away. The next load applies it again.
      this.sheets[sheet] = null
    }
  }

  private async applyKeyboard(on: boolean): Promise<void> {
    if (on) {
      await this.runInWorld(keyboardHelperSource)
      this.keyboard = { ...emptyKeyboardReport }
      if (!this.keyboardTimer) {
        this.keyboardTimer = setInterval(() => void this.pollKeyboard(), KEYBOARD_POLL)
      }
    } else {
      if (this.keyboardTimer) clearInterval(this.keyboardTimer)
      this.keyboardTimer = null
      this.keyboard = null
      await this.runInWorld(keyboardUninstallSource)
    }
  }

  /** Asks the keyboard helper what it saw; reports only when something changed. */
  private async pollKeyboard(): Promise<void> {
    if (!this.applied.keyboard) return
    const result = await this.runInWorld<unknown>(keyboardReportSource)
    if (!this.applied.keyboard || !isKeyboardReport(result)) return
    if (JSON.stringify(result) !== JSON.stringify(this.keyboard)) {
      this.keyboard = result
      this.report()
    }
  }

  private scheduleScan(): void {
    if (this.scanTimer) clearTimeout(this.scanTimer)
    this.scanning = true
    this.scanTimer = setTimeout(() => {
      this.scanTimer = null
      void this.runScan()
    }, SCAN_DELAY)
  }

  private dropScan(): void {
    if (this.scanTimer) clearTimeout(this.scanTimer)
    this.scanTimer = null
    this.scan = null
    this.scanning = false
    this.rerun = false
  }

  /**
   * One scan at a time. A request that arrives mid-scan runs once more after
   * it; a result from before a navigation or a switch is dropped.
   */
  private async runScan(): Promise<void> {
    if (this.running) {
      this.rerun = true
      return
    }
    if (this.contents.isDestroyed() || !this.applied.scan) {
      this.scanning = false
      return
    }
    this.running = true
    this.scanning = true
    this.report()
    do {
      this.rerun = false
      const generation = this.generation
      try {
        const raw = await runAxe(this.contents, HELPER_WORLD, this.getLocale())
        if (generation !== this.generation || !this.applied.scan) continue
        this.scan = isRawScan(raw)
          ? {
              url: this.contents.getURL(),
              title: this.contents.getTitle(),
              locale: this.getLocale(),
              at: Date.now(),
              issues: sortIssues(raw.violations.map(toScanIssue)),
              incomplete: sortIssues(raw.incomplete.map(toScanIssue)),
              passes: raw.passes,
            }
          : null
      } catch (error) {
        console.error('Scan failed', error)
        if (generation === this.generation) this.scan = null
      }
    } while (this.rerun && this.applied.scan && !this.contents.isDestroyed())
    this.running = false
    // A load meanwhile may have put the next scan on the clock.
    this.scanning = this.scanTimer !== null
    this.report()
  }

  private scheduleObserve(generation: number): void {
    if (this.observeTimer) clearTimeout(this.observeTimer)
    this.observeTimer = setTimeout(() => {
      this.observeTimer = null
      void this.observe(generation)
    }, OBSERVE_DELAY)
  }

  /** Runs the helper in its own world and reports what it saw, unless the state moved on. */
  private async observe(generation: number): Promise<void> {
    if (!this.applied.observe) return
    const result = await this.runInWorld<unknown>(observeSource)
    if (generation !== this.generation || !this.applied.observe) return
    this.observations = isObservations(result) ? result : null
    this.report()
  }

  /** Runs code in the helpers' world; null when there is no page to run it in. */
  private async runInWorld<T>(code: string): Promise<T | null> {
    if (this.contents.isDestroyed()) return null
    try {
      return (await this.contents.executeJavaScriptInIsolatedWorld(HELPER_WORLD, [{ code }])) as T
    } catch {
      return null
    }
  }

  private async send(method: string, params: Record<string, unknown>): Promise<void> {
    const dbg = this.contents.debugger
    try {
      if (!dbg.isAttached()) dbg.attach('1.3')
      await dbg.sendCommand(method, params)
    } catch (error) {
      console.error(`Experience switch failed: ${method}`, error)
    }
  }

  private report(): void {
    this.onReport(this.getReport())
  }

  private dispose(): void {
    if (this.observeTimer) clearTimeout(this.observeTimer)
    if (this.scanTimer) clearTimeout(this.scanTimer)
    if (this.keyboardTimer) clearInterval(this.keyboardTimer)
    this.observeTimer = null
    this.scanTimer = null
    this.keyboardTimer = null
  }
}

function isObservations(value: unknown): value is Observations {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return ['animations', 'autoplay', 'media', 'mediaWithoutCaptions', 'embeddedPlayers'].every(
    (k) => typeof v[k] === 'number',
  )
}
