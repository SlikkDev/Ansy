import { app, clipboard, ipcMain, shell, type IpcMainInvokeEvent } from 'electron'
import {
  forSite,
  sanitizeFindingDraft,
  sanitizeFindingPatch,
  siteKeyOf,
  type Finding,
} from '../shared/findings'
import { resolveLocale, translate, type Locale } from '../shared/i18n'
import {
  channels,
  type AppInfo,
  type Bounds,
  type ExportResult,
  type InitialState,
  type Settings,
} from '../shared/ipc'
import { isReaderCommand, MAX_ITEMS } from '../shared/reader'
import { plainTextReport, type ReportOptions } from '../shared/report'
import { normalizeAddress } from '../shared/url'
import type { FindingsStore } from './findings'
import { isAllowedExternal } from './links'
import { exportFindings } from './report'
import { retestFinding } from './retest'
import type { SettingsStore } from './settings'
import type { Updater } from './updater'
import type { MainWindow } from './window'

interface Deps {
  settings: SettingsStore
  findings: FindingsStore
  updater: Updater
  getWindow: () => MainWindow | null
  isDev: boolean
}

const isId = (value: unknown): value is string =>
  typeof value === 'string' && /^[0-9a-f-]{36}$/.test(value)

const isIndex = (value: unknown): value is number =>
  Number.isInteger(value) && (value as number) >= 0 && (value as number) < MAX_ITEMS

function isBounds(value: unknown): value is Bounds {
  if (!value || typeof value !== 'object') return false
  const b = value as Record<string, unknown>
  return ['x', 'y', 'width', 'height'].every(
    (k) => typeof b[k] === 'number' && Number.isFinite(b[k]),
  )
}

/** Every channel Ansy's screens can call. Inputs are validated; the site view is never handed raw input. */
export function registerIpc({ settings, findings, updater, getWindow, isDev }: Deps): void {
  const locale = (): Locale => resolveLocale(settings.get().locale, app.getLocale())

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

  ipcMain.handle(channels.updateStatus, () => updater.get())
  ipcMain.handle(channels.updateCheck, (event) => {
    if (site(event)) updater.check()
  })
  ipcMain.handle(channels.updateInstall, (event) => {
    if (site(event)) updater.install()
  })

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
  ipcMain.handle(channels.expKeyboardReset, (event) => site(event)?.experiences.resetCounting())
  ipcMain.handle(channels.expVoice, (event, command: unknown) =>
    typeof command === 'string' && command.length <= 500
      ? (site(event)?.experiences.voice(command) ?? null)
      : null,
  )

  ipcMain.handle(channels.readerCommand, (event, command: unknown) => {
    if (isReaderCommand(command)) return site(event)?.experiences.readerCommand(command)
  })
  ipcMain.handle(channels.readerShow, (event, index: unknown) =>
    isIndex(index) ? (site(event)?.experiences.readerShow(index) ?? false) : false,
  )
  ipcMain.handle(channels.readerElement, (event, index: unknown) =>
    isIndex(index) ? (site(event)?.experiences.readerElement(index) ?? null) : null,
  )

  // Findings. The last screenshot taken waits here until the owner saves or starts another.
  let pending: Buffer | null = null
  let retesting = false

  ipcMain.handle(channels.findingsList, (): Finding[] => findings.list())
  ipcMain.handle(channels.findingsSnapshot, async (event, target: unknown) => {
    const view = site(event)
    if (!view) return null
    const selector = typeof target === 'string' && target && target.length <= 2000 ? target : null
    pending = await view.capture(selector)
    return pending ? `data:image/png;base64,${pending.toString('base64')}` : null
  })
  ipcMain.handle(channels.findingsAdd, (event, raw: unknown): Finding | null => {
    if (!site(event)) return null
    const draft = sanitizeFindingDraft(raw)
    if (!draft) return null
    const png = pending
    pending = null
    return findings.add(draft, png)
  })
  ipcMain.handle(channels.findingsUpdate, (_event, id: unknown, patch: unknown) =>
    isId(id) ? findings.update(id, sanitizeFindingPatch(patch)) : null,
  )
  ipcMain.handle(channels.findingsRemove, (_event, id: unknown) =>
    isId(id) ? findings.remove(id) : false,
  )
  ipcMain.handle(channels.findingsScreenshot, (_event, id: unknown) => {
    const png = isId(id) ? findings.readScreenshot(id) : null
    return png ? `data:image/png;base64,${png.toString('base64')}` : null
  })
  ipcMain.handle(channels.findingsRetest, async (event, id: unknown): Promise<Finding | null> => {
    const view = site(event)
    const finding = isId(id) ? findings.get(id) : null
    if (!view || !finding || retesting) return null
    retesting = true
    try {
      const outcome = await retestFinding(view, finding)
      return findings.update(finding.id, { retest: { at: Date.now(), outcome, by: 'ansy' } })
    } finally {
      retesting = false
    }
  })

  const reportOptions = (list: Finding[], siteKey: unknown): ReportOptions | null => {
    const selected = forSite(list, typeof siteKey === 'string' ? siteKey : null)
    const first = selected[0]
    if (!first) return null
    const current = locale()
    return {
      locale: current,
      t: (key, vars) => translate(current, key, vars),
      site: typeof siteKey === 'string' ? siteKey : siteKeyOf(first.url),
      version: app.getVersion(),
      slikkLink: settings.get().slikkLink,
    }
  }
  ipcMain.handle(
    channels.findingsExport,
    async (event, format: unknown, siteKey: unknown): Promise<ExportResult> => {
      const win = getWindow()
      if (!win || event.sender !== win.window.webContents) return { ok: false, canceled: false }
      if (format !== 'pdf' && format !== 'text') return { ok: false, canceled: false }
      const list = findings.list()
      const options = reportOptions(list, siteKey)
      if (!options) return { ok: false, canceled: false }
      try {
        return await exportFindings(
          win.window,
          findings,
          forSite(list, options.site),
          format,
          options,
        )
      } catch (error) {
        console.error('Export failed', error)
        return { ok: false, canceled: false }
      }
    },
  )
  ipcMain.handle(channels.findingsCopy, (_event, siteKey: unknown): boolean => {
    const list = findings.list()
    const options = reportOptions(list, siteKey)
    if (!options) return false
    clipboard.writeText(plainTextReport(forSite(list, options.site), options))
    return true
  })
}
