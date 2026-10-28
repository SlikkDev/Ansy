import { describe, expect, it } from 'vitest'
import { defaultSettings } from '../../src/shared/ipc'
import { sanitizeSettings } from '../../src/shared/settings'

describe('sanitizeSettings', () => {
  it('returns the defaults for garbage', () => {
    expect(sanitizeSettings(null)).toEqual(defaultSettings)
    expect(sanitizeSettings('x')).toEqual(defaultSettings)
    expect(sanitizeSettings({ locale: 'fr', theme: 'blue', updateCheck: 'yes' })).toEqual(
      defaultSettings,
    )
  })

  it('keeps valid values and drops unknown fields', () => {
    expect(
      sanitizeSettings({ locale: 'he', theme: 'light', updateCheck: false, extra: 1 }),
    ).toEqual({
      locale: 'he',
      theme: 'light',
      updateCheck: false,
    })
  })
})
