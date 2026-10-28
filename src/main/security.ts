import { app, session, type WebContents } from 'electron'
import { isWebUrl } from '../shared/url'

/**
 * Baseline for every web contents Ansy creates, following Electron's security
 * checklist. The site view adds its own, stricter handling on top.
 */
export function installSecurityHooks(): void {
  app.on('web-contents-created', (_event, contents) => {
    // No <webview> tags anywhere.
    contents.on('will-attach-webview', (event) => event.preventDefault())

    // Nothing opens a new window. The site view replaces this handler with one
    // that navigates in place instead.
    contents.setWindowOpenHandler(() => ({ action: 'deny' }))

    // Only web pages. file:, javascript:, data: and custom schemes are refused.
    contents.on('will-navigate', (event, url) => {
      if (!isWebUrl(url)) event.preventDefault()
    })
    contents.on('will-redirect', (event, url) => {
      if (!isWebUrl(url)) event.preventDefault()
    })
  })

  app.whenReady().then(() => {
    denyPermissions(session.defaultSession)
  })
}

/** Denies every permission request and check on a session. */
export function denyPermissions(target: Electron.Session): void {
  target.setPermissionRequestHandler((_contents, _permission, callback) => callback(false))
  target.setPermissionCheckHandler(() => false)
  target.setDevicePermissionHandler(() => false)
}

/** Ansy's own screens never navigate away from the app. */
export function pinToApp(contents: WebContents): void {
  contents.on('will-navigate', (event) => event.preventDefault())
  contents.setWindowOpenHandler(() => ({ action: 'deny' }))
}
