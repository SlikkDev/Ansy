import { describe, expect, it } from 'vitest'
import type { Finding } from '../../src/shared/findings'
import { translate, type MessageKey } from '../../src/shared/i18n'
import {
  keyCodeFor,
  keyLabel,
  KeyTrail,
  MAX_STEPS,
  sanitizeSteps,
  stepFor,
  stepForReaderCommand,
  stepsSummary,
  type KeyPress,
} from '../../src/shared/replay'
import { stepsLabel } from '../../src/shared/report'

const press = (code: string, extra: Partial<KeyPress> = {}): KeyPress => ({
  code,
  shift: false,
  control: false,
  meta: false,
  ...extra,
})

describe('stepFor', () => {
  it('keeps the keys that move around a page, with their modifiers', () => {
    expect(stepFor(press('Tab'), false)).toEqual({ code: 'Tab' })
    expect(stepFor(press('Tab', { shift: true }), false)).toEqual({ code: 'Tab', shift: true })
    expect(stepFor(press('NumpadEnter'), false)).toEqual({ code: 'Enter' })
    expect(stepFor(press('Home', { meta: true }), true)).toEqual({ code: 'Home', ctrl: true })
    expect(stepFor(press('ArrowDown'), false)).toEqual({ code: 'ArrowDown' })
  })

  it('never keeps what is typed into the page', () => {
    expect(stepFor(press('KeyH'), false)).toBeNull()
    expect(stepFor(press('Digit3'), false)).toBeNull()
    expect(stepFor(press('KeyA'), true)).toBeNull()
    expect(stepFor(press('Backspace'), false)).toBeNull()
  })

  it('keeps the reader quick keys the reader took', () => {
    expect(stepFor(press('KeyH'), true)).toEqual({ code: 'KeyH' })
    expect(stepFor(press('Digit2', { shift: true }), true)).toEqual({
      code: 'Digit2',
      shift: true,
    })
  })
})

describe('stepForReaderCommand', () => {
  it('turns the card buttons into the keys that do the same', () => {
    expect(stepForReaderCommand({ kind: 'first' })).toEqual({ code: 'Home', ctrl: true })
    expect(stepForReaderCommand({ kind: 'last' })).toEqual({ code: 'End', ctrl: true })
    expect(stepForReaderCommand({ kind: 'activate' })).toEqual({ code: 'Enter' })
    expect(stepForReaderCommand({ kind: 'move', target: null, dir: -1 })).toEqual({
      code: 'ArrowUp',
    })
    expect(stepForReaderCommand({ kind: 'move', target: 'link', dir: 1 })).toEqual({
      code: 'KeyK',
    })
    expect(stepForReaderCommand({ kind: 'move', target: 'heading', dir: -1, level: 2 })).toEqual({
      code: 'Digit2',
      shift: true,
    })
    expect(stepForReaderCommand({ kind: 'refresh' })).toBeNull()
  })
})

describe('keyCodeFor', () => {
  it('names keys the way sendInputEvent wants them', () => {
    expect(keyCodeFor('Tab')).toBe('Tab')
    expect(keyCodeFor('ArrowDown')).toBe('Down')
    expect(keyCodeFor('KeyH')).toBe('h')
    expect(keyCodeFor('Digit3')).toBe('3')
    expect(keyCodeFor('F5')).toBeNull()
  })
})

describe('sanitizeSteps', () => {
  it('keeps well-formed steps and drops anything else', () => {
    expect(sanitizeSteps([{ code: 'Tab', shift: true, extra: 1 }, { code: 'KeyB' }])).toEqual([
      { code: 'Tab', shift: true },
      { code: 'KeyB' },
    ])
    expect(sanitizeSteps([])).toEqual([])
    expect(sanitizeSteps(undefined)).toBeNull()
    expect(sanitizeSteps([{ code: 'F12' }])).toBeNull()
    expect(sanitizeSteps(['Tab'])).toBeNull()
    expect(sanitizeSteps(Array.from({ length: MAX_STEPS + 1 }, () => ({ code: 'Tab' })))).toBeNull()
  })
})

describe('stepsSummary', () => {
  it('writes the keys short, a run of one key counted once', () => {
    expect(keyLabel({ code: 'Home', ctrl: true })).toBe('Ctrl+Home')
    expect(keyLabel({ code: 'Tab', shift: true })).toBe('Shift+Tab')
    expect(keyLabel({ code: 'ArrowDown' })).toBe('↓')
    expect(
      stepsSummary([
        ...Array.from({ length: 9 }, () => ({ code: 'Tab' })),
        { code: 'Tab', shift: true },
        { code: 'Enter' },
        { code: 'KeyH' },
        { code: 'KeyH' },
      ]),
    ).toBe('Tab ×9, Shift+Tab, Enter, H ×2')
  })

  it('reads in both languages, with the keys kept in order', () => {
    const finding = { steps: [{ code: 'Tab' }, { code: 'Tab' }] } as Finding
    const t = (locale: 'en' | 'he') => (key: MessageKey, vars?: Record<string, string | number>) =>
      translate(locale, key, vars)
    expect(stepsLabel(finding, t('en'))).toBe('Open the page, then press: ⁦Tab ×2⁩.')
    expect(stepsLabel(finding, t('he'))).toBe('פותחים את העמוד ולוחצים: ⁦Tab ×2⁩.')
    expect(stepsLabel({ steps: [] } as unknown as Finding, t('en'))).toBeNull()
    expect(stepsLabel({} as Finding, t('en'))).toBeNull()
  })
})

describe('KeyTrail', () => {
  it('belongs to one page, and gives up on a walk too long to replay', () => {
    const trail = new KeyTrail()
    trail.start('http://shop.test/')
    trail.push({ code: 'Tab' })
    trail.push(null)
    expect(trail.for('http://shop.test/#terms')).toEqual([{ code: 'Tab' }])
    expect(trail.for('http://shop.test/checkout')).toBeNull()
    for (let i = 0; i < MAX_STEPS; i += 1) trail.push({ code: 'Tab' })
    expect(trail.for('http://shop.test/')).toBeNull()
    trail.start('http://shop.test/checkout')
    expect(trail.for('http://shop.test/checkout')).toEqual([])
  })
})
