import { WebContentsView, session, type BrowserWindow, type Input } from 'electron'
import type { ExperienceReport } from '../shared/experiences'
import type { Locale } from '../shared/i18n'
import { emptySiteState, type Bounds, type SiteState, type UiCommand } from '../shared/ipc'
import type { ReaderEvent } from '../shared/reader'
import { isWebUrl } from '../shared/url'
import { ExperienceEngine } from './experiences'
import { servePracticeShop } from './practice'
import { denyPermissions } from './security'
import { cleanUserAgent } from './user-agent'

/** WCAG 1.4.10: the narrowest width a page must reflow to without sideways scrolling. */
export const NARROW_WIDTH = 320

/** The site's own session: cookies survive restarts so the owner stays logged in. */
export const SITE_PARTITION = 'persist:ansy-site'

/** Chromium's "aborted" error: the owner navigated again or pressed stop. Not a failure. */
const ERR_ABORTED = -3

/** How long a page gets to load for "Check again" before Ansy gives up on it. */
const LOAD_TIMEOUT = 20_000

/** Screenshots wider than this are scaled down; the report page is narrower anyway. */
const SHOT_MAX_WIDTH = 1400

/**
 * The owner's site, in a sandboxed WebContentsView beside Ansy's screens.
 * Everything the renderer needs to know arrives as a SiteState; everything
 * that changes the site goes through the methods here.
 */
export class SiteView {
  readonly view: WebContentsView
  readonly experiences: ExperienceEngine
  private state: SiteState = { ...emptySiteState }
  /** The owner has a page open (or loading). */
  private visible = false
  /** Ansy's screens asked to cover the site, e.g. while a dialog is open. */
  private suppressed = false
  /** Where Ansy's screens last put the site; kept so the narrow view can be centred in it. */
  private frame: Bounds = { x: 0, y: 0, width: 0, height: 0 }
  private narrow = false

  constructor(
    private readonly window: BrowserWindow,
    private readonly onState: (state: SiteState) => void,
    private readonly onCommand: (command: UiCommand) => void,
    onReport: (report: ExperienceReport) => void,
    getLocale: () => Locale,
    onReaderEvent: (event: ReaderEvent) => void,
  ) {
    const siteSession = session.fromPartition(SITE_PARTITION)
    denyPermissions(siteSession)
    servePracticeShop(siteSession)

    this.view = new WebContentsView({
      webPreferences: {
        session: siteSession,
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
        webSecurity: true,
        allowRunningInsecureContent: false,
        spellcheck: false,
        navigateOnDragDrop: false,
      },
    })
    this.view.setVisible(false)
    this.window.contentView.addChildView(this.view)

    const contents = this.view.webContents
    contents.setUserAgent(cleanUserAgent(contents.getUserAgent()))
    this.experiences = new ExperienceEngine(
      contents,
      onReport,
      (narrow) => {
        this.narrow = narrow
        this.setBounds(this.frame)
      },
      getLocale,
      onReaderEvent,
    )

    // A pop-up or target="_blank" link opens in this same view. Anything else is dropped.
    contents.setWindowOpenHandler(({ url }) => {
      if (isWebUrl(url)) this.load(url)
      return { action: 'deny' }
    })

    contents.on('did-start-loading', () => this.update({ loading: true, error: null }))
    contents.on('did-stop-loading', () => this.update({ loading: false }))
    contents.on('did-navigate', (_event, url) => this.update({ url, title: contents.getTitle() }))
    contents.on('did-navigate-in-page', (_event, url) => this.update({ url }))
    contents.on('page-title-updated', (_event, title) => this.update({ title }))
    contents.on('did-fail-load', (_event, code, description, url, isMainFrame) => {
      if (!isMainFrame || code === ERR_ABORTED) return
      // Chromium's own error page would cover Ansy's; hide the view so the owner sees ours.
      this.setVisible(false)
      this.update({ loading: false, error: { code, description, url } })
    })
    contents.on('render-process-gone', (_event, details) => {
      this.setVisible(false)
      this.update({
        loading: false,
        error: { code: -1, description: details.reason, url: this.state.url },
      })
    })
    contents.on('before-input-event', (event, input) => {
      const command = shortcutFor(input, process.platform)
      if (command) {
        event.preventDefault()
        command()
        return
      }
      // Ansy Reader's keys never reach the page; everything else does.
      if (this.experiences.handleInput(input)) event.preventDefault()
    })

    const shortcutFor = (input: Input, platform: NodeJS.Platform): (() => void) | null => {
      if (input.type !== 'keyDown') return null
      const primary = platform === 'darwin' ? input.meta : input.control
      const key = input.key.toLowerCase()
      if (primary && key === 'l') return () => this.onCommand('focus-address')
      if (primary && key === 'r') return () => this.reload()
      if (key === 'f5') return () => this.reload()
      if (input.alt && key === 'arrowleft') return () => this.back()
      if (input.alt && key === 'arrowright') return () => this.forward()
      if (key === 'escape' && this.state.loading) return () => this.stop()
      return null
    }
  }

  getState(): SiteState {
    return { ...this.state }
  }

  load(url: string): void {
    if (!isWebUrl(url)) return
    this.update({ open: true, url, error: null, loading: true })
    this.setVisible(true)
    void this.view.webContents.loadURL(url).catch(() => {
      // did-fail-load carries the details; nothing to do here.
    })
  }

  /**
   * Loads a page and waits for it. True once it has finished loading (or at
   * least has its DOM when the rest drags on); false when it failed outright.
   */
  loadAndWait(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const contents = this.view.webContents
      let ready = false
      let done = false
      const finish = (ok: boolean) => {
        if (done) return
        done = true
        clearTimeout(timer)
        contents.off('dom-ready', onReady)
        contents.off('did-finish-load', onLoaded)
        contents.off('did-fail-load', onFailed)
        resolve(ok)
      }
      const onReady = () => {
        ready = true
      }
      const onLoaded = () => finish(true)
      const onFailed = (_event: unknown, code: number, _d: string, _u: string, main: boolean) => {
        if (main && code !== ERR_ABORTED) finish(false)
      }
      const timer = setTimeout(() => finish(ready), LOAD_TIMEOUT)
      contents.on('dom-ready', onReady)
      contents.on('did-finish-load', onLoaded)
      contents.on('did-fail-load', onFailed)
      if (!isWebUrl(url)) finish(false)
      else this.load(url)
    })
  }

  /**
   * A picture of the site as it stands, with the element ringed when there is
   * one, as PNG. Null when there is nothing to photograph.
   */
  async capture(target: string | null): Promise<Buffer | null> {
    if (!this.visible || this.suppressed || this.state.error || !this.state.open) return null
    try {
      if (target) {
        await this.experiences.show(target)
        await new Promise((resolve) => setTimeout(resolve, 200))
      }
      // The screen cover would make a black picture; it is lifted for the moment.
      let image = await this.experiences.uncovered(() => this.view.webContents.capturePage())
      if (image.isEmpty()) return null
      if (image.getSize().width > SHOT_MAX_WIDTH) image = image.resize({ width: SHOT_MAX_WIDTH })
      return image.toPNG()
    } catch {
      return null
    }
  }

  back(): void {
    const nav = this.view.webContents.navigationHistory
    if (nav.canGoBack()) nav.goBack()
  }

  forward(): void {
    const nav = this.view.webContents.navigationHistory
    if (nav.canGoForward()) nav.goForward()
  }

  reload(): void {
    if (!this.state.url) return
    if (this.state.error) {
      this.load(this.state.error.url || this.state.url)
      return
    }
    this.view.webContents.reload()
  }

  stop(): void {
    this.view.webContents.stop()
  }

  focus(): void {
    if (this.visible && !this.suppressed) this.view.webContents.focus()
  }

  setBounds(bounds: Bounds): void {
    this.frame = bounds
    const width = Math.max(0, Math.round(bounds.width))
    const narrowWidth = Math.min(NARROW_WIDTH, width)
    this.view.setBounds({
      x: Math.round(bounds.x) + (this.narrow ? Math.floor((width - narrowWidth) / 2) : 0),
      y: Math.round(bounds.y),
      width: this.narrow ? narrowWidth : width,
      height: Math.max(0, Math.round(bounds.height)),
    })
  }

  setVisible(visible: boolean): void {
    this.visible = visible
    this.applyVisibility()
  }

  /** Covers or uncovers the site while Ansy's screens show something on top of it. */
  suppress(suppressed: boolean): void {
    this.suppressed = suppressed
    this.applyVisibility()
  }

  private applyVisibility(): void {
    this.view.setVisible(this.visible && !this.suppressed)
  }

  private update(patch: Partial<SiteState>): void {
    const nav = this.view.webContents.navigationHistory
    this.state = {
      ...this.state,
      ...patch,
      canGoBack: nav.canGoBack(),
      canGoForward: nav.canGoForward(),
    }
    this.onState(this.getState())
  }
}
