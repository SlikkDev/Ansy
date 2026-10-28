import { app } from 'electron'
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { defaultSettings, type Settings } from '../shared/ipc'
import { sanitizeSettings } from '../shared/settings'

/**
 * Settings on disk. Read once at startup, written atomically on every change.
 * A corrupt file is ignored rather than crashing the app.
 */
export class SettingsStore {
  private current: Settings
  private readonly file: string
  private readonly listeners = new Set<(settings: Settings) => void>()

  constructor(dir = app.getPath('userData')) {
    this.file = join(dir, 'settings.json')
    this.current = this.read()
  }

  get(): Settings {
    return { ...this.current }
  }

  set(patch: Partial<Settings>): Settings {
    this.current = sanitizeSettings({ ...this.current, ...patch })
    this.write()
    for (const listener of this.listeners) listener(this.get())
    return this.get()
  }

  onChange(listener: (settings: Settings) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private read(): Settings {
    try {
      return sanitizeSettings(JSON.parse(readFileSync(this.file, 'utf8')))
    } catch {
      return { ...defaultSettings }
    }
  }

  private write(): void {
    try {
      mkdirSync(join(this.file, '..'), { recursive: true })
      const tmp = `${this.file}.tmp`
      writeFileSync(tmp, JSON.stringify(this.current, null, 2))
      renameSync(tmp, this.file)
    } catch (error) {
      console.error('Could not save settings', error)
    }
  }
}
