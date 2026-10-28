import { contextBridge, ipcRenderer } from 'electron'
import {
  channels,
  type AppInfo,
  type Bounds,
  type InitialState,
  type Settings,
  type SiteState,
  type UiCommand,
} from '../shared/ipc'

/** Read once, before the first paint, so the language and theme never flash. */
const initial = ipcRenderer.sendSync(channels.appInitial) as InitialState

function subscribe<T>(channel: string, callback: (payload: T) => void): () => void {
  const listener = (_event: Electron.IpcRendererEvent, payload: T) => callback(payload)
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}

/** The whole surface Ansy's screens get. Nothing here reaches Node or the site. */
export const ansy = {
  initial,
  app: {
    info: (): Promise<AppInfo> => ipcRenderer.invoke(channels.appInfo),
    openExternal: (url: string): Promise<void> => ipcRenderer.invoke(channels.appOpenExternal, url),
  },
  settings: {
    get: (): Promise<Settings> => ipcRenderer.invoke(channels.settingsGet),
    set: (patch: Partial<Settings>): Promise<Settings> =>
      ipcRenderer.invoke(channels.settingsSet, patch),
  },
  site: {
    navigate: (input: string): Promise<{ ok: boolean; url?: string }> =>
      ipcRenderer.invoke(channels.siteNavigate, input),
    back: (): Promise<void> => ipcRenderer.invoke(channels.siteBack),
    forward: (): Promise<void> => ipcRenderer.invoke(channels.siteForward),
    reload: (): Promise<void> => ipcRenderer.invoke(channels.siteReload),
    stop: (): Promise<void> => ipcRenderer.invoke(channels.siteStop),
    focus: (): Promise<void> => ipcRenderer.invoke(channels.siteFocus),
    setBounds: (bounds: Bounds): Promise<void> =>
      ipcRenderer.invoke(channels.siteSetBounds, bounds),
    suppress: (suppressed: boolean): Promise<void> =>
      ipcRenderer.invoke(channels.siteSuppress, suppressed),
    getState: (): Promise<SiteState | null> => ipcRenderer.invoke(channels.siteGetState),
    onState: (callback: (state: SiteState) => void): (() => void) =>
      subscribe(channels.siteState, callback),
  },
  ui: {
    onCommand: (callback: (command: UiCommand) => void): (() => void) =>
      subscribe(channels.uiCommand, callback),
  },
}

export type AnsyApi = typeof ansy

contextBridge.exposeInMainWorld('ansy', ansy)
