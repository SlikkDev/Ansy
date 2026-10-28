/// <reference lib="dom" />
import { expect, test } from '@playwright/test'
import { card, inSite, launchAnsy, noViolations, tabInSite, type Harness } from './harness'

let h: Harness

test.beforeAll(async () => {
  h = await launchAnsy('ansy-e2e-ks-')
  await h.openShop()
})

test.afterAll(async () => {
  await h?.close()
})

const overlayPresent = () =>
  inSite<boolean>(h.app, '!!document.querySelector("[data-ansy-overlay]")')
const buyPointerEvents = () =>
  inSite<string>(h.app, 'getComputedStyle(document.querySelector(".buy")).pointerEvents')

test('keyboard only takes the mouse away, numbers the stops and notices what the keyboard cannot do', async () => {
  await card(h.page, 'Keyboard only').click()
  await h.page.getByRole('button', { name: 'Turn on' }).click()
  await expect(h.page.getByRole('status')).toHaveText('Keyboard only is on')
  await expect.poll(overlayPresent).toBe(true)
  await expect.poll(buyPointerEvents).toBe('none')

  // Before a single key is pressed, the clickable div is already listed.
  await expect(h.page.getByText('Clickable, but the keyboard can’t reach it')).toBeVisible()
  await expect(h.page.getByText('div “Add to wishlist”')).toBeVisible()

  // Home, Contact, email, coupon, Buy now.
  await tabInSite(h.app, 5)
  await expect(h.page.getByText('5 focus stops so far')).toBeVisible()
  await expect.poll(() => inSite<string>(h.app, 'document.activeElement.className')).toBe('buy')

  // The terms link has no focus style; leaving it records that. Then the trap.
  await tabInSite(h.app, 2)
  await expect(h.page.getByText('Focus shows nothing here')).toBeVisible()
  await expect(h.page.getByText('a “terms”')).toBeVisible()
  await tabInSite(h.app, 2)
  await expect(h.page.getByText('Tab gets stuck here')).toBeVisible()
  await expect(h.page.getByText('div “A widget that keeps Tab”')).toBeVisible()
  await expect(h.page.getByText('7 focus stops so far')).toBeVisible()
  await noViolations(h.page, 'keyboard card with findings')

  await h.page.getByRole('button', { name: 'Show on page' }).first().click()
  await expect
    .poll(() => inSite<boolean>(h.app, '!!document.querySelector("[data-ansy-highlight]")'))
    .toBe(true)

  await h.page.getByRole('button', { name: 'Clear the trail' }).click()
  await expect(
    h.page.getByText('No stops yet. Tab through the site and the trail appears.'),
  ).toBeVisible()

  // The mouse comes back on request; the overlay goes with the experience.
  await h.page.getByRole('checkbox', { name: 'Take the mouse away too' }).uncheck()
  await expect.poll(buyPointerEvents).toBe('auto')
  await h.page.getByRole('button', { name: 'Turn off' }).click()
  await expect.poll(overlayPresent).toBe(false)
})

test('the scan explains what axe found in plain words, with the WCAG number', async () => {
  await card(h.page, 'Automatic scan').click()
  await h.page.getByRole('button', { name: 'Scan this page' }).click()
  await expect(h.page.getByText(/^\d+ problems on \d+ elements$/)).toBeVisible({ timeout: 20_000 })

  const imageAlt = h.page.locator('[data-rule="image-alt"]')
  await expect(imageAlt).toContainText('This image has no text alternative')
  await expect(imageAlt).toContainText('WCAG 1.1.1, level A')
  await expect(imageAlt.locator('.badge-critical')).toHaveText('Critical')
  await expect(h.page.locator('[data-rule="label"]')).toContainText('This form field has no label')
  await expect(h.page.locator('[data-rule="video-caption"]')).toContainText(
    'This video has no captions',
  )
  await expect(h.page.locator('[data-rule="color-contrast"]')).toContainText('2 elements')
  await expect(h.page.getByText(/^\d+ checks passed$/)).toBeVisible()
  await noViolations(h.page, 'scan results')

  // Show on page rings the element in the site.
  await imageAlt.getByText('1 element').click()
  await imageAlt.getByRole('button', { name: 'Show on page' }).click()
  await expect
    .poll(() => inSite<boolean>(h.app, '!!document.querySelector("[data-ansy-highlight]")'))
    .toBe(true)

  // Fix one thing on the page and scan again: it drops out, the rest stay.
  await inSite(h.app, 'document.querySelector("img").alt = "A red mug"')
  await h.page.getByRole('button', { name: 'Scan again' }).click()
  await expect(imageAlt).toHaveCount(0, { timeout: 20_000 })
  await expect(h.page.locator('[data-rule="label"]')).toBeVisible()

  // A new page is scanned by itself.
  await inSite(h.app, 'location.href = "contact.html"')
  await expect(h.page.getByText(/^\d+ problems on \d+ elements$/)).toBeVisible({ timeout: 20_000 })
  await expect(h.page.locator('[data-rule="label"]')).toHaveCount(0)
  await h.page.getByRole('button', { name: 'Turn off' }).click()
  await h.page.getByRole('button', { name: 'Back' }).click()
  await expect(h.page.locator('[aria-live="polite"]').first()).toHaveText('Sample shop')
})

test('the scan reads in Hebrew too', async () => {
  await h.page.getByRole('button', { name: 'עברית' }).click()
  // The row is still open from the last test; opening it again would close it.
  const row = card(h.page, 'סריקה אוטומטית')
  if ((await row.getAttribute('aria-expanded')) !== 'true') await row.click()
  await h.page.getByRole('button', { name: 'סריקת העמוד' }).click()
  const label = h.page.locator('[data-rule="label"]')
  await expect(label).toContainText('לשדה הטופס הזה אין תווית', { timeout: 20_000 })
  await expect(label).toContainText('WCAG 4.1.2, רמה A')
  await expect(label.locator('.badge-critical')).toHaveText('קריטי')
  await noViolations(h.page, 'Hebrew scan results')
  await h.page.getByRole('button', { name: 'כיבוי' }).click()
  await h.page.getByRole('button', { name: 'English' }).click()
})
