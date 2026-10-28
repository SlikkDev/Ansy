/// <reference lib="dom" />
import {
  _electron as electron,
  expect,
  test,
  type ElectronApplication,
  type Page,
} from '@playwright/test'
import { readFileSync } from 'node:fs'
import { mkdtemp, readFile } from 'node:fs/promises'
import { createServer, type Server } from 'node:http'
import { tmpdir } from 'node:os'
import { extname, join, normalize } from 'node:path'

const fixtures = join(__dirname, '..', 'fixtures', 'sample-shop')
const types: Record<string, string> = { '.html': 'text/html; charset=utf-8' }

let app: ElectronApplication
let page: Page
let server: Server
let shop: string

const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8')
type AxeWindow = Window & { axe?: { run(context: Document): Promise<{ violations: unknown[] }> } }

const noViolations = async (name: string) => {
  const results = await page.evaluate(async (source) => {
    const w = window as AxeWindow
    if (!w.axe) new Function(source)()
    return w.axe!.run(document)
  }, axeSource)
  expect(results.violations, `${name}: ${JSON.stringify(results.violations, null, 2)}`).toEqual([])
}

/** Runs code inside the site view and returns its result. */
const inSite = <R>(code: string): Promise<R> =>
  app.evaluate(({ BrowserWindow }, code) => {
    const [win] = BrowserWindow.getAllWindows()
    const view = win?.contentView.children[0] as Electron.WebContentsView | undefined
    if (!view) throw new Error('no site view')
    return view.webContents.executeJavaScript(code) as Promise<R>
  }, code)

const siteView = () =>
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

/** The colour of the "Buy now" button as painted, so vision emulation can be checked for real. */
const buyButtonPixel = async () => {
  const bgra = await app.evaluate(async ({ BrowserWindow }) => {
    const [win] = BrowserWindow.getAllWindows()
    const view = win?.contentView.children[0] as Electron.WebContentsView | undefined
    if (!view) throw new Error('no site view')
    const rect = (await view.webContents.executeJavaScript(
      'JSON.stringify(document.querySelector(".buy").getBoundingClientRect())',
    )) as string
    const r = JSON.parse(rect) as { x: number; y: number; width: number; height: number }
    const image = await view.webContents.capturePage({
      x: Math.round(r.x + r.width / 2),
      y: Math.round(r.y + r.height / 2),
      width: 1,
      height: 1,
    })
    return Array.from(image.toBitmap().subarray(0, 4))
  })
  // Electron bitmaps are BGRA.
  return { r: bgra[2] ?? 0, g: bgra[1] ?? 0, b: bgra[0] ?? 0 }
}

/** A row's accessible name is its title plus its badge ("On", "Coming next"), so match the start. */
const card = (name: string) =>
  page.getByRole('button', { name: new RegExp('^' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) })
const turnOn = () => page.getByRole('button', { name: 'Turn on' })
const turnOff = () => page.getByRole('button', { name: 'Turn off' })

test.beforeAll(async () => {
  server = createServer(async (req, res) => {
    const file =
      normalize(new URL(req.url ?? '/', 'http://x').pathname).replace(/^\/+/, '') || 'index.html'
    try {
      const body = await readFile(join(fixtures, file))
      res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' })
      res.end(body)
    } catch {
      res.writeHead(404).end('not found')
    }
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('no port')
  shop = `http://127.0.0.1:${address.port}/`

  const userData = await mkdtemp(join(tmpdir(), 'ansy-e2e-exp-'))
  const args = ['.']
  if (process.getuid?.() === 0) args.push('--no-sandbox')
  app = await electron.launch({
    args,
    env: { ...process.env, ANSY_USER_DATA: userData, LANG: 'en_US.UTF-8' },
  })
  page = await app.firstWindow()
  await page.waitForLoadState('domcontentloaded')

  const addressBar = page.getByRole('textbox', { name: 'Site address' })
  await addressBar.fill(shop)
  await addressBar.press('Enter')
  await expect(page.locator('[aria-live="polite"]').first()).toHaveText('Sample shop')
})

test.afterAll(async () => {
  await app?.close()
  server?.close()
})

test('every experience opens as a task card, and the three later ones say so', async () => {
  await card('Color blindness').click()
  await expect(page.getByRole('button', { name: 'Color blindness' })).toHaveAttribute(
    'aria-expanded',
    'true',
  )
  await expect(page.getByText('What to look for')).toBeVisible()
  await expect(page.getByText('Close to the real thing')).toBeVisible()
  await noViolations('colour blindness card')

  await card('Ansy Reader (screen reader)').click()
  await expect(page.getByText('Coming in a later step.').first()).toBeVisible()
  // Opening a row closes the other; the later ones have nothing to switch on yet.
  await expect(turnOn()).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Color blindness' })).toHaveAttribute(
    'aria-expanded',
    'false',
  )
})

test('colour blindness repaints the site through Chromium', async () => {
  const before = await buyButtonPixel()
  expect(before.r).toBeGreaterThan(200)
  expect(before.g).toBeLessThan(120)

  await card('Color blindness').click()
  await page.getByRole('radio', { name: /No color at all/ }).check()
  await turnOn().click()
  await expect(page.getByRole('status')).toHaveText('Color blindness is on')
  await expect
    .poll(async () => {
      const { r, g, b } = await buyButtonPixel()
      return Math.max(r, g, b) - Math.min(r, g, b)
    })
    .toBeLessThan(12)

  await turnOff().click()
  await expect(page.getByRole('status')).toHaveText('Color blindness is off')
  await expect.poll(async () => (await buyButtonPixel()).r).toBeGreaterThan(200)
})

test('zoom scales the site, and the narrow option shows it 320 pixels wide', async () => {
  await card('Zoom to 200% and 400%').click()
  await page.getByRole('radio', { name: '400%' }).check()
  await turnOn().click()
  await expect.poll(async () => (await siteView()).zoom).toBe(4)

  await page.getByRole('radio', { name: /320 pixels wide/ }).check()
  await expect.poll(async () => (await siteView()).bounds.width).toBe(320)
  await expect.poll(async () => (await siteView()).zoom).toBe(1)
  await expect.poll(() => inSite<number>('innerWidth')).toBe(320)
  await noViolations('narrow view')

  await turnOff().click()
  await expect.poll(async () => (await siteView()).bounds.width).toBeGreaterThan(600)
})

test('large text doubles the default size and spaces the text', async () => {
  await card('Large text and wider spacing').click()
  await turnOn().click()
  await expect.poll(() => inSite<string>('getComputedStyle(document.body).fontSize')).toBe('32px')
  await expect
    .poll(() => inSite<string>('getComputedStyle(document.querySelector("p")).lineHeight'))
    .toBe('48px')

  await page.getByRole('checkbox', { name: /Wider spacing/ }).uncheck()
  await expect
    .poll(() => inSite<string>('getComputedStyle(document.querySelector("p")).letterSpacing'))
    .toBe('normal')

  // The browser setting survives a reload, like a real user's does.
  await page.getByRole('button', { name: 'Reload' }).click()
  await expect.poll(() => inSite<string>('getComputedStyle(document.body).fontSize')).toBe('32px')

  await turnOff().click()
  await expect.poll(() => inSite<string>('getComputedStyle(document.body).fontSize')).toBe('16px')
})

test('high contrast forces system colours', async () => {
  await card('High contrast').click()
  await turnOn().click()
  await expect
    .poll(() => inSite<boolean>('matchMedia("(forced-colors: active)").matches'))
    .toBe(true)
  await expect
    .poll(() => inSite<boolean>('matchMedia("(prefers-contrast: more)").matches'))
    .toBe(true)
  await turnOff().click()
  await expect
    .poll(() => inSite<boolean>('matchMedia("(forced-colors: active)").matches'))
    .toBe(false)
})

test('motion sensitivity asks for less motion and counts what keeps moving', async () => {
  await card('Motion sensitivity').click()
  await turnOn().click()
  await expect
    .poll(() => inSite<boolean>('matchMedia("(prefers-reduced-motion: reduce)").matches'))
    .toBe(true)
  await expect(page.getByText('1 animations still running')).toBeVisible({ timeout: 10_000 })
  await expect(page.getByText('1 media playing by themselves')).toBeVisible()
  await noViolations('motion card with findings')
  await turnOff().click()
})

test('no sound mutes the site and checks for captions', async () => {
  await card('No sound').click()
  await turnOn().click()
  await expect.poll(async () => (await siteView()).muted).toBe(true)
  await expect(page.getByText('2 video or audio elements')).toBeVisible({ timeout: 10_000 })
  await expect(page.getByText('1 without captions')).toBeVisible()

  // Switching straight to another experience turns this one off.
  await card('Blurred vision and low contrast').click()
  await turnOn().click()
  await expect(page.getByRole('status')).toHaveText('Blurred vision and low contrast is on')
  await expect.poll(async () => (await siteView()).muted).toBe(false)
  await expect(page.locator('.badge-on')).toHaveCount(1)
  await turnOff().click()
})

test('the cards read in Hebrew too', async () => {
  await page.getByRole('button', { name: 'עברית' }).click()
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await card('עיוורון צבעים').click()
  await expect(page.getByText('למה לשים לב')).toBeVisible()
  await page.getByRole('button', { name: 'הפעלה' }).click()
  await expect(page.getByRole('status')).toHaveText('עיוורון צבעים: פעיל')
  await noViolations('Hebrew card, on')
  await page.getByRole('button', { name: 'כיבוי' }).click()
  await page.getByRole('button', { name: 'English' }).click()
})
