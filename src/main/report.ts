import { app, BrowserWindow, dialog, type SaveDialogOptions } from 'electron'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import heebo from '../renderer/assets/fonts/heebo-hebrew-wght-normal.woff2?inline'
import inter from '../renderer/assets/fonts/inter-latin-wght-normal.woff2?inline'
import outfit from '../renderer/assets/fonts/outfit-latin-wght-normal.woff2?inline'
import type { Finding } from '../shared/findings'
import type { ExportFormat, ExportResult } from '../shared/ipc'
import { htmlReport, plainTextReport, type ReportOptions } from '../shared/report'
import { pinToApp } from './security'
import type { FindingsStore } from './findings'

/** The brand fonts, inlined so the PDF looks the same on every machine and nothing is fetched. */
const face = (family: string, data: string) =>
  `@font-face{font-family:'${family}';font-style:normal;font-weight:100 900;src:url(${data}) format('woff2-variations')}`
export const fontsCss = [face('Outfit', outfit), face('Inter', inter), face('Heebo', heebo)].join(
  '\n',
)

/** How long the hidden window gets to lay the report out before it is printed. */
const RENDER_TIMEOUT = 30_000

/**
 * Prints HTML to PDF in a hidden, sandboxed window with no scripts. The file is
 * laid out next to the screenshots so they load by relative path.
 */
export async function renderPdf(html: string, dir: string): Promise<Buffer> {
  mkdirSync(dir, { recursive: true })
  const file = join(dir, 'report.html')
  writeFileSync(file, html)
  const win = new BrowserWindow({
    show: false,
    width: 900,
    height: 1200,
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      javascript: false,
      devTools: false,
    },
  })
  pinToApp(win.webContents)
  try {
    await Promise.race([
      win.loadFile(file),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('The report took too long to lay out')), RENDER_TIMEOUT),
      ),
    ])
    // Fonts from data URLs are decoded by now; one more tick lets the images settle.
    await new Promise((resolve) => setTimeout(resolve, 250))
    return await win.webContents.printToPDF({
      pageSize: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
    })
  } finally {
    win.destroy()
    rmSync(file, { force: true })
  }
}

const fileStem = (site: string, at: number) =>
  `ansy-findings-${site.replace(/[^a-z0-9.-]+/gi, '_')}-${new Date(at).toISOString().slice(0, 10)}`

/** Builds the report the owner asked for and saves it where they say. */
export async function exportFindings(
  owner: BrowserWindow,
  store: FindingsStore,
  findings: readonly Finding[],
  format: ExportFormat,
  options: ReportOptions,
): Promise<ExportResult> {
  if (!findings.length) return { ok: false, canceled: false }
  const now = options.now ?? Date.now()
  const stem = fileStem(options.site, now)
  const ask: SaveDialogOptions =
    format === 'pdf'
      ? {
          defaultPath: join(app.getPath('documents'), `${stem}.pdf`),
          filters: [{ name: 'PDF', extensions: ['pdf'] }],
        }
      : {
          defaultPath: join(app.getPath('documents'), `${stem}.txt`),
          filters: [{ name: 'Text', extensions: ['txt'] }],
        }
  const { canceled, filePath } = await dialog.showSaveDialog(owner, ask)
  if (canceled || !filePath) return { ok: false, canceled: true }

  if (format === 'text') {
    writeFileSync(filePath, plainTextReport(findings, { ...options, now }))
    return { ok: true, path: filePath }
  }
  const html = htmlReport(findings, {
    ...options,
    now,
    fontsCss,
    screenshotSrc: (finding) => (finding.screenshot ? `${finding.id}.png` : null),
  })
  const pdf = await renderPdf(html, store.dir)
  writeFileSync(filePath, pdf)
  return { ok: true, path: filePath }
}
