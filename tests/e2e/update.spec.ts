/// <reference lib="dom" />
import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { UpdateStatus } from '../../src/shared/update'
import { launchAnsy, noViolations, type Harness } from './harness'

// The real updater only runs in a packaged build, so the tests feed the
// screens the same status messages the main process would send.
const push = (h: Harness, status: UpdateStatus) =>
  h.app.evaluate(({ BrowserWindow }, status) => {
    BrowserWindow.getAllWindows()[0]?.webContents.send('update:status', status)
  }, status)

test('About Ansy holds the update switch, the status and the privacy note', async () => {
  const h = await launchAnsy('ansy-update-')
  const { page } = h
  await page.getByRole('button', { name: 'About Ansy' }).click()
  const dialog = page.getByRole('dialog', { name: 'About Ansy' })
  await expect(dialog.getByText('Version 1.0.0')).toBeVisible()
  const box = dialog.getByRole('checkbox', { name: 'Check for updates when Ansy starts' })
  await expect(box).toBeChecked()
  // A development build cannot update itself: the status says so and there is nothing to check.
  await expect(
    dialog.getByText('This build is updated by the store or package it came from.'),
  ).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Check now' })).toHaveCount(0)
  await expect(dialog.getByRole('button', { name: 'Privacy note' })).toBeVisible()
  await noViolations(page, 'about with updates')

  await box.uncheck()
  await expect
    .poll(async () => {
      const raw = await readFile(join(h.userData, 'settings.json'), 'utf8').catch(() => '{}')
      return (JSON.parse(raw) as { updateCheck?: boolean }).updateCheck
    })
    .toBe(false)

  // A downloaded update shows in the dialog too, with its restart button.
  await push(h, { phase: 'ready', version: '9.9.9' })
  await expect(dialog.getByText('Ansy 9.9.9 is ready. Restart to update.')).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Restart now' })).toBeVisible()
  await h.close()
})

test('a downloaded update is offered under the toolbar, in both languages', async () => {
  const h = await launchAnsy('ansy-update-')
  const { page } = h
  const bar = page.locator('[data-update-bar]')
  await expect(bar).toHaveCount(0)

  await push(h, { phase: 'ready', version: '9.9.9' })
  await expect(bar).toContainText('Ansy 9.9.9 is ready. Restart to update.')
  await expect(bar.getByRole('button', { name: 'Restart now' })).toBeVisible()
  await noViolations(page, 'update bar')

  // "Later" hides that version for the rest of the session; a newer one is offered again.
  await bar.getByRole('button', { name: 'Later' }).click()
  await expect(bar).toHaveCount(0)
  await push(h, { phase: 'ready', version: '9.9.9' })
  await expect(bar).toHaveCount(0)
  await push(h, { phase: 'ready', version: '9.9.10' })
  await expect(bar).toContainText('9.9.10')

  await page.getByRole('button', { name: 'עברית' }).click()
  await expect(bar).toContainText('אָנְסִי 9.9.10 מוכן. הפעילו מחדש כדי לעדכן.')
  await expect(bar.getByRole('button', { name: 'הפעלה מחדש' })).toBeVisible()
  await noViolations(page, 'update bar, Hebrew')
  await h.close()
})
