import { en, type MessageKey } from './en'
import { he } from './he'

export type { MessageKey }

/** Interface languages. Order is the order they are offered in settings. */
export const locales = ['en', 'he'] as const
export type Locale = (typeof locales)[number]

/** What the settings store: a fixed language, or follow the system. */
export type LocaleSetting = Locale | 'system'

const messages: Record<Locale, Record<MessageKey, string>> = { en, he }

/** Right-to-left languages. Adding Arabic later is one entry here plus a dictionary. */
const rtl: ReadonlySet<Locale> = new Set<Locale>(['he'])

export function dirOf(locale: Locale): 'ltr' | 'rtl' {
  return rtl.has(locale) ? 'rtl' : 'ltr'
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value)
}

/**
 * Picks the interface language from the setting and the system language.
 * `he`, `he-IL` and `iw` (the old code) all mean Hebrew. Anything else is English.
 */
export function resolveLocale(setting: LocaleSetting, systemLocale: string): Locale {
  if (setting !== 'system') return setting
  const tag = systemLocale.toLowerCase()
  if (tag === 'he' || tag.startsWith('he-') || tag === 'iw' || tag.startsWith('iw-')) return 'he'
  return 'en'
}

export type Vars = Record<string, string | number>

/** Looks a string up and fills {placeholders}. Falls back to English, then to the key. */
export function translate(locale: Locale, key: MessageKey, vars?: Vars): string {
  const text = messages[locale][key] ?? en[key] ?? key
  if (!vars) return text
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  )
}

/** All keys, for tests and tooling. */
export const messageKeys = Object.keys(en) as MessageKey[]
