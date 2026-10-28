import { describe, expect, it } from 'vitest'
import { en } from '../../src/shared/i18n/en'
import { he } from '../../src/shared/i18n/he'
import { dirOf, messageKeys, resolveLocale, translate } from '../../src/shared/i18n'

describe('string tables', () => {
  it('have the same keys in English and Hebrew', () => {
    expect(Object.keys(he).sort()).toEqual(Object.keys(en).sort())
  })

  it('never leave a string empty', () => {
    for (const key of messageKeys) {
      expect(en[key].trim(), key).not.toBe('')
      expect(he[key].trim(), key).not.toBe('')
    }
  })

  it('write the Hebrew name with nikud, always', () => {
    const plain = /אנסי/
    for (const key of messageKeys) {
      expect(he[key], `${key}: ${he[key]}`).not.toMatch(plain)
      expect(en[key], `${key}: ${en[key]}`).not.toMatch(plain)
    }
  })

  it('keep the same placeholders in both languages', () => {
    const names = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort()
    for (const key of messageKeys) expect(names(he[key]), key).toEqual(names(en[key]))
  })
})

describe('translate', () => {
  it('fills placeholders and leaves unknown ones alone', () => {
    expect(translate('en', 'about.version', { version: '1.2.3' })).toBe('Version 1.2.3')
    expect(translate('he', 'about.version', { version: '1.2.3' })).toBe('גרסה 1.2.3')
    expect(translate('en', 'about.version')).toBe('Version {version}')
  })
})

describe('resolveLocale', () => {
  it('follows the system language only when asked to', () => {
    expect(resolveLocale('system', 'he-IL')).toBe('he')
    expect(resolveLocale('system', 'iw')).toBe('he')
    expect(resolveLocale('system', 'en-US')).toBe('en')
    expect(resolveLocale('system', 'fr')).toBe('en')
    expect(resolveLocale('en', 'he-IL')).toBe('en')
    expect(resolveLocale('he', 'en-US')).toBe('he')
  })

  it('knows which languages read right to left', () => {
    expect(dirOf('he')).toBe('rtl')
    expect(dirOf('en')).toBe('ltr')
  })
})
