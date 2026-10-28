import { describe, expect, it } from 'vitest'
import {
  findingHeadline,
  forSite,
  isFinding,
  keyboardRules,
  sanitizeFindingDraft,
  sanitizeFindingPatch,
  siteKeyOf,
  sitesOf,
  type Finding,
} from '../../src/shared/findings'
import { en } from '../../src/shared/i18n/en'

const finding = (patch: Partial<Finding>): Finding => ({
  id: 'id',
  at: 1,
  kind: 'note',
  url: 'https://shop.example/page',
  title: 'Page',
  experience: null,
  task: null,
  note: '',
  severity: 'owner',
  rule: null,
  element: null,
  screenshot: false,
  retest: null,
  ...patch,
})

describe('sanitizeFindingDraft', () => {
  it('keeps a full draft and trims what is too long', () => {
    const draft = sanitizeFindingDraft({
      kind: 'scan',
      url: 'https://shop.example/',
      title: 'Shop',
      experience: 'scan',
      task: 'form',
      note: '  Could not tell which field was wrong.  ',
      severity: 'critical',
      rule: {
        id: 'label',
        help: 'Form elements must have labels',
        description: 'x',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/label',
        wcag: ['4.1.2', 7],
        level: 'A',
      },
      element: { target: 'input[name="coupon"]', html: '<input name="coupon">' },
      screenshot: true,
      extra: 'dropped',
    })
    expect(draft).toEqual({
      kind: 'scan',
      url: 'https://shop.example/',
      title: 'Shop',
      experience: 'scan',
      task: 'form',
      note: 'Could not tell which field was wrong.',
      severity: 'critical',
      rule: {
        id: 'label',
        help: 'Form elements must have labels',
        description: 'x',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/label',
        wcag: ['4.1.2'],
        level: 'A',
      },
      element: { target: 'input[name="coupon"]', html: '<input name="coupon">' },
      screenshot: true,
    })
    expect(
      sanitizeFindingDraft({ kind: 'note', url: 'https://a/', note: 'x'.repeat(6000) })?.note,
    ).toHaveLength(5000)
  })

  it('falls back on what it does not know', () => {
    const draft = sanitizeFindingDraft({
      kind: 'keyboard',
      url: 'https://a/',
      experience: 'teleport',
      task: 'nope',
      severity: 'awful',
      rule: { help: 'no id' },
      element: { html: 'no target' },
      screenshot: 'yes',
    })
    expect(draft).toMatchObject({
      experience: null,
      task: null,
      severity: 'owner',
      rule: null,
      element: null,
      screenshot: false,
    })
  })

  it('refuses what cannot be a finding', () => {
    expect(sanitizeFindingDraft(null)).toBeNull()
    expect(sanitizeFindingDraft({ kind: 'note' })).toBeNull()
    expect(sanitizeFindingDraft({ kind: 'wish', url: 'https://a/' })).toBeNull()
  })
})

describe('sanitizeFindingPatch', () => {
  it('keeps the note and a well-formed re-test only', () => {
    expect(
      sanitizeFindingPatch({
        note: ' edited ',
        retest: { at: 5, outcome: 'fixed', by: 'owner' },
        id: 'nope',
      }),
    ).toEqual({ note: 'edited', retest: { at: 5, outcome: 'fixed', by: 'owner' } })
    expect(sanitizeFindingPatch({ retest: { at: 5, outcome: 'maybe', by: 'owner' } })).toEqual({})
    expect(sanitizeFindingPatch({ retest: null })).toEqual({ retest: null })
    expect(sanitizeFindingPatch('x')).toEqual({})
  })
})

describe('isFinding', () => {
  it('accepts what the store writes and nothing less', () => {
    expect(isFinding(finding({}))).toBe(true)
    expect(isFinding({ ...finding({}), id: 1 })).toBe(false)
    expect(isFinding({ ...finding({}), url: '' })).toBe(false)
  })
})

describe('sites', () => {
  const list = [
    finding({ id: 'a', at: 1, url: 'https://old.example/x' }),
    finding({ id: 'b', at: 3, url: 'https://shop.example:8443/y' }),
    finding({ id: 'c', at: 2, url: 'https://shop.example:8443/z' }),
  ]

  it('groups by host and lists the newest site first', () => {
    expect(siteKeyOf('https://shop.example:8443/y?q=1')).toBe('shop.example:8443')
    expect(siteKeyOf('not a url')).toBe('not a url')
    expect(sitesOf(list)).toEqual(['shop.example:8443', 'old.example'])
  })

  it('filters one site, newest first', () => {
    expect(forSite(list, 'shop.example:8443').map((f) => f.id)).toEqual(['b', 'c'])
    expect(forSite(list, null).map((f) => f.id)).toEqual(['b', 'c', 'a'])
  })
})

describe('findingHeadline', () => {
  it('prefers the rule, then the first line of the note', () => {
    expect(findingHeadline({ rule: null, note: 'First line\nsecond' })).toBe('First line')
    expect(
      findingHeadline({
        rule: { id: 'x', help: 'Rule title', description: '', helpUrl: '', wcag: [], level: null },
        note: 'ignored',
      }),
    ).toBe('Rule title')
    expect(findingHeadline({ rule: null, note: 'x'.repeat(120) })).toHaveLength(90)
  })
})

describe('keyboardRules', () => {
  it('each has an explanation in the string table and a WCAG criterion', () => {
    for (const rule of Object.values(keyboardRules)) {
      expect(en).toHaveProperty(`rule.${rule.id}`)
      expect(rule.wcag[0]).toMatch(/^\d\.\d\.\d+$/)
    }
  })
})
