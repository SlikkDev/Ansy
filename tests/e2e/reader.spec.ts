/// <reference lib="dom" />
import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { card, inSite, launchAnsy, noViolations, tabInSite, type Harness } from './harness'

let h: Harness

test.beforeAll(async () => {
  h = await launchAnsy('ansy-e2e-reader-')
  await h.openShop()
})

test.afterAll(async () => {
  await h?.close()
})

/** Presses one key inside the site, the way a screen reader user would. */
const keyInSite = (keyCode: string, modifiers: string[] = []) =>
  h.app.evaluate(
    async ({ BrowserWindow }, { keyCode, modifiers }) => {
      const [win] = BrowserWindow.getAllWindows()
      const view = win?.contentView.children[0] as Electron.WebContentsView | undefined
      if (!view) throw new Error('no site view')
      view.webContents.focus()
      view.webContents.sendInputEvent({ type: 'keyDown', keyCode, modifiers })
      view.webContents.sendInputEvent({ type: 'keyUp', keyCode, modifiers })
      await new Promise((resolve) => setTimeout(resolve, 150))
    },
    { keyCode, modifiers: modifiers as Electron.InputEvent['modifiers'] },
  )

/** Types text inside the site, character by character. */
const typeInSite = (text: string) =>
  h.app.evaluate(async ({ BrowserWindow }, text) => {
    const [win] = BrowserWindow.getAllWindows()
    const view = win?.contentView.children[0] as Electron.WebContentsView | undefined
    if (!view) throw new Error('no site view')
    view.webContents.focus()
    for (const char of text) {
      view.webContents.sendInputEvent({ type: 'keyDown', keyCode: char })
      view.webContents.sendInputEvent({ type: 'char', keyCode: char })
      view.webContents.sendInputEvent({ type: 'keyUp', keyCode: char })
      await new Promise((resolve) => setTimeout(resolve, 40))
    }
  }, text)

const lastLine = () => h.page.locator('[data-transcript] li').last()
const current = () => h.page.locator('[data-reader-current]')
const coverPosition = () =>
  inSite<string>(h.app, 'getComputedStyle(document.documentElement, "::after").position')

test('Ansy Reader reads the shop in order, jumps by kind, and shows every word in the transcript', async () => {
  await card(h.page, 'Ansy Reader (screen reader)').click()
  await h.page.getByRole('button', { name: 'Turn on' }).click()
  await expect(h.page.getByRole('status')).toHaveText('Ansy Reader (screen reader) is on')
  await expect(lastLine()).toHaveText(
    'Sample shop. Page loaded. Headings: 1. Links: 4. Form fields: 6. Landmarks: 1.',
  )
  // A bare container has no voice; the card says so and keeps the transcript.
  await expect(h.page.getByText(/^No English voice is installed/)).toBeVisible()
  await expect(h.page.getByText('Browse mode: the keys move the reader')).toBeVisible()
  await noViolations(h.page, 'reader card')

  await keyInSite('Down')
  await expect(lastLine()).toHaveText('Sample shop, heading level 1')
  await expect(current()).toHaveText('Sample shop, heading level 1')
  await keyInSite('Down')
  await expect(lastLine()).toHaveText(
    'A small shop built with the usual mistakes, for trying the experiences on. Nothing is sold.',
  )
  await keyInSite('k')
  await expect(lastLine()).toHaveText('Home, link')
  await keyInSite('k')
  await expect(lastLine()).toHaveText('Contact, link')
  await keyInSite('f')
  await expect(lastLine()).toHaveText('Email, edit, blank')
  await keyInSite('f')
  // The unlabelled coupon field: a screen reader says "edit" and nothing more.
  await expect(lastLine()).toContainText('edit, blank')
  await expect(lastLine().locator('.badge')).toHaveText('A form field with no label')
  await keyInSite('g')
  await expect(lastLine()).toHaveText('graphic An image with no text alternative')
  await keyInSite('H', ['shift'])
  await expect(lastLine()).toHaveText('Sample shop, heading level 1')
  await keyInSite('h')
  await expect(lastLine()).toHaveText('No next heading')
  await keyInSite('End', ['control'])
  await expect(lastLine()).toHaveText('Low contrast legal text that is hard to read.')
  await keyInSite('Down')
  await expect(lastLine()).toHaveText('Bottom')
  await keyInSite('Home', ['control'])
  await expect(lastLine()).toHaveText('Sample shop, heading level 1')

  // The buttons on the card make the same moves.
  await h.page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(lastLine()).toHaveText(
    'A small shop built with the usual mistakes, for trying the experiences on. Nothing is sold.',
  )
  await h.page.getByRole('button', { name: 'Previous' }).click()
  await expect(lastLine()).toHaveText('Sample shop, heading level 1')

  // What the reader stumbled on, with the same two links as a keyboard finding.
  await expect(h.page.locator('[data-reader-finding="reader-field-name"]')).toContainText(
    'A form field with no label: edit (no name)',
  )
  await expect(h.page.locator('[data-reader-finding="reader-image-name"]')).toContainText(
    'An image with no text alternative: graphic (no name)',
  )
  await h.page
    .locator('[data-reader-finding="reader-image-name"]')
    .getByRole('button', { name: 'Show on page' })
    .click()
  await expect
    .poll(() => inSite<boolean>(h.app, '!!document.querySelector("[data-ansy-highlight]")'))
    .toBe(true)
})

test('Enter activates, Tab is followed, and a text field takes the keys until Escape', async () => {
  await keyInSite('b')
  await expect(lastLine()).toHaveText('Buy now, button')
  await keyInSite('Enter')
  await expect(lastLine()).toHaveText(
    'Checkout. Page loaded. Headings: 3. Links: 3. Form fields: 7. Landmarks: 4.',
    { timeout: 10_000 },
  )

  // Tab moves the page's own focus; the reader follows it.
  await tabInSite(h.app)
  await expect(lastLine()).toHaveText('Sample shop, link')

  // Enter on a text field hands it the keyboard; the letters go in, not to the reader.
  await keyInSite('e')
  await expect(lastLine()).toHaveText('Name, edit, blank')
  await keyInSite('Enter')
  await expect(lastLine()).toHaveText('Focus mode')
  await expect(h.page.getByText('Focus mode: the keys go to the field')).toBeVisible()
  await typeInSite('Dana')
  await expect
    .poll(() => inSite<string>(h.app, 'document.getElementById("name").value'))
    .toBe('Dana')
  await keyInSite('Escape')
  await expect(lastLine()).toHaveText('Browse mode')
  await keyInSite('e')
  await expect(lastLine()).toHaveText('Email, edit, blank')
  expect(await inSite<string>(h.app, 'document.getElementById("name").value')).toBe('Dana')

  // The headings, the table, the list and the unnamed button, as a visitor hears them.
  await keyInSite('3', ['shift'])
  await expect(lastLine()).toHaveText('Your order, heading level 3 A heading that skips a level')
  await keyInSite('t')
  await expect(lastLine()).toHaveText('table with 3 rows and 2 columns')
  await keyInSite('L', ['shift'])
  await expect(lastLine()).toHaveText('list with 2 items')
  await keyInSite('f')
  await keyInSite('f')
  await keyInSite('f')
  await keyInSite('f')
  await keyInSite('f')
  await expect(lastLine()).toHaveText('button A button with no name')
  await keyInSite('f')
  await expect(lastLine()).toHaveText('Gift wrap, check box, not checked')
  await keyInSite('Space')
  await expect(lastLine()).toHaveText('Gift wrap, check box, checked')
  await noViolations(h.page, 'reader card with findings')

  // Place the order: a sighted owner could do all of this with the screen covered.
  await h.page.getByRole('checkbox', { name: 'Cover the screen' }).check()
  await expect.poll(coverPosition).toBe('fixed')
  await keyInSite('b')
  await expect(lastLine()).toHaveText('Place order, button')
  await keyInSite('Enter')
  await expect(lastLine()).toHaveText(
    'Thank you. Page loaded. Headings: 1. Links: 1. Form fields: 0. Landmarks: 1.',
    { timeout: 10_000 },
  )
  await expect.poll(coverPosition).toBe('fixed')
  await h.page.getByRole('checkbox', { name: 'Cover the screen' }).uncheck()
  await expect.poll(coverPosition).toBe('static')
})

test('a reader finding is saved like any other and checked again', async () => {
  await h.page.getByRole('button', { name: 'Back' }).click()
  await expect(lastLine()).toHaveText(/^Checkout\. Page loaded/, { timeout: 10_000 })
  // A walk on the page first: the finding keeps it, for "Check again" to replay.
  await keyInSite('Home', ['control'])
  await expect(lastLine()).toHaveText(/landmark/)
  await keyInSite('h')
  await expect(lastLine()).toHaveText('Checkout, heading level 1')
  await h.page
    .locator('[data-reader-finding="reader-button-name"]')
    .getByRole('button', { name: 'Save as finding' })
    .click()
  const dialog = h.page.getByRole('dialog', { name: 'Save a finding' })
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('A button with no name')
  await expect(dialog).toContainText('WCAG 4.1.2, level A')
  await dialog.getByRole('button', { name: 'Save finding' }).click()
  await expect(h.page.getByRole('tab', { name: 'Findings 1' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  const finding = h.page.locator('[data-finding]').first()
  await expect(finding).toContainText('A button with no name')
  await expect(finding).toContainText('Ansy Reader (screen reader)')
  await expect(finding).toContainText('Open the page, then press: \u2066Ctrl+Home, H\u2069.')

  // The provider names the button; check again hears it now.
  const page = readFileSync(
    join(__dirname, '..', '..', 'resources', 'practice-shop', 'checkout.html'),
    'utf8',
  )
  h.serve('checkout.html', page.replace('class="remove"', 'class="remove" aria-label="Remove"'))
  await finding.getByRole('button', { name: 'Check again' }).click()
  await expect(finding).toContainText('Fixed', { timeout: 20_000 })
  h.serve('checkout.html', null)
  await finding.getByRole('button', { name: 'Check again' }).click()
  await expect(finding).toContainText('Still there', { timeout: 20_000 })
  await h.page.getByRole('tab', { name: 'Experiences' }).click()
})

test('the reader speaks Hebrew', async () => {
  await h.page.getByRole('button', { name: 'עברית' }).click()
  await expect(h.page.getByRole('button', { name: 'קריאת העמוד מחדש' })).toBeVisible()
  await keyInSite('Home', ['control'])
  await expect(lastLine()).toHaveText('ציון דרך כותרת עליונה')
  await keyInSite('h')
  await expect(lastLine()).toHaveText('Checkout, כותרת רמה 1')
  await keyInSite('f')
  await expect(lastLine()).toHaveText('Name, עריכה, ריק')
  await expect(h.page.getByText('מצב עיון: המקשים מזיזים את הקורא')).toBeVisible()
  await expect(h.page.locator('[data-reader-finding="reader-button-name"]')).toContainText(
    'כפתור בלי שם: כפתור (בלי שם)',
  )
  await noViolations(h.page, 'Hebrew reader card')
  await h.page.getByRole('button', { name: 'כיבוי' }).click()
  await h.page.getByRole('button', { name: 'English' }).click()
})

test('the practice shop is built in, at ansy://shop/', async () => {
  const address = h.page.getByRole('textbox', { name: 'Site address' })
  await address.fill('ansy://shop/')
  await address.press('Enter')
  await expect(h.page.locator('[aria-live="polite"]').first()).toHaveText('Sample shop')
  expect(await inSite<string>(h.app, 'location.href')).toBe('ansy://shop/')
  await inSite(h.app, 'location.href = "checkout.html"')
  await expect(h.page.locator('[aria-live="polite"]').first()).toHaveText('Checkout')
  expect(await inSite<string>(h.app, 'location.href')).toBe('ansy://shop/checkout.html')
  // Nothing else lives on the scheme.
  await address.fill('ansy://elsewhere/')
  await address.press('Enter')
  await expect(h.page.getByText(/doesn’t look like a web address/)).toBeVisible()
})
