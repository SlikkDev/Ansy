import type { Locale, LocaleSetting } from './i18n'

export type ThemeSetting = 'dark' | 'light' | 'system'

/** What Ansy remembers between runs. Stored as JSON in the app's data folder. */
export interface Settings {
  locale: LocaleSetting
  theme: ThemeSetting
  /** Check GitHub Releases for a newer version when Ansy starts (direct downloads only). */
  updateCheck: boolean
}

export const defaultSettings: Settings = {
  locale: 'system',
  theme: 'system',
  updateCheck: true,
}

export interface SiteError {
  code: number
  description: string
  url: string
}

/** What the renderer knows about the site view, pushed on every change. */
export interface SiteState {
  /** False until the first page is asked for; the welcome card shows instead. */
  open: boolean
  url: string
  title: string
  loading: boolean
  canGoBack: boolean
  canGoForward: boolean
  error: SiteError | null
}

export const emptySiteState: SiteState = {
  open: false,
  url: '',
  title: '',
  loading: false,
  canGoBack: false,
  canGoForward: false,
  error: null,
}

export interface AppInfo {
  version: string
  platform: NodeJS.Platform
  isDev: boolean
}

/** What the preload hands the renderer before React mounts, so there is no flash. */
export interface InitialState {
  locale: Locale
  systemLocale: string
  settings: Settings
  platform: NodeJS.Platform
}

export interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

/** Commands the main process sends to Ansy's screens (menu items, shortcuts from the site view). */
export type UiCommand = 'focus-address' | 'open-about'

/** IPC channel names, in one place so main and preload cannot drift. */
export const channels = {
  appInitial: 'app:initial',
  appInfo: 'app:info',
  appOpenExternal: 'app:open-external',
  settingsGet: 'settings:get',
  settingsSet: 'settings:set',
  siteNavigate: 'site:navigate',
  siteBack: 'site:back',
  siteForward: 'site:forward',
  siteReload: 'site:reload',
  siteStop: 'site:stop',
  siteFocus: 'site:focus',
  siteSetBounds: 'site:set-bounds',
  siteSuppress: 'site:suppress',
  siteGetState: 'site:get-state',
  siteState: 'site:state',
  expSet: 'exp:set',
  expGet: 'exp:get',
  expReport: 'exp:report',
  expScan: 'exp:scan',
  expShow: 'exp:show',
  expKeyboardReset: 'exp:keyboard-reset',
  uiCommand: 'ui:command',
} as const
