import { describe, expect, it } from 'vitest'
import { ALLOWED_EXTERNAL, isAllowedExternal } from '../../src/main/links'

describe('isAllowedExternal', () => {
  it('opens the listed sites and pages under them', () => {
    expect(isAllowedExternal(ALLOWED_EXTERNAL.slikk)).toBe(true)
    expect(isAllowedExternal('https://slikk.dev/?utm_source=ansy')).toBe(true)
    expect(isAllowedExternal('https://github.com/SlikkDev/Ansy/releases')).toBe(true)
    expect(
      isAllowedExternal('https://dequeuniversity.com/rules/axe/4.10/image-alt?application=axeAPI'),
    ).toBe(true)
  })

  it('opens nothing else', () => {
    expect(isAllowedExternal('https://slikk.dev.evil.example/')).toBe(false)
    expect(isAllowedExternal('https://github.com/SlikkDev/Other')).toBe(false)
    expect(isAllowedExternal('https://dequeuniversity.com/')).toBe(false)
    expect(isAllowedExternal('http://slikk.dev/')).toBe(false)
  })
})
