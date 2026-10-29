/// <reference lib="dom" />
import { expect, test, type ElectronApplication, type Page } from '@playwright/test'
import {
  card as cardIn,
  inSite as inSiteOf,
  launchAnsy,
  noViolations as checkNoViolations,
  siteView as siteViewOf,
  type Harness,
} from './harness'

let h: Harness
let app: ElectronApplication
let page: Page

const noViolations = (name: string) => checkNoViolations(page, name)
const inSite = <R>(code: string) => inSiteOf<R>(app, code)
const siteView = () => siteViewOf(app)
const card = (name: string) => cardIn(page, name)
const turnOn = () => page.getByRole('button', { name: 'Turn on' })
const turnOff = () => page.getByRole('button', { name: 'Turn off' })

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

/** A pixel of the site view as painted, near its top corner, where the shop shows only its background. */
const cornerPixel = async () => {
  const bgra = await app.evaluate(async ({ BrowserWindow }) => {
    const [win] = BrowserWindow.getAllWindows()
    const view = win?.contentView.children[0] as Electron.WebContentsView | undefined
    if (!view) throw new Error('no site view')
    const image = await view.webContents.capturePage({ x: 6, y: 6, width: 1, height: 1 })
    return Array.from(image.toBitmap().subarray(0, 4))
  })
  return { r: bgra[2] ?? 0, g: bgra[1] ?? 0, b: bgra[0] ?? 0 }
}

test.beforeAll(async () => {
  h = await launchAnsy('ansy-e2e-exp-')
  ;({ app, page } = h)
  await h.openShop()
})

test.afterAll(async () => {
  await h?.close()
})

test('every experience opens as a task card, one at a time', async () => {
  await card('Color blindness').click()
  await expect(page.getByRole('button', { name: 'Color blindness' })).toHaveAttribute(
    'aria-expanded',
    'true',
  )
  await expect(page.getByText('What to look for')).toBeVisible()
  await expect(page.getByText('Close to the real thing')).toBeVisible()
  await noViolations('colour blindness card')

  await card('Ansy Reader (screen reader)').click()
  await expect(page.getByText('An approximation')).toBeVisible()
  // Opening a row closes the other.
  await expect(turnOn()).toHaveCount(1)
  await expect(page.getByRole('button', { name: 'Color blindness' })).toHaveAttribute(
    'aria-expanded',
    'false',
  )
  await card('Ansy Reader (screen reader)').click()
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

test('the panel groups the experiences by area', async () => {
  for (const area of [
    'Sight and blindness',
    'Low vision and light sensitivity',
    'Moving and clicking',
    'Hearing',
    'Focus and reading',
    'For every visitor',
  ]) {
    await expect(page.getByRole('heading', { name: area, level: 3 })).toBeVisible()
  }
  await expect(
    page.getByRole('region', { name: 'Low vision and light sensitivity' }),
  ).toContainText('Dark mode')
})

test('tunnel vision narrows the view to the mouse, and says it is a rough impression', async () => {
  await card('Tunnel and central vision loss').click()
  await expect(page.getByText('A rough impression', { exact: true })).toBeVisible()
  await expect(page.getByText(/try Zoom to 400% for the tool itself/)).toBeVisible()
  await noViolations('tunnel vision card')
  await turnOn().click()
  await expect
    .poll(() => inSite<boolean>('!!document.querySelector("[data-ansy-overlay]")'))
    .toBe(true)
  // Away from the clear circle, the page is dark.
  await expect.poll(async () => (await cornerPixel()).r).toBeLessThan(40)

  await page.getByRole('radio', { name: /Central loss/ }).check()
  await expect.poll(async () => (await cornerPixel()).r).toBeGreaterThan(200)

  // The overlay goes with the page and comes back on the next one.
  await page.getByRole('button', { name: 'Reload' }).click()
  await expect
    .poll(() => inSite<boolean>('!!document.querySelector("[data-ansy-overlay]")'))
    .toBe(true)
  await turnOff().click()
  await expect
    .poll(() => inSite<boolean>('!!document.querySelector("[data-ansy-overlay]")'))
    .toBe(false)
})

test('cataracts and glare veil the page', async () => {
  await card('Cataracts and glare').click()
  await turnOn().click()
  await expect
    .poll(() =>
      inSite<string>('document.querySelector("[data-ansy-overlay]")?.getAttribute("style") ?? ""'),
    )
    .toContain('sepia')
  await page.getByRole('radio', { name: /Glare/ }).check()
  await expect
    .poll(() =>
      inSite<string>('document.querySelector("[data-ansy-overlay]")?.getAttribute("style") ?? ""'),
    )
    .toContain('brightness(1.4)')
  await turnOff().click()
})

test('dark mode asks for a dark theme, and can darken a site that has none', async () => {
  await card('Dark mode').click()
  await turnOn().click()
  await expect
    .poll(() => inSite<boolean>('matchMedia("(prefers-color-scheme: dark)").matches'))
    .toBe(true)
  await expect(
    page.getByText('The site stayed light: it has no dark theme of its own'),
  ).toBeVisible({ timeout: 10_000 })
  expect((await cornerPixel()).r).toBeGreaterThan(200)

  await page.getByRole('checkbox', { name: /Also darken sites/ }).check()
  await expect.poll(async () => (await cornerPixel()).r).toBeLessThan(60)
  await noViolations('dark mode card, on')

  await turnOff().click()
  await expect.poll(async () => (await cornerPixel()).r).toBeGreaterThan(200)
  await expect
    .poll(() => inSite<boolean>('matchMedia("(prefers-color-scheme: dark)").matches'))
    .toBe(false)
})

/** Sends real input to the site view, the way a person's mouse or key would. */
const sendToSite = (events: Electron.InputEvent[] | object[]) =>
  app.evaluate(async ({ BrowserWindow }, events) => {
    const [win] = BrowserWindow.getAllWindows()
    const view = win?.contentView.children[0] as Electron.WebContentsView | undefined
    if (!view) throw new Error('no site view')
    view.webContents.focus()
    for (const event of events) {
      view.webContents.sendInputEvent(event as Electron.MouseInputEvent)
      await new Promise((resolve) => setTimeout(resolve, 60))
    }
  }, events)

test('tremor shakes the pointer and checks the size of what there is to hit', async () => {
  await card('Tremor and unsteady hands').click()
  await expect(page.getByText('A rough impression', { exact: true })).toBeVisible()
  await turnOn().click()
  // The scan runs the target-size rule alone, and the shop's tiny quantity buttons fail it.
  await expect(page.locator('[data-rule="target-size"]')).toBeVisible({ timeout: 20_000 })
  await expect(page.locator('[data-rule="image-alt"]')).toHaveCount(0)
  await expect(page.getByText('Click around the site and see where the clicks land.')).toBeVisible()
  await noViolations('tremor card')

  await sendToSite([
    { type: 'mouseMove', x: 200, y: 30 },
    { type: 'mouseDown', x: 200, y: 30, button: 'left', clickCount: 1 },
    { type: 'mouseUp', x: 200, y: 30, button: 'left', clickCount: 1 },
  ])
  await expect
    .poll(() =>
      inSite<string>('getComputedStyle(document.querySelector("[data-ansy-tremor]")).display'),
    )
    .toBe('block')
  expect(await inSite<string>('getComputedStyle(document.body).cursor')).toBe('none')
  await expect(page.getByText(/^Clicks: 1\. Landed somewhere else: [01]\.$/)).toBeVisible()

  await turnOff().click()
  await expect
    .poll(() => inSite<boolean>('!!document.querySelector("[data-ansy-tremor]")'))
    .toBe(false)
  expect(await inSite<string>('getComputedStyle(document.body).cursor')).not.toBe('none')
})

test('switch access scans the controls one by one and picks with Space', async () => {
  await card('Switch access').click()
  await turnOn().click()
  await page.getByRole('radio', { name: /Fast/ }).check()
  await expect(page.getByText('Clickable, but the scan never lands on it')).toBeVisible({
    timeout: 10_000,
  })
  await expect(page.getByText('div “Add to wishlist”')).toBeVisible()
  await noViolations('switch access card')

  // Wait for the highlight to rest on the email field, then press the switch.
  const ringOnEmail = `(() => {
    const ring = document.querySelector('[data-ansy-switch] > div')
    const field = document.querySelector('input[name=email]').getBoundingClientRect()
    if (!ring || ring.style.display !== 'block') return false
    const box = ring.getBoundingClientRect()
    return Math.abs(box.left - (field.left - 5)) < 2 && Math.abs(box.top - (field.top - 5)) < 2
  })()`
  await expect.poll(() => inSite<boolean>(ringOnEmail), { intervals: [100] }).toBe(true)
  await sendToSite([
    { type: 'keyDown', keyCode: 'Space' },
    { type: 'keyUp', keyCode: 'Space' },
  ])
  await expect.poll(() => inSite<string>('document.activeElement.name')).toBe('email')
  await expect(page.getByText(/^Moves so far: \d+\. Picks: 1\.$/)).toBeVisible()
  await expect(page.getByText(/^Moves to reach the last pick: \d+$/)).toBeVisible()

  // Escape hands control back from the field, and the scan moves on.
  await sendToSite([
    { type: 'keyDown', keyCode: 'Escape' },
    { type: 'keyUp', keyCode: 'Escape' },
  ])
  await expect.poll(() => inSite<string>('document.activeElement.tagName')).toBe('BODY')

  await page.getByRole('button', { name: 'Start counting again' }).click()
  await expect(page.getByText(/^Moves so far: \d+\. Picks: 0\.$/)).toBeVisible()
  await turnOff().click()
  await expect
    .poll(() => inSite<boolean>('!!document.querySelector("[data-ansy-switch]")'))
    .toBe(false)
})

/** True when the switch highlight rests on the element the selector finds. */
const ringOn = (selector: string) => `(() => {
  const ring = document.querySelector('[data-ansy-switch] > div')
  const el = document.querySelector(${JSON.stringify(selector)})
  if (!ring || !el || ring.style.display !== 'block') return false
  const box = ring.getBoundingClientRect()
  const r = el.getBoundingClientRect()
  return Math.abs(box.left - (r.left - 5)) < 2 && Math.abs(box.top - (r.top - 5)) < 2
})()`

const pressSwitch = () =>
  sendToSite([
    { type: 'keyDown', keyCode: 'Space' },
    { type: 'keyUp', keyCode: 'Space' },
  ])

test('switch access finishes a purchase with a single key', async () => {
  // Still open from the last test; a second click would close it.
  if ((await card('Switch access').getAttribute('aria-expanded')) !== 'true') {
    await card('Switch access').click()
  }
  await turnOn().click()
  await page.getByRole('radio', { name: /Fast/ }).check()
  await expect.poll(() => inSite<boolean>(ringOn('.buy')), { intervals: [100] }).toBe(true)
  await pressSwitch()
  await expect.poll(() => inSite<string>('document.title')).toBe('Checkout')
  await expect
    .poll(() => inSite<boolean>(ringOn('button[type=submit]')), {
      intervals: [100],
      timeout: 20_000,
    })
    .toBe(true)
  await pressSwitch()
  await expect.poll(() => inSite<string>('document.title')).toBe('Thank you')
  await expect(page.getByText(/^Moves so far: \d+\. Picks: 2\.$/)).toBeVisible()
  await turnOff().click()
  await h.openShop()
})

/** Types a command into voice control's box and runs it. */
const say = async (command: string) => {
  const box = page.getByRole('textbox', { name: 'Command' })
  await box.fill(command)
  await box.press('Enter')
  await expect(box).toHaveValue('')
}

test('voice control clicks by name, numbers what it can, and catches a name that differs from the label', async () => {
  await card('Voice control').click()
  await turnOn().click()
  // The label-in-name rule runs on the whole page by itself.
  await expect(page.locator('[data-rule="label-content-name-mismatch"]')).toBeVisible({
    timeout: 20_000,
  })
  await noViolations('voice control card')

  await say('click Add to basket')
  await expect(
    page.getByText(
      /Nothing is named “Add to basket”\. The control that shows those words is named “Purchase item”/,
    ),
  ).toBeVisible()
  await expect(page.getByText('Shows one name, answers to another')).toBeVisible()
  await expect(page.getByText('Shows “Add to basket”, named “Purchase item”')).toBeVisible()

  await say('show numbers')
  await expect(page.getByText(/Numbered \d+ things you can click/)).toBeVisible()
  await expect
    .poll(() => inSite<number>('document.querySelectorAll("[data-ansy-voice] > div").length'))
    .toBeGreaterThan(5)
  await say('hide numbers')
  await expect
    .poll(() => inSite<number>('document.querySelectorAll("[data-ansy-voice] > div").length'))
    .toBe(0)

  await say('click email')
  await say('type dana@example.com')
  await expect
    .poll(() => inSite<string>('document.querySelector("input[name=email]").value'))
    .toBe('dana@example.com')

  // Saved, the miss is a label-in-name finding that Check again runs axe on.
  await page.getByRole('button', { name: 'Save as finding' }).first().click()
  const dialog = page.getByRole('dialog', { name: 'Save a finding' })
  await expect(dialog).toContainText('WCAG 2.5.3, level A')
  await dialog.getByRole('button', { name: 'Save finding' }).click()
  const finding = page.locator('[data-finding]').first()
  await expect(finding).toContainText('Shows one name, answers to another')
  await finding.getByRole('button', { name: 'Check again' }).click()
  await expect(finding).toContainText('Still there', { timeout: 20_000 })
  await page.getByRole('tab', { name: 'Experiences' }).click()

  await say('Click Buy now.')
  await expect.poll(() => inSite<string>('document.title')).toBe('Checkout')
  await expect(page.getByText('Clicked “Buy now”.')).toBeVisible()
  await turnOff().click()
  await expect
    .poll(() => inSite<boolean>('!!document.querySelector("[data-ansy-voice]")'))
    .toBe(false)
  await h.openShop()
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
