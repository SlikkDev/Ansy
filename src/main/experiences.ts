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
import { observeSource } from './observe'

/** The isolated world the helper runs in. Any id above 0 is out of the site's reach. */
const HELPER_WORLD = 1

/** How long after a page settles the helper looks for motion and media, so autoplay has started. */
const OBSERVE_DELAY = 800

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
  private spacingKey: string | null = null
  private observeTimer: ReturnType<typeof setTimeout> | null = null
  private generation = 0

  constructor(
    private readonly contents: WebContents,
    private readonly onReport: (report: ExperienceReport) => void,
    private readonly onNarrow: (narrow: boolean) => void,
  ) {
    // Zoom, injected CSS and the helper's findings are per page; bring them back after a load.
    contents.on('did-navigate', () => void this.reapplyAfterNavigation())
    contents.on('dom-ready', () => void this.reapplyAfterLoad())
  }

  getReport(): ExperienceReport {
    return { state: { ...this.state }, observations: this.observations }
  }

  async set(patch: unknown): Promise<ExperienceReport> {
    const next = sanitizeExperiencePatch(this.state, patch)
    const changed = JSON.stringify(next) !== JSON.stringify(this.state)
    this.state = next
    if (changed) await this.apply()
    return this.getReport()
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
    if (want.textSpacingCss !== was.textSpacingCss) tasks.push(this.applyTextSpacing(want))
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
    this.spacingKey = null
    if (want.textSpacingCss) await this.applyTextSpacing(want)
    if (want.observe) {
      this.observations = null
      this.report()
      this.scheduleObserve(++this.generation)
    }
  }

  private async applyTextSpacing(want: SiteSwitches): Promise<void> {
    try {
      if (want.textSpacingCss && !this.spacingKey) {
        // Author origin: Electron cannot remove a user-origin sheet again.
        this.spacingKey = await this.contents.insertCSS(TEXT_SPACING_CSS)
      } else if (!want.textSpacingCss && this.spacingKey) {
        await this.contents.removeInsertedCSS(this.spacingKey)
        this.spacingKey = null
      }
    } catch {
      // No page yet, or the page went away. The next load applies it again.
      this.spacingKey = null
    }
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
    if (this.contents.isDestroyed() || !this.applied.observe) return
    try {
      const result = (await this.contents.executeJavaScriptInIsolatedWorld(HELPER_WORLD, [
        { code: observeSource },
      ])) as Observations
      if (generation !== this.generation || !this.applied.observe) return
      this.observations = isObservations(result) ? result : null
    } catch {
      this.observations = null
    }
    this.report()
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
}

function isObservations(value: unknown): value is Observations {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return ['animations', 'autoplay', 'media', 'mediaWithoutCaptions', 'embeddedPlayers'].every(
    (k) => typeof v[k] === 'number',
  )
}
