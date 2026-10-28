/// <reference lib="dom" />
import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { card, launchAnsy, noViolations, tabInSite, type Harness } from './harness'

let h: Harness

test.beforeAll(async () => {
  h = await launchAnsy('ansy-e2e-find-')
  await h.openShop()
})

test.afterAll(async () => {
  await h?.close()
})

const tab = (name: string) => h.page.getByRole('tab', { name })
const dialog = () => h.page.getByRole('dialog', { name: 'Save a finding' })
const findings = () => h.page.locator('[data-finding]')
const stored = async () =>
  JSON.parse(await readFile(join(h.userData, 'findings.json'), 'utf8')) as {
    id: string
    [key: string]: unknown
  }[]

/** Answers the next native save dialog with this path. */
const saveTo = (filePath: string) =>
  h.app.evaluate(({ dialog }, filePath) => {
    dialog.showSaveDialog = async () => ({ canceled: false, filePath })
  }, filePath)

/** How many pages a PDF has: the page tree's count. */
const pdfPages = (pdf: Buffer) =>
  Math.max(...[...pdf.toString('latin1').matchAll(/\/Count (\d+)/g)].map((m) => Number(m[1])))

test('a finding made during a keyboard-only task reaches a PDF', async () => {
  // Start "Fill in a form" and try it with keyboard only.
  await tab('Tasks').click()
  await noViolations(h.page, 'tasks tab')
  const form = h.page.locator('[data-task="form"]')
  await form.getByRole('button', { name: 'Start this task' }).click()
  await expect(form.getByText('Current task')).toBeVisible()
  await form.getByRole('button', { name: 'Turn on Keyboard only' }).click()
  await expect(tab('Experiences')).toHaveAttribute('aria-selected', 'true')
  await expect(h.page.getByRole('status')).toHaveText('Keyboard only is on')

  // Tab into the trap, then save what Ansy noticed as a finding.
  await tabInSite(h.app, 9)
  await expect(h.page.getByText('Tab gets stuck here')).toBeVisible()
  await h.page
    .locator('li')
    .filter({ hasText: 'A widget that keeps Tab' })
    .last()
    .getByRole('button', { name: 'Save as finding' })
    .click()

  await expect(dialog()).toBeVisible()
  await expect(dialog()).toContainText('Tab gets stuck here')
  await expect(dialog()).toContainText('WCAG 2.1.2, level A')
  await expect(dialog()).toContainText('Once Tab lands here, it cannot leave.')
  await expect(dialog().getByRole('combobox', { name: 'Task' })).toHaveValue('form')
  await expect(dialog().getByRole('combobox', { name: 'Experience' })).toHaveValue('keyboard')
  await expect(dialog().getByRole('img', { name: 'The page as it looks now' })).toBeVisible()
  await noViolations(h.page, 'capture dialog')
  await dialog()
    .getByRole('textbox', { name: 'Your note' })
    .fill('Pressed Tab on the widget and it never left. Had to reload the page.')
  await dialog().getByRole('button', { name: 'Save finding' }).click()
  await expect(dialog()).toBeHidden()

  // The Findings tab opens on it.
  await expect(tab('Findings')).toHaveAttribute('aria-selected', 'true')
  await expect(h.page.getByText('1 finding', { exact: true })).toBeVisible()
  const first = findings().first()
  await expect(first).toContainText('Tab gets stuck here')
  await expect(first).toContainText('Critical')
  await expect(first).toContainText('WCAG 2.1.2, level A')
  await expect(first).toContainText('Keyboard only · Fill in a form')
  await expect(first).toContainText('Pressed Tab on the widget')
  await first.getByText('Show the screenshot').click()
  await expect(first.getByRole('img')).toBeVisible()
  await noViolations(h.page, 'findings tab')

  // On disk: the list, and the screenshot beside it.
  const list = await stored()
  expect(list).toHaveLength(1)
  expect(list[0]).toMatchObject({
    kind: 'keyboard',
    task: 'form',
    experience: 'keyboard',
    severity: 'critical',
    screenshot: true,
    rule: { id: 'keyboard-trap', wcag: ['2.1.2'] },
    element: { target: '#trap' },
  })
  const png = await readFile(join(h.userData, 'findings', `${list[0]!.id}.png`))
  expect(png.subarray(1, 4).toString()).toBe('PNG')

  // A second finding, noted by the owner with no help from Ansy.
  await h.page.getByRole('button', { name: 'Note a finding' }).click()
  await dialog().getByRole('button', { name: 'Save finding' }).click()
  await expect(dialog().getByText('Write what you noticed first.')).toBeVisible()
  await dialog()
    .getByRole('textbox', { name: 'Your note' })
    .fill('The phone number is an image, so I could not copy it.')
  await dialog().getByRole('button', { name: 'Save finding' }).click()
  await expect(h.page.getByText('2 findings')).toBeVisible()
  await expect(findings().first()).toContainText('Reported by the owner')

  // The PDF: a cover, a page per finding, a closing page.
  const pdfPath = join(h.userData, 'report.pdf')
  await saveTo(pdfPath)
  await h.page.getByRole('button', { name: 'Export PDF…' }).click()
  await expect(h.page.getByText(`Saved to ${pdfPath}`)).toBeVisible({ timeout: 30_000 })
  const pdf = await readFile(pdfPath)
  expect(pdf.subarray(0, 5).toString()).toBe('%PDF-')
  expect(pdfPages(pdf)).toBe(4)

  // The text report ends with the Slikk.Dev line, until that is turned off.
  const txtPath = join(h.userData, 'report.txt')
  await saveTo(txtPath)
  await h.page.getByRole('button', { name: 'Save as text…' }).click()
  await expect(h.page.getByText(`Saved to ${txtPath}`)).toBeVisible()
  const text = await readFile(txtPath, 'utf8')
  expect(text).toContain('Accessibility findings for 127.0.0.1:')
  expect(text).toContain('Finding 1 of 2: The phone number is an image, so I could not copy it.')
  expect(text).toContain('Finding 2 of 2: Tab gets stuck here')
  expect(text).toContain('Task: Fill in a form')
  expect(text).toContain('It cannot certify that your site meets WCAG')
  expect(text).toContain('Ask Slikk.Dev to fix this: https://slikk.dev/')

  await h.page.getByRole('checkbox', { name: /Ask Slikk\.Dev to fix this/ }).uncheck()
  await h.page.getByRole('button', { name: 'Copy as text' }).click()
  await expect(h.page.getByText('Copied.')).toBeVisible()
  const copied = await h.app.evaluate(({ clipboard }) => clipboard.readText())
  expect(copied).toContain('Finding 2 of 2: Tab gets stuck here')
  expect(copied).not.toContain('slikk.dev')
  expect(copied).toContain('Made with Ansy, free and open source')
  await expect
    .poll(async () => JSON.parse(await readFile(join(h.userData, 'settings.json'), 'utf8')))
    .toMatchObject({ slikkLink: false })
})

test('check again reopens the page and tells fixed from still there', async () => {
  // A scan finding: the image without alt.
  await tab('Experiences').click()
  const off = h.page.getByRole('button', { name: 'Turn off' })
  if (await off.isVisible()) await off.click()
  await card(h.page, 'Automatic scan').click()
  await h.page.getByRole('button', { name: 'Scan this page' }).click()
  const imageAlt = h.page.locator('[data-rule="image-alt"]')
  await expect(imageAlt).toBeVisible({ timeout: 20_000 })
  await imageAlt.getByText('1 element').click()
  await imageAlt.getByRole('button', { name: 'Save as finding' }).click()
  await expect(dialog()).toContainText('This image has no text alternative')
  await expect(dialog().getByRole('combobox', { name: 'Task' })).toHaveValue('form')
  await dialog().getByRole('button', { name: 'Save finding' }).click()
  await expect(h.page.getByText('3 findings')).toBeVisible()
  const scanFinding = findings().filter({ hasText: 'This image has no text alternative' })
  await expect(scanFinding).toContainText('Automatic scan · Fill in a form')

  // Still there: the page is reopened with the scan on, and the rule fails on the element again.
  await scanFinding.getByRole('button', { name: 'Check again' }).click()
  await expect(scanFinding.getByText('Still there')).toBeVisible({ timeout: 30_000 })

  // Fixed: the server now sends the image with an alt.
  const page = await readFile(
    join(__dirname, '..', 'fixtures', 'sample-shop', 'index.html'),
    'utf8',
  )
  h.serve('index.html', page.replace('<img\n      src=', '<img\n      alt="A red mug"\n      src='))
  await scanFinding.getByRole('button', { name: 'Check again' }).click()
  await expect(scanFinding.getByText('Fixed')).toBeVisible({ timeout: 30_000 })
  h.serve('index.html', null)
  expect((await stored()).find((f) => f.kind === 'scan')?.retest).toMatchObject({
    outcome: 'fixed',
    by: 'ansy',
  })

  // A trap is for the owner to judge: Ansy reopens the page and asks.
  const trap = findings().filter({ hasText: 'Tab gets stuck here' })
  await trap.getByRole('button', { name: 'Check again' }).click()
  await expect(trap.getByText('Ansy couldn’t tell')).toBeVisible({ timeout: 30_000 })
  // The experience came back on in the (hidden) Experiences tab, so the owner can look.
  await expect(h.page.locator('[role="status"]')).toHaveText('Keyboard only is on')
  await trap.getByRole('button', { name: 'Still there' }).click()
  await expect(trap.locator('.badge', { hasText: 'Still there' })).toBeVisible()
  expect((await stored()).find((f) => f.kind === 'keyboard')?.retest).toMatchObject({
    outcome: 'failing',
    by: 'owner',
  })

  // Delete asks once, then the finding and its screenshot are gone.
  await trap.getByRole('button', { name: 'Delete' }).click()
  await trap.getByRole('button', { name: 'Delete for good' }).click()
  await expect(h.page.getByText('2 findings')).toBeVisible()
  expect(await stored()).toHaveLength(2)
})

test('the findings read in Hebrew too', async () => {
  await h.page.getByRole('button', { name: 'עברית' }).click()
  await tab('ממצאים').click()
  await expect(h.page.getByText('2 ממצאים')).toBeVisible()
  await expect(findings().first()).toContainText('סריקה אוטומטית · למלא טופס')
  await expect(findings().first()).toContainText('WCAG 1.1.1 (רמה A)')
  await noViolations(h.page, 'Hebrew findings')
  await tab('משימות').click()
  await expect(h.page.getByRole('heading', { name: 'משימות מודרכות' })).toBeVisible()
  await noViolations(h.page, 'Hebrew tasks')
  await h.page.getByRole('button', { name: 'English' }).click()
})
