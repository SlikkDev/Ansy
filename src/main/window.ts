import { app, BrowserWindow, nativeTheme } from 'electron'
import { join } from 'node:path'
import type { Locale } from '../shared/i18n'
import type { Settings, SiteState, UiCommand } from '../shared/ipc'
import { channels } from '../shared/ipc'
import { pinToApp } from './security'
import { SiteView } from './site-view'

/** Slikk.Dev canvas colours, so the window never flashes white. */
const CANVAS = { dark: '#080808', light: '#F8F5F0' } as const

export function windowBackground(theme: Settings['theme']): string {
  const dark = theme === 'system' ? nativeTheme.shouldUseDarkColors : theme === 'dark'
  return dark ? CANVAS.dark : CANVAS.light
}

/** Ansy's window: its own screens, with the site view placed where they say. */
export class MainWindow {
  readonly window: BrowserWindow
  readonly site: SiteView

  constructor(settings: Settings, _locale: Locale, isDev: boolean) {
    this.window = new BrowserWindow({
      width: 1280,
      height: 840,
      minWidth: 900,
      minHeight: 600,
      show: false,
      title: 'Ansy',
      backgroundColor: windowBackground(settings.theme),
      autoHideMenuBar: false,
      ...(process.platform === 'linux'
        ? { icon: join(app.getAppPath(), 'resources/icon.png') }
        : {}),
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
        spellcheck: false,
        devTools: isDev,
      },
    })
    pinToApp(this.window.webContents)

    this.site = new SiteView(
      this.window,
      (state) => this.sendSiteState(state),
      (command) => this.sendCommand(command),
    )

    this.window.once('ready-to-show', () => this.window.show())

    if (isDev && process.env.ELECTRON_RENDERER_URL) {
      void this.window.loadURL(process.env.ELECTRON_RENDERER_URL)
    } else {
      void this.window.loadFile(join(__dirname, '../renderer/index.html'))
    }
  }

  sendCommand(command: UiCommand): void {
    if (this.window.isDestroyed()) return
    this.window.webContents.send(channels.uiCommand, command)
    this.window.webContents.focus()
  }

  setTheme(theme: Settings['theme']): void {
    this.window.setBackgroundColor(windowBackground(theme))
  }

  private sendSiteState(state: SiteState): void {
    if (this.window.isDestroyed()) return
    this.window.webContents.send(channels.siteState, state)
  }
}
