import { WebContentsView, session, type BrowserWindow, type Input } from 'electron'
import { emptySiteState, type Bounds, type SiteState, type UiCommand } from '../shared/ipc'
import { isWebUrl } from '../shared/url'
import { denyPermissions } from './security'
import { cleanUserAgent } from './user-agent'

/** The site's own session: cookies survive restarts so the owner stays logged in. */
export const SITE_PARTITION = 'persist:ansy-site'

/** Chromium's "aborted" error: the owner navigated again or pressed stop. Not a failure. */
const ERR_ABORTED = -3

/**
 * The owner's site, in a sandboxed WebContentsView beside Ansy's screens.
 * Everything the renderer needs to know arrives as a SiteState; everything
 * that changes the site goes through the methods here.
 */
export class SiteView {
  readonly view: WebContentsView
  private state: SiteState = { ...emptySiteState }
  /** The owner has a page open (or loading). */
  private visible = false
  /** Ansy's screens asked to cover the site, e.g. while a dialog is open. */
  private suppressed = false

  constructor(
    private readonly window: BrowserWindow,
    private readonly onState: (state: SiteState) => void,
    private readonly onCommand: (command: UiCommand) => void,
  ) {
    const siteSession = session.fromPartition(SITE_PARTITION)
    denyPermissions(siteSession)

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
      if (!command) return
      event.preventDefault()
      command()
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
    this.view.setBounds({
      x: Math.round(bounds.x),
      y: Math.round(bounds.y),
      width: Math.max(0, Math.round(bounds.width)),
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
