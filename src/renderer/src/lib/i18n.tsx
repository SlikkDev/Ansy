import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { dirOf, translate, type Locale, type MessageKey, type Vars } from '../../../shared/i18n'

export type T = (key: MessageKey, vars?: Vars) => string

interface I18n {
  locale: Locale
  dir: 'ltr' | 'rtl'
  t: T
}

const I18nContext = createContext<I18n | null>(null)

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const value = useMemo<I18n>(
    () => ({ locale, dir: dirOf(locale), t: (key, vars) => translate(locale, key, vars) }),
    [locale],
  )
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18n {
  const value = useContext(I18nContext)
  if (!value) throw new Error('useI18n needs an I18nProvider')
  return value
}

export function useT(): T {
  return useI18n().t
}

/** Writes lang and dir onto <html>, which flips the layout and the font stack. */
export function applyLocale(locale: Locale): void {
  document.documentElement.lang = locale
  document.documentElement.dir = dirOf(locale)
}
