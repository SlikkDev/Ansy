/// <reference lib="dom" />
import {
  _electron as electron,
  expect,
  test,
  type ElectronApplication,
  type Page,
} from '@playwright/test'
import { createServer, type Server } from 'node:http'
import { readFileSync } from 'node:fs'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { extname, join, normalize } from 'node:path'

const fixtures = join(__dirname, '..', 'fixtures', 'sample-shop')
const types: Record<string, string> = { '.html': 'text/html; charset=utf-8' }

let app: ElectronApplication
let page: Page
let server: Server
let shop: string
let userData: string

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

  userData = await mkdtemp(join(tmpdir(), 'ansy-e2e-'))
  const args = ['.']
  if (process.getuid?.() === 0) args.push('--no-sandbox')
  app = await electron.launch({
    args,
    env: { ...process.env, ANSY_USER_DATA: userData, LANG: 'en_US.UTF-8' },
  })
  page = await app.firstWindow()
  await page.waitForLoadState('domcontentloaded')
})

test.afterAll(async () => {
  await app?.close()
  server?.close()
})

// axe runs straight in the page: @axe-core/playwright wants a second page for
// its final pass, and an Electron window cannot open one.
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

test('starts in English with the welcome card', async () => {
  await expect(page).toHaveTitle('Ansy')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Your website looks great. To you.',
  )
  await noViolations('welcome, dark, English')
})

test('refuses an address that is not a web page', async () => {
  const address = page.getByRole('textbox', { name: 'Site address' })
  await address.fill('file:///etc/passwd')
  await address.press('Enter')
  await expect(page.getByRole('alert')).toContainText('doesn’t look like a web address')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test('opens a site and reports its title', async () => {
  const address = page.getByRole('textbox', { name: 'Site address' })
  await address.fill(shop)
  await address.press('Enter')
  // The first live region is the site's status; the panel's tabs have their own.
  await expect(page.locator('[aria-live="polite"]').first()).toHaveText('Sample shop')
  await expect(address).toHaveValue(/127\.0\.0\.1:\d+$/)
  await expect(page.getByRole('button', { name: 'Reload' })).toBeEnabled()
  await expect(page.getByRole('button', { name: 'Back' })).toBeDisabled()

  const views = await app.evaluate(({ BrowserWindow }) => {
    const [win] = BrowserWindow.getAllWindows()
    return (win?.contentView.children ?? []).map((v) => ({
      title: 'webContents' in v ? (v as Electron.WebContentsView).webContents.getTitle() : '',
      bounds: v.getBounds(),
      visible: v.getVisible(),
    }))
  })
  expect(views).toHaveLength(1)
  expect(views[0]).toMatchObject({ title: 'Sample shop', visible: true })

  // The native view sits exactly over the frame the interface leaves for it.
  const frame = await page.locator('main').boundingBox()
  expect(frame).not.toBeNull()
  expect(views[0]?.bounds).toEqual({
    x: Math.round(frame!.x),
    y: Math.round(frame!.y),
    width: Math.round(frame!.width),
    height: Math.round(frame!.height),
  })
})

test('shows its own error card when a page cannot load', async () => {
  const address = page.getByRole('textbox', { name: 'Site address' })
  await address.fill('http://127.0.0.1:1/')
  await address.press('Enter')
  await expect(page.getByRole('heading', { name: 'Ansy couldn’t open this page' })).toBeVisible()
  await noViolations('error card')
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(page.getByRole('heading', { name: 'Ansy couldn’t open this page' })).toBeVisible()
})

test('switches to Hebrew, right to left, and back', async () => {
  await page.getByRole('button', { name: 'עברית' }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'he')
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(page.getByRole('heading', { name: 'חוויות' })).toBeVisible()
  await noViolations('Hebrew')
  await page.getByRole('button', { name: 'English' }).click()
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
})

test('About carries the disclaimer and the licence, in both themes', async () => {
  // The app follows the system theme by default, which this machine may set either way.
  const html = page.locator('html')
  const first = (await html.getAttribute('data-theme')) === 'light' ? 'light' : 'dark'
  const second = first === 'light' ? 'dark' : 'light'

  await page.getByRole('button', { name: 'About Ansy' }).click()
  const dialog = page.getByRole('dialog', { name: 'About Ansy' })
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('It cannot certify that your site meets WCAG')
  await expect(dialog).toContainText('MIT License')
  await expect(dialog.getByRole('button', { name: /Built by Slikk\.Dev/ })).toBeVisible()
  await noViolations(`about, ${first}`)
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()

  const themeButton = page.getByRole('button', { name: 'Light theme' })
  await expect(themeButton).toHaveAttribute('aria-pressed', String(first === 'light'))
  await themeButton.click()
  await expect(html).toHaveAttribute('data-theme', second)
  await expect(themeButton).toHaveAttribute('aria-pressed', String(second === 'light'))
  await page.getByRole('button', { name: 'About Ansy' }).click()
  await noViolations(`about, ${second}`)
  await page.getByRole('button', { name: 'Close' }).click()
  await noViolations(`shell, ${second}`)
  await themeButton.click()
  await expect(html).toHaveAttribute('data-theme', first)
})

test('writes the language choice to settings.json', async () => {
  const read = async () => {
    try {
      return JSON.parse(await readFile(join(userData, 'settings.json'), 'utf8'))
    } catch {
      return null
    }
  }
  await page.getByRole('button', { name: 'עברית' }).click()
  await expect.poll(read).toMatchObject({ locale: 'he' })
  await page.getByRole('button', { name: 'English' }).click()
  await expect.poll(read).toMatchObject({ locale: 'en' })
})
