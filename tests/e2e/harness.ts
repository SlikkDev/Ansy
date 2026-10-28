/// <reference lib="dom" />
import {
  _electron as electron,
  expect,
  type ElectronApplication,
  type Page,
} from '@playwright/test'
import { readFileSync } from 'node:fs'
import { mkdtemp, readFile } from 'node:fs/promises'
import { createServer, type Server } from 'node:http'
import { tmpdir } from 'node:os'
import { extname, join, normalize } from 'node:path'

/** What every end-to-end spec needs: the built app, its window, and the sample shop served locally. */

const fixtures = join(__dirname, '..', 'fixtures', 'sample-shop')
const types: Record<string, string> = { '.html': 'text/html; charset=utf-8' }

export interface Harness {
  app: ElectronApplication
  page: Page
  server: Server
  /** The shop's address, with a trailing slash. */
  shop: string
  userData: string
  /** Types the shop's address into Ansy and waits for it to load. */
  openShop(): Promise<void>
  /** Serves other content for one of the shop's files, or the file itself again with null: a "fix" for check again. */
  serve(file: string, body: string | null): void
  close(): Promise<void>
}

export async function serveShop(): Promise<{
  server: Server
  url: string
  overrides: Map<string, string>
}> {
  const overrides = new Map<string, string>()
  const server = createServer(async (req, res) => {
    const file =
      normalize(new URL(req.url ?? '/', 'http://x').pathname).replace(/^\/+/, '') || 'index.html'
    try {
      const body = overrides.get(file) ?? (await readFile(join(fixtures, file)))
      res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' })
      res.end(body)
    } catch {
      res.writeHead(404).end('not found')
    }
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('no port')
  return { server, url: `http://127.0.0.1:${address.port}/`, overrides }
}

/** Launches the built app with a fresh data folder, in English. */
export async function launchAnsy(prefix = 'ansy-e2e-'): Promise<Harness> {
  const { server, url, overrides } = await serveShop()
  const userData = await mkdtemp(join(tmpdir(), prefix))
  const args = ['.']
  // A container running as root cannot use Chromium's sandbox; the app skips enableSandbox() then.
  if (process.getuid?.() === 0) args.push('--no-sandbox')
  const app = await electron.launch({
    args,
    env: { ...process.env, ANSY_USER_DATA: userData, LANG: 'en_US.UTF-8' },
  })
  const page = await app.firstWindow()
  await page.waitForLoadState('domcontentloaded')
  return {
    app,
    page,
    server,
    shop: url,
    userData,
    async openShop() {
      const addressBar = page.getByRole('textbox', { name: 'Site address' })
      await addressBar.fill(url)
      await addressBar.press('Enter')
      await expect(page.locator('[aria-live="polite"]').first()).toHaveText('Sample shop')
    },
    serve(file, body) {
      if (body === null) overrides.delete(file)
      else overrides.set(file, body)
    },
    async close() {
      await app.close()
      server.close()
    },
  }
}

// axe runs straight in the page: @axe-core/playwright wants a second page for
// its final pass, and an Electron window cannot open one.
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8')
type AxeWindow = Window & { axe?: { run(context: Document): Promise<{ violations: unknown[] }> } }

/** Fails the test if Ansy's own screen has an axe violation. */
export async function noViolations(page: Page, name: string): Promise<void> {
  const results = await page.evaluate(async (source) => {
    const w = window as AxeWindow
    if (!w.axe) new Function(source)()
    return w.axe!.run(document)
  }, axeSource)
  expect(results.violations, `${name}: ${JSON.stringify(results.violations, null, 2)}`).toEqual([])
}

/** Runs code inside the site view and returns its result. */
export const inSite = <R>(app: ElectronApplication, code: string): Promise<R> =>
  app.evaluate(({ BrowserWindow }, code) => {
    const [win] = BrowserWindow.getAllWindows()
    const view = win?.contentView.children[0] as Electron.WebContentsView | undefined
    if (!view) throw new Error('no site view')
    return view.webContents.executeJavaScript(code) as Promise<R>
  }, code)

export const siteView = (app: ElectronApplication) =>
  app.evaluate(({ BrowserWindow }) => {
    const [win] = BrowserWindow.getAllWindows()
    const view = win?.contentView.children[0] as Electron.WebContentsView | undefined
    if (!view) throw new Error('no site view')
    return {
      zoom: Math.round(view.webContents.getZoomFactor() * 1000) / 1000,
      muted: view.webContents.isAudioMuted(),
      bounds: view.getBounds(),
    }
  })

/** Presses Tab inside the site, the way a person at the keyboard would. */
export const tabInSite = (app: ElectronApplication, times = 1): Promise<void> =>
  app.evaluate(async ({ BrowserWindow }, times) => {
    const [win] = BrowserWindow.getAllWindows()
    const view = win?.contentView.children[0] as Electron.WebContentsView | undefined
    if (!view) throw new Error('no site view')
    view.webContents.focus()
    for (let i = 0; i < times; i += 1) {
      view.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Tab' })
      view.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Tab' })
      await new Promise((resolve) => setTimeout(resolve, 150))
    }
  }, times)

/** A row's accessible name is its title plus its badge ("On", "Coming next"), so match the start. */
export const card = (page: Page, name: string) =>
  page.getByRole('button', { name: new RegExp('^' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) })
