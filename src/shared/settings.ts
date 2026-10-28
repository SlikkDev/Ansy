import { isLocale } from './i18n'
import { defaultSettings, type Settings, type ThemeSetting } from './ipc'

const THEMES: ReadonlySet<ThemeSetting> = new Set<ThemeSetting>(['dark', 'light', 'system'])

/** Keeps only the fields we know, with valid values; anything else falls back to the default. */
export function sanitizeSettings(raw: unknown): Settings {
  const next: Settings = { ...defaultSettings }
  if (!raw || typeof raw !== 'object') return next
  const r = raw as Record<string, unknown>
  if (r.locale === 'system' || isLocale(r.locale)) next.locale = r.locale
  if (typeof r.theme === 'string' && THEMES.has(r.theme as ThemeSetting)) {
    next.theme = r.theme as ThemeSetting
  }
  if (typeof r.updateCheck === 'boolean') next.updateCheck = r.updateCheck
  return next
}
