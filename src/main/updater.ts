import { app } from 'electron'
import { autoUpdater } from 'electron-updater'
import type { UpdateStatus } from '../shared/update'

/**
 * Why this build cannot update itself, or null when it can. Direct downloads
 * (the Mac disk image, the Windows installer, the Linux AppImage) check GitHub
 * Releases; everything else is updated by whatever installed it.
 */
export function updaterUnsupported(): string | null {
  if (!app.isPackaged) return 'development build'
  if (process.mas) return 'Mac App Store build'
  if (process.windowsStore) return 'Microsoft Store build'
  if (process.platform === 'linux' && !process.env.APPIMAGE) return 'Linux package'
  return null
}

/**
 * Self-updates from GitHub Releases. One check when Ansy starts (the owner can
 * turn it off), one on request from the menu or the About screen. A newer
 * version downloads in the background and installs when the owner says so, or
 * when Ansy next quits. Nothing about the owner or their sites goes with the
 * request.
 */
export class Updater {
  private status: UpdateStatus = { phase: 'idle' }

  constructor(
    private readonly emit: (status: UpdateStatus) => void,
    private readonly allowed: () => boolean,
  ) {
    autoUpdater.autoDownload = true
    autoUpdater.autoInstallOnAppQuit = true
    autoUpdater.allowPrerelease = false
    autoUpdater.logger = null
    autoUpdater.on('checking-for-update', () => this.set({ phase: 'checking' }))
    autoUpdater.on('update-not-available', () =>
      this.set({ phase: 'none', version: app.getVersion() }),
    )
    autoUpdater.on('update-available', (info) =>
      this.set({ phase: 'downloading', version: info.version, percent: 0 }),
    )
    autoUpdater.on('download-progress', (progress) => {
      if (this.status.phase !== 'downloading') return
      this.set({ ...this.status, percent: Math.min(99, Math.floor(progress.percent)) })
    })
    autoUpdater.on('update-downloaded', (info) =>
      this.set({ phase: 'ready', version: info.version }),
    )
    autoUpdater.on('error', () => this.set({ phase: 'error' }))
  }

  get(): UpdateStatus {
    return this.status
  }

  get supported(): boolean {
    return updaterUnsupported() === null
  }

  /** When Ansy starts: only if the setting allows it. */
  checkOnLaunch(): void {
    if (!this.supported) {
      this.set({ phase: 'unsupported' })
      return
    }
    if (this.allowed()) this.check()
  }

  /** From the menu or the About screen. */
  check(): void {
    if (!this.supported) {
      this.set({ phase: 'unsupported' })
      return
    }
    if (this.status.phase === 'checking' || this.status.phase === 'downloading') return
    autoUpdater.checkForUpdates().catch(() => this.set({ phase: 'error' }))
  }

  /** Quits and installs the downloaded version. */
  install(): void {
    if (this.status.phase !== 'ready') return
    autoUpdater.quitAndInstall()
  }

  private set(status: UpdateStatus): void {
    this.status = status
    this.emit(status)
  }
}
