import type { Locale } from '../../../shared/i18n'
import { translate } from '../../../shared/i18n'
import { useT } from '../lib/i18n'
import type { ResolvedTheme } from '../lib/theme'
import { Moon, Sun } from './Icons'

/** Offers the other language, named in that language, exactly like the project site. */
export function LangSwitch({
  locale,
  onChange,
}: {
  locale: Locale
  onChange: (next: Locale) => void
}) {
  const other: Locale = locale === 'he' ? 'en' : 'he'
  return (
    <button type="button" className="btn" lang={other} onClick={() => onChange(other)}>
      {translate(other, `lang.${other}`)}
    </button>
  )
}

export function ThemeToggle({ theme, onToggle }: { theme: ResolvedTheme; onToggle: () => void }) {
  const t = useT()
  const light = theme === 'light'
  return (
    <button
      type="button"
      className="btn btn-icon"
      onClick={onToggle}
      aria-pressed={light}
      aria-label={t('toolbar.theme')}
      title={t('toolbar.theme')}
    >
      {light ? <Sun /> : <Moon />}
    </button>
  )
}
