import type { Input, WebContents } from 'electron'
import {
  COVER_CSS,
  defaultExperienceState,
  sanitizeExperiencePatch,
  switchesFor,
  TEXT_SPACING_CSS,
  type ExperienceReport,
  type ExperienceState,
  type Observations,
  type SiteSwitches,
} from '../shared/experiences'
import {
  keyboardRules,
  type Finding,
  type FindingElement,
  type RetestOutcome,
} from '../shared/findings'
import type { Locale } from '../shared/i18n'
import { emptyKeyboardReport, isKeyboardReport, type KeyboardReport } from '../shared/keyboard'
import {
  emptySwitchReport,
  emptyTremorReport,
  isSwitchReport,
  isTremorReport,
  switchInterval,
  type SwitchReport,
  type TremorReport,
} from '../shared/motor'
import type { ReaderCommand, ReaderEvent } from '../shared/reader'
import { sortIssues, toScanIssue, type ScanResult } from '../shared/scan'
import { highlightSource } from './highlight'
import {
  keyboardHelperSource,
  keyboardReportSource,
  keyboardResetSource,
  keyboardUninstallSource,
  MOUSE_OFF_CSS,
} from './keyboard-helper'
import {
  NO_CURSOR_CSS,
  switchHelperSource,
  switchReportSource,
  switchResetSource,
  switchUninstallSource,
  tremorHelperSource,
  tremorReportSource,
  tremorUninstallSource,
} from './motor-helpers'
import { observeSource } from './observe'
import { overlayHideSource, overlaySource, overlayUninstallSource } from './overlay-helper'
import { Reader } from './reader'
import { checkFocusableSource } from './retest'
import { isRawScan, runAxe, runAxeOn } from './scan'

/** The isolated world the helpers run in. Any id above 0 is out of the site's reach. */
const HELPER_WORLD = 1

/** How long after a page settles the helper looks for motion and media, so autoplay has started. */
const OBSERVE_DELAY = 800

/** The same pause before a scan, so content that renders late is on the page. */
const SCAN_DELAY = 800

/** How often the keyboard helper is asked what it has seen. */
const KEYBOARD_POLL = 400

/** The same for the switch access and tremor helpers. */
const MOTOR_POLL = 400

/** The style sheets Ansy inserts into the page, by what they do. */
type Sheet = 'spacing' | 'mouse' | 'cover' | 'cursor'

const noSheets = (): Record<Sheet, string | null> => ({
  spacing: null,
  mouse: null,
  cover: null,
  cursor: null,
})

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
  private switchReport: SwitchReport | null = null
  /** Switch access counts from the pages before this one, since counting began. */
  private switchCarry = { steps: 0, picks: 0 }
  private tremor: TremorReport | null = null
  /** A scan is due or under way; the card says so. */
  private scanning = false
  private running = false
  private rerun = false
  /** Keys of the sheets inserted into the current page. */
  private sheets: Record<Sheet, string | null> = noSheets()
  readonly reader: Reader
  private observeTimer: ReturnType<typeof setTimeout> | null = null
  private scanTimer: ReturnType<typeof setTimeout> | null = null
  private keyboardTimer: ReturnType<typeof setInterval> | null = null
  private motorTimer: ReturnType<typeof setInterval> | null = null
  /** Bumped on every change and every load, so a late result from before is dropped. */
  private generation = 0

  constructor(
    private readonly contents: WebContents,
    private readonly onReport: (report: ExperienceReport) => void,
    private readonly onNarrow: (narrow: boolean) => void,
    private readonly getLocale: () => Locale,
    onReaderEvent: (event: ReaderEvent) => void,
  ) {
    this.reader = new Reader(contents, onReaderEvent, () => this.report())
    // Zoom, injected CSS and the helpers are per page; bring them back after a load.
    contents.on('did-navigate', () => void this.reapplyAfterNavigation())
    contents.on('dom-ready', () => void this.reapplyAfterLoad())
    contents.on('did-navigate-in-page', () => this.reader.pageChanged())
    contents.once('destroyed', () => this.dispose())
  }

  getReport(): ExperienceReport {
    return {
      state: { ...this.state },
      observations: this.observations,
      keyboard: this.keyboard,
      switchAccess: this.switchReport && {
        ...this.switchReport,
        steps: this.switchReport.steps + this.switchCarry.steps,
        picks: this.switchReport.picks + this.switchCarry.picks,
      },
      tremor: this.tremor,
      scan: this.scan,
      scanning: this.scanning,
      reader: this.applied.reader ? this.reader.getReport() : null,
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

  /** A key pressed in the site: true when Ansy Reader keeps it from the page. */
  handleInput(input: Input): boolean {
    return this.applied.reader && this.reader.handleInput(input)
  }

  readerCommand(command: ReaderCommand): Promise<void> {
    return this.applied.reader ? this.reader.run(command) : Promise.resolve()
  }

  readerShow(index: number): Promise<boolean> {
    return this.applied.reader ? this.reader.show(index) : Promise.resolve(false)
  }

  readerElement(index: number): Promise<FindingElement | null> {
    return this.applied.reader ? this.reader.elementFor(index) : Promise.resolve(null)
  }

  /**
   * Lifts the screen cover and any overlay for the duration of `task`, e.g. a
   * screenshot, and puts them back: the developer needs the page, not the impression.
   */
  async uncovered<T>(task: () => Promise<T>): Promise<T> {
    const overlay = this.applied.overlay !== null
    if (!this.sheets.cover && !overlay) return task()
    if (this.sheets.cover) await this.applySheet('cover', COVER_CSS, false)
    if (overlay) await this.runInWorld(overlayHideSource(true))
    await new Promise((resolve) => setTimeout(resolve, 50))
    try {
      return await task()
    } finally {
      if (this.applied.cover) await this.applySheet('cover', COVER_CSS, true)
      if (this.applied.overlay) await this.runInWorld(overlayHideSource(false))
    }
  }

  /**
   * Is the finding still on the page? A scan finding runs its rule on its
   * element; a keyboard-unreachable one asks whether the keyboard reaches it
   * now. Anything else, including an element that is gone, is for the owner.
   */
  async checkFinding(finding: Finding): Promise<RetestOutcome> {
    if (this.contents.isDestroyed() || !finding.rule) return 'unknown'
    try {
      if (finding.kind === 'reader') return await this.reader.check(finding)
      if (!finding.element) return 'unknown'
      if (finding.kind === 'scan') {
        const result = await runAxeOn(
          this.contents,
          HELPER_WORLD,
          this.getLocale(),
          finding.element.target,
          finding.rule.id,
        )
        return result === 'missing' ? 'unknown' : result
      }
      if (finding.kind === 'keyboard' && finding.rule.id === keyboardRules.unreachable.id) {
        const result = await this.runInWorld<string>(checkFocusableSource(finding.element.target))
        return result === 'focusable' ? 'fixed' : result === 'unfocusable' ? 'failing' : 'unknown'
      }
    } catch (error) {
      console.error('Check again failed', error)
    }
    return 'unknown'
  }

  /** Starts counting over: the keyboard trail, or switch access's steps and picks. */
  async resetCounting(): Promise<void> {
    if (this.applied.switchAccess) {
      await this.runInWorld(switchResetSource)
      this.switchCarry = { steps: 0, picks: 0 }
      this.switchReport = { ...emptySwitchReport, skipped: this.switchReport?.skipped ?? [] }
      this.report()
    }
    await this.resetKeyboard()
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
    if (want.autoDark !== was.autoDark) {
      // No `enabled` clears the override and leaves the browser's own default.
      tasks.push(
        this.send('Emulation.setAutoDarkModeOverride', want.autoDark ? { enabled: true } : {}),
      )
    }
    if (want.overlay !== was.overlay) {
      tasks.push(
        this.runInWorld(want.overlay ? overlaySource(want.overlay) : overlayUninstallSource),
      )
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
    if (want.cover !== was.cover) tasks.push(this.applySheet('cover', COVER_CSS, want.cover))
    if (want.reader !== was.reader) {
      tasks.push(want.reader ? this.reader.start() : this.reader.stop())
    }
    if (
      want.scan !== was.scan ||
      JSON.stringify(want.scanRules) !== JSON.stringify(was.scanRules)
    ) {
      if (want.scan) {
        this.scan = null
        this.scheduleScan()
      } else this.dropScan()
    }
    if (want.tremor !== was.tremor) {
      tasks.push(this.applySheet('cursor', NO_CURSOR_CSS, want.tremor))
      tasks.push(this.applyTremor(want.tremor))
    }
    if (want.switchAccess !== was.switchAccess) {
      tasks.push(this.applySwitch(want.switchAccess !== null, was.switchAccess !== null))
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
    this.sheets = noSheets()
    if (want.textSpacingCss) await this.applySheet('spacing', TEXT_SPACING_CSS, true)
    if (want.mouseOff) await this.applySheet('mouse', MOUSE_OFF_CSS, true)
    if (want.cover) await this.applySheet('cover', COVER_CSS, true)
    if (want.overlay) await this.runInWorld(overlaySource(want.overlay))
    if (want.tremor) {
      await this.applySheet('cursor', NO_CURSOR_CSS, true)
      await this.runInWorld(tremorHelperSource)
    }
    if (want.switchAccess) {
      // The count runs on across pages, so a checkout's steps add up.
      if (this.switchReport) {
        this.switchCarry.steps += this.switchReport.steps
        this.switchCarry.picks += this.switchReport.picks
      }
      this.switchReport = {
        ...emptySwitchReport,
        lastPickSteps: this.switchReport?.lastPickSteps ?? null,
      }
      await this.runInWorld(switchHelperSource(switchInterval[want.switchAccess]))
    }
    if (want.reader) this.reader.pageLoaded()
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
    if (want.keyboard || want.observe || want.scan || want.switchAccess) this.report()
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

  private async applyTremor(on: boolean): Promise<void> {
    if (on) {
      await this.runInWorld(tremorHelperSource)
      this.tremor = { ...emptyTremorReport }
    } else {
      this.tremor = null
      await this.runInWorld(tremorUninstallSource)
    }
    this.syncMotorPoll()
  }

  /** Installs, re-speeds or removes switch scanning. */
  private async applySwitch(on: boolean, wasOn: boolean): Promise<void> {
    const speed = this.applied.switchAccess
    if (on && speed) {
      if (!wasOn) {
        this.switchCarry = { steps: 0, picks: 0 }
        this.switchReport = { ...emptySwitchReport }
      }
      await this.runInWorld(switchHelperSource(switchInterval[speed]))
    } else {
      this.switchReport = null
      this.switchCarry = { steps: 0, picks: 0 }
      await this.runInWorld(switchUninstallSource)
    }
    this.syncMotorPoll()
  }

  private syncMotorPoll(): void {
    const needed = this.applied.tremor || this.applied.switchAccess !== null
    if (needed && !this.motorTimer) {
      this.motorTimer = setInterval(() => void this.pollMotor(), MOTOR_POLL)
    } else if (!needed && this.motorTimer) {
      clearInterval(this.motorTimer)
      this.motorTimer = null
    }
  }

  /** Asks the switch and tremor helpers what they saw; reports only when something changed. */
  private async pollMotor(): Promise<void> {
    let changed = false
    if (this.applied.switchAccess) {
      const result = await this.runInWorld<unknown>(switchReportSource)
      if (
        this.applied.switchAccess &&
        isSwitchReport(result) &&
        JSON.stringify(result) !== JSON.stringify(this.switchReport)
      ) {
        this.switchReport = result
        changed = true
      }
    }
    if (this.applied.tremor) {
      const result = await this.runInWorld<unknown>(tremorReportSource)
      if (
        this.applied.tremor &&
        isTremorReport(result) &&
        JSON.stringify(result) !== JSON.stringify(this.tremor)
      ) {
        this.tremor = result
        changed = true
      }
    }
    if (changed) this.report()
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
        const raw = await runAxe(
          this.contents,
          HELPER_WORLD,
          this.getLocale(),
          this.applied.scanRules,
        )
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
    if (this.motorTimer) clearInterval(this.motorTimer)
    this.motorTimer = null
    this.observeTimer = null
    this.scanTimer = null
    this.keyboardTimer = null
    void this.reader.stop()
  }
}

function isObservations(value: unknown): value is Observations {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    ['animations', 'autoplay', 'media', 'mediaWithoutCaptions', 'embeddedPlayers'].every(
      (k) => typeof v[k] === 'number',
    ) && typeof v.darkBackground === 'boolean'
  )
}
