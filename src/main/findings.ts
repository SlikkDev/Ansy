import { app } from 'electron'
import { randomUUID } from 'node:crypto'
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { isFinding, type Finding, type FindingDraft, type FindingPatch } from '../shared/findings'
import { sanitizeSteps, type KeyStep } from '../shared/replay'

/**
 * The findings on disk: a JSON list in the app's data folder, and one PNG per
 * screenshot beside it. Written atomically on every change, like the settings.
 * Nothing here ever leaves the computer unless the owner exports a report.
 */
export class FindingsStore {
  private items: Finding[]
  private readonly file: string
  /** Where the screenshots live, and where the report is laid out before printing. */
  readonly dir: string
  private readonly listeners = new Set<(findings: Finding[]) => void>()

  constructor(base = app.getPath('userData')) {
    this.file = join(base, 'findings.json')
    this.dir = join(base, 'findings')
    this.items = this.read()
  }

  list(): Finding[] {
    return this.items.map((f) => ({ ...f }))
  }

  get(id: string): Finding | null {
    const found = this.items.find((f) => f.id === id)
    return found ? { ...found } : null
  }

  add(draft: FindingDraft, png: Buffer | null, steps: KeyStep[] | null = null): Finding {
    const id = randomUUID()
    let screenshot = false
    if (draft.screenshot && png) {
      try {
        mkdirSync(this.dir, { recursive: true })
        writeFileSync(this.screenshotPath(id), png)
        screenshot = true
      } catch (error) {
        console.error('Could not save the screenshot', error)
      }
    }
    const { screenshot: _wanted, ...rest } = draft
    const finding: Finding = { ...rest, id, at: Date.now(), screenshot, retest: null, steps }
    this.items = [finding, ...this.items]
    this.write()
    return { ...finding }
  }

  update(id: string, patch: FindingPatch): Finding | null {
    const index = this.items.findIndex((f) => f.id === id)
    const current = this.items[index]
    if (!current) return null
    const next: Finding = { ...current, ...patch }
    this.items = this.items.map((f) => (f.id === id ? next : f))
    this.write()
    return { ...next }
  }

  remove(id: string): boolean {
    if (!this.items.some((f) => f.id === id)) return false
    this.items = this.items.filter((f) => f.id !== id)
    rmSync(this.screenshotPath(id), { force: true })
    this.write()
    return true
  }

  screenshotPath(id: string): string {
    return join(this.dir, `${id}.png`)
  }

  readScreenshot(id: string): Buffer | null {
    const finding = this.items.find((f) => f.id === id)
    if (!finding?.screenshot) return null
    try {
      return readFileSync(this.screenshotPath(id))
    } catch {
      return null
    }
  }

  onChange(listener: (findings: Finding[]) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private read(): Finding[] {
    try {
      const raw: unknown = JSON.parse(readFileSync(this.file, 'utf8'))
      return Array.isArray(raw)
        ? raw.filter(isFinding).map((f) => ({ ...f, steps: sanitizeSteps(f.steps) }))
        : []
    } catch {
      return []
    }
  }

  private write(): void {
    try {
      mkdirSync(join(this.file, '..'), { recursive: true })
      const tmp = `${this.file}.tmp`
      writeFileSync(tmp, JSON.stringify(this.items, null, 2))
      renameSync(tmp, this.file)
    } catch (error) {
      console.error('Could not save the findings', error)
    }
    for (const listener of this.listeners) listener(this.list())
  }
}
