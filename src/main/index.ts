import { app, Menu } from 'electron'
import { resolveLocale } from '../shared/i18n'
import { FindingsStore } from './findings'
import { registerIpc } from './ipc'
import { buildMenu } from './menu'
import { installSecurityHooks } from './security'
import { SettingsStore } from './settings'
import { MainWindow } from './window'

const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production'

// Tests and portable installs can point Ansy at another data folder.
if (process.env.ANSY_USER_DATA) app.setPath('userData', process.env.ANSY_USER_DATA)

// Every renderer, including the site view, runs in Chromium's sandbox. The one
// exception is a CI container running as root, which passes --no-sandbox; forcing
// the sandbox on there makes every child process abort.
if (!app.commandLine.hasSwitch('no-sandbox')) app.enableSandbox()
// Ansy talks to nothing but the site under test. Chromium's component updater
// would otherwise phone Google on launch.
app.commandLine.appendSwitch('disable-component-update')
installSecurityHooks()

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  let mainWindow: MainWindow | null = null
  let settings: SettingsStore
  let findings: FindingsStore

  const applyMenu = () => {
    const locale = resolveLocale(settings.get().locale, app.getLocale())
    Menu.setApplicationMenu(
      buildMenu(locale, { command: (command) => mainWindow?.sendCommand(command) }, isDev),
    )
  }

  const createWindow = () => {
    const locale = () => resolveLocale(settings.get().locale, app.getLocale())
    mainWindow = new MainWindow(settings.get(), locale, isDev)
    mainWindow.window.on('closed', () => {
      mainWindow = null
    })
  }

  app.on('second-instance', () => {
    if (!mainWindow) return
    if (mainWindow.window.isMinimized()) mainWindow.window.restore()
    mainWindow.window.focus()
  })

  app.whenReady().then(() => {
    if (process.platform === 'win32') app.setAppUserModelId('dev.slikk.ansy')

    settings = new SettingsStore()
    settings.onChange((next) => {
      applyMenu()
      mainWindow?.setTheme(next.theme)
    })

    findings = new FindingsStore()
    findings.onChange((list) => mainWindow?.sendFindings(list))

    registerIpc({ settings, findings, getWindow: () => mainWindow, isDev })
    applyMenu()
    createWindow()

    app.on('activate', () => {
      if (!mainWindow) createWindow()
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}
