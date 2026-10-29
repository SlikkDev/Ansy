import { describe, expect, it } from 'vitest'
import { normalizeSpoken, parseVoiceCommand, spokenTarget } from '../../src/shared/voice'

describe('parseVoiceCommand', () => {
  it('clicks by name, the way dictation writes it', () => {
    expect(parseVoiceCommand('Click Buy now.')).toEqual({ kind: 'click', name: 'buy now' })
    expect(parseVoiceCommand('press on Contact')).toEqual({ kind: 'click', name: 'contact' })
    expect(parseVoiceCommand('לחץ על קנה עכשיו')).toEqual({ kind: 'click', name: 'קנה עכשיו' })
  })

  it('clicks by number, spoken or written, or a number alone', () => {
    expect(parseVoiceCommand('click 12')).toEqual({ kind: 'clickNumber', number: 12 })
    expect(parseVoiceCommand('tap three')).toEqual({ kind: 'clickNumber', number: 3 })
    expect(parseVoiceCommand('4')).toEqual({ kind: 'clickNumber', number: 4 })
    expect(parseVoiceCommand('לחץ על חמש')).toEqual({ kind: 'clickNumber', number: 5 })
  })

  it('shows and hides numbers, and scrolls, in both languages', () => {
    expect(parseVoiceCommand('Show numbers')).toEqual({ kind: 'showNumbers' })
    expect(parseVoiceCommand('הצג מספרים')).toEqual({ kind: 'showNumbers' })
    expect(parseVoiceCommand('hide numbers')).toEqual({ kind: 'hideNumbers' })
    expect(parseVoiceCommand('scroll up')).toEqual({ kind: 'scroll', direction: 'up' })
    expect(parseVoiceCommand('גלול למטה')).toEqual({ kind: 'scroll', direction: 'down' })
  })

  it('types the words as said, case and all', () => {
    expect(parseVoiceCommand('type Dana Levi')).toEqual({ kind: 'type', text: 'Dana Levi' })
    expect(parseVoiceCommand('הקלד שלום')).toEqual({ kind: 'type', text: 'שלום' })
  })

  it('says when it does not understand', () => {
    expect(parseVoiceCommand('make me a sandwich')).toEqual({ kind: 'unknown' })
    expect(parseVoiceCommand('  ')).toEqual({ kind: 'unknown' })
  })
})

describe('spokenTarget', () => {
  it('quotes the name back as it was said', () => {
    expect(spokenTarget('click Add to basket.')).toBe('Add to basket')
    expect(spokenTarget('Click on Home')).toBe('Home')
    expect(spokenTarget('לחץ על קנה')).toBe('קנה')
  })
})

describe('normalizeSpoken', () => {
  it('ignores case, punctuation, spacing and Hebrew points', () => {
    expect(normalizeSpoken('  Buy   now! ')).toBe('buy now')
    expect(normalizeSpoken('אָנְסִי')).toBe('אנסי')
    expect(normalizeSpoken('Add-to-basket')).toBe('add to basket')
  })
})
