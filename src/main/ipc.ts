import { app, ipcMain, shell, type IpcMainInvokeEvent } from 'electron'
import { resolveLocale } from '../shared/i18n'
import {
  channels,
  type AppInfo,
  type Bounds,
  type InitialState,
  type Settings,
} from '../shared/ipc'
import { normalizeAddress } from '../shared/url'
import { isAllowedExternal } from './links'
import type { SettingsStore } from './settings'
import type { MainWindow } from './window'

interface Deps {
  settings: SettingsStore
  getWindow: () => MainWindow | null
  isDev: boolean
}

function isBounds(value: unknown): value is Bounds {
  if (!value || typeof value !== 'object') return false
  const b = value as Record<string, unknown>
  return ['x', 'y', 'width', 'height'].every(
    (k) => typeof b[k] === 'number' && Number.isFinite(b[k]),
  )
}

/** Every channel Ansy's screens can call. Inputs are validated; the site view is never handed raw input. */
export function registerIpc({ settings, getWindow, isDev }: Deps): void {
  // Synchronous on purpose: the preload needs locale and theme before the first paint.
  ipcMain.on(channels.appInitial, (event) => {
    const current = settings.get()
    const initial: InitialState = {
      locale: resolveLocale(current.locale, app.getLocale()),
      systemLocale: app.getLocale(),
      settings: current,
      platform: process.platform,
    }
    event.returnValue = initial
  })

  ipcMain.handle(channels.appInfo, (): AppInfo => ({
    version: app.getVersion(),
    platform: process.platform,
    isDev,
  }))

  ipcMain.handle(channels.appOpenExternal, async (_event, url: unknown) => {
    if (typeof url === 'string' && isAllowedExternal(url)) await shell.openExternal(url)
  })

  ipcMain.handle(channels.settingsGet, (): Settings => settings.get())
  ipcMain.handle(channels.settingsSet, (_event, patch: unknown): Settings => {
    if (!patch || typeof patch !== 'object') return settings.get()
    return settings.set(patch as Partial<Settings>)
  })

  const site = (event: IpcMainInvokeEvent) => {
    const win = getWindow()
    if (!win || event.sender !== win.window.webContents) return null
    return win.site
  }

  ipcMain.handle(channels.siteNavigate, (event, input: unknown) => {
    const url = typeof input === 'string' ? normalizeAddress(input) : null
    if (!url) return { ok: false as const }
    site(event)?.load(url)
    return { ok: true as const, url }
  })
  ipcMain.handle(channels.siteBack, (event) => site(event)?.back())
  ipcMain.handle(channels.siteForward, (event) => site(event)?.forward())
  ipcMain.handle(channels.siteReload, (event) => site(event)?.reload())
  ipcMain.handle(channels.siteStop, (event) => site(event)?.stop())
  ipcMain.handle(channels.siteFocus, (event) => site(event)?.focus())
  ipcMain.handle(channels.siteGetState, (event) => site(event)?.getState() ?? null)
  ipcMain.handle(channels.siteSetBounds, (event, bounds: unknown) => {
    if (isBounds(bounds)) site(event)?.setBounds(bounds)
  })
  ipcMain.handle(channels.siteSuppress, (event, suppressed: unknown) => {
    site(event)?.suppress(suppressed === true)
  })

  ipcMain.handle(channels.expSet, (event, patch: unknown) => {
    const view = site(event)
    return view ? view.experiences.set(patch) : null
  })
  ipcMain.handle(channels.expGet, (event) => site(event)?.experiences.getReport() ?? null)
  ipcMain.handle(channels.expScan, (event) => site(event)?.experiences.scanNow() ?? null)
  ipcMain.handle(channels.expShow, (event, target: unknown) => {
    if (typeof target !== 'string' || !target || target.length > 2000) return false
    return site(event)?.experiences.show(target) ?? false
  })
  ipcMain.handle(channels.expKeyboardReset, (event) => site(event)?.experiences.resetKeyboard())
}
