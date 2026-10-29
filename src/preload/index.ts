import { contextBridge, ipcRenderer } from 'electron'
import type { ExperienceReport, ExperienceState } from '../shared/experiences'
import type { Finding, FindingDraft, FindingElement, FindingPatch } from '../shared/findings'
import {
  channels,
  type AppInfo,
  type Bounds,
  type ExportFormat,
  type ExportResult,
  type InitialState,
  type Settings,
  type SiteState,
  type UiCommand,
} from '../shared/ipc'
import type { ReaderCommand, ReaderEvent } from '../shared/reader'
import type { UpdateStatus } from '../shared/update'
import type { VoiceResult } from '../shared/voice'

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
  experiences: {
    set: (patch: Partial<ExperienceState>): Promise<ExperienceReport | null> =>
      ipcRenderer.invoke(channels.expSet, patch),
    get: (): Promise<ExperienceReport | null> => ipcRenderer.invoke(channels.expGet),
    onReport: (callback: (report: ExperienceReport) => void): (() => void) =>
      subscribe(channels.expReport, callback),
    scan: (): Promise<ExperienceReport | null> => ipcRenderer.invoke(channels.expScan),
    show: (target: string): Promise<boolean> => ipcRenderer.invoke(channels.expShow, target),
    resetKeyboard: (): Promise<void> => ipcRenderer.invoke(channels.expKeyboardReset),
    /** Runs a voice control command, typed or dictated, on the site. */
    voice: (command: string): Promise<VoiceResult | null> =>
      ipcRenderer.invoke(channels.expVoice, command),
  },
  reader: {
    /** Moves the virtual cursor, activates, or reads the page again. What is said arrives through onEvent. */
    command: (command: ReaderCommand): Promise<void> =>
      ipcRenderer.invoke(channels.readerCommand, command),
    /** Scrolls the site to an item and rings it. */
    show: (index: number): Promise<boolean> => ipcRenderer.invoke(channels.readerShow, index),
    /** The element behind an item, for a finding. */
    element: (index: number): Promise<FindingElement | null> =>
      ipcRenderer.invoke(channels.readerElement, index),
    onEvent: (callback: (event: ReaderEvent) => void): (() => void) =>
      subscribe(channels.readerEvent, callback),
  },
  findings: {
    list: (): Promise<Finding[]> => ipcRenderer.invoke(channels.findingsList),
    /** Rings the element (if any) and photographs the site; a preview comes back, the main process keeps the picture for `add`. */
    snapshot: (target: string | null): Promise<string | null> =>
      ipcRenderer.invoke(channels.findingsSnapshot, target),
    add: (draft: FindingDraft): Promise<Finding | null> =>
      ipcRenderer.invoke(channels.findingsAdd, draft),
    update: (id: string, patch: FindingPatch): Promise<Finding | null> =>
      ipcRenderer.invoke(channels.findingsUpdate, id, patch),
    remove: (id: string): Promise<boolean> => ipcRenderer.invoke(channels.findingsRemove, id),
    /** The stored screenshot as a data URL, for the findings list. */
    screenshot: (id: string): Promise<string | null> =>
      ipcRenderer.invoke(channels.findingsScreenshot, id),
    /** Opens the page again with the same experience and checks whether the finding still holds. */
    retest: (id: string): Promise<Finding | null> =>
      ipcRenderer.invoke(channels.findingsRetest, id),
    export: (format: ExportFormat, site: string): Promise<ExportResult> =>
      ipcRenderer.invoke(channels.findingsExport, format, site),
    copy: (site: string): Promise<boolean> => ipcRenderer.invoke(channels.findingsCopy, site),
    onChange: (callback: (findings: Finding[]) => void): (() => void) =>
      subscribe(channels.findingsChanged, callback),
  },
  ui: {
    onCommand: (callback: (command: UiCommand) => void): (() => void) =>
      subscribe(channels.uiCommand, callback),
  },
  updates: {
    status: (): Promise<UpdateStatus> => ipcRenderer.invoke(channels.updateStatus),
    /** Asks GitHub Releases for a newer version; what happens next arrives through onStatus. */
    check: (): Promise<void> => ipcRenderer.invoke(channels.updateCheck),
    /** Quits and installs the downloaded version. */
    install: (): Promise<void> => ipcRenderer.invoke(channels.updateInstall),
    onStatus: (callback: (status: UpdateStatus) => void): (() => void) =>
      subscribe(channels.updateStatus, callback),
  },
}

export type AnsyApi = typeof ansy

contextBridge.exposeInMainWorld('ansy', ansy)
