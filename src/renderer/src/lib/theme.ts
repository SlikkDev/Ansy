import type { ThemeSetting } from '../../../shared/ipc'

export type ResolvedTheme = 'dark' | 'light'

const systemDark = () => window.matchMedia('(prefers-color-scheme: dark)')

export function resolveTheme(setting: ThemeSetting): ResolvedTheme {
  if (setting === 'system') return systemDark().matches ? 'dark' : 'light'
  return setting
}

/** Writes the theme onto <html> so every token resolves before React paints. */
export function applyTheme(setting: ThemeSetting): ResolvedTheme {
  const resolved = resolveTheme(setting)
  document.documentElement.setAttribute('data-theme', resolved)
  return resolved
}

/** Re-applies a "system" theme when the operating system switches. Returns an unsubscribe. */
export function followSystemTheme(
  getSetting: () => ThemeSetting,
  onChange: (t: ResolvedTheme) => void,
) {
  const media = systemDark()
  const listener = () => {
    if (getSetting() === 'system') onChange(applyTheme('system'))
  }
  media.addEventListener('change', listener)
  return () => media.removeEventListener('change', listener)
}
