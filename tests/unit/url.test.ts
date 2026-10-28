import { describe, expect, it } from 'vitest'
import { displayAddress, isWebUrl, normalizeAddress } from '../../src/shared/url'

describe('normalizeAddress', () => {
  it('adds https to a bare host', () => {
    expect(normalizeAddress('example.com')).toBe('https://example.com/')
    expect(normalizeAddress('  shop.example.co.il/cart ')).toBe('https://shop.example.co.il/cart')
    expect(normalizeAddress('localhost:3000')).toBe('https://localhost:3000/')
    expect(normalizeAddress('127.0.0.1:8080/x')).toBe('https://127.0.0.1:8080/x')
  })

  it('keeps http and https as typed', () => {
    expect(normalizeAddress('http://example.com')).toBe('http://example.com/')
    expect(normalizeAddress('https://example.com/a?b=1#c')).toBe('https://example.com/a?b=1#c')
  })

  it('refuses anything that is not a web page', () => {
    expect(normalizeAddress('file:///etc/passwd')).toBeNull()
    expect(normalizeAddress('javascript:alert(1)')).toBeNull()
    expect(normalizeAddress('data:text/html,hi')).toBeNull()
    expect(normalizeAddress('chrome://settings')).toBeNull()
    expect(normalizeAddress('')).toBeNull()
    expect(normalizeAddress('hello world')).toBeNull()
    expect(normalizeAddress('justaword')).toBeNull()
  })

  it('accepts Hebrew domain names', () => {
    expect(normalizeAddress('דוגמה.ישראל')).toMatch(/^https:\/\/xn--/)
  })
})

describe('isWebUrl', () => {
  it('is true only for absolute http(s) URLs', () => {
    expect(isWebUrl('https://a.b')).toBe(true)
    expect(isWebUrl('http://a.b')).toBe(true)
    expect(isWebUrl('ftp://a.b')).toBe(false)
    expect(isWebUrl('a.b')).toBe(false)
  })
})

describe('displayAddress', () => {
  it('drops the scheme and a lone trailing slash', () => {
    expect(displayAddress('https://example.com/')).toBe('example.com')
    expect(displayAddress('https://example.com/shop?x=1')).toBe('example.com/shop?x=1')
  })
})
