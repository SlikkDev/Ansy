// @vitest-environment jsdom
import axe from 'axe-core'
import { describe, expect, it } from 'vitest'
import { scanPageSource } from '../../src/main/scan'
import { keyboardRuleIds } from '../../src/shared/findings'
import { en } from '../../src/shared/i18n/en'
import { he } from '../../src/shared/i18n/he'
import {
  countByImpact,
  criterionFromTag,
  explainedRules,
  isExplainedRule,
  sortIssues,
  toScanIssue,
  wcagFromTags,
  type RawAxeResult,
} from '../../src/shared/scan'

const raw = (over: Partial<RawAxeResult> = {}): RawAxeResult => ({
  id: 'image-alt',
  impact: 'critical',
  help: 'Images must have alternative text',
  description: 'Ensure <img> elements have alternative text',
  helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/image-alt',
  tags: ['cat.text-alternatives', 'wcag2a', 'wcag111', 'section508', 'ACT'],
  nodes: [
    { target: ['img'], html: '<img src="a.png">', failureSummary: 'Fix any of the following' },
  ],
  ...over,
})

describe('WCAG from axe tags', () => {
  it('reads a criterion out of a tag', () => {
    expect(criterionFromTag('wcag143')).toBe('1.4.3')
    expect(criterionFromTag('wcag1412')).toBe('1.4.12')
    expect(criterionFromTag('wcag2aa')).toBeNull()
    expect(criterionFromTag('best-practice')).toBeNull()
  })

  it('collects the criteria in order and the lowest level', () => {
    expect(wcagFromTags(['cat.color', 'wcag2aa', 'wcag143'])).toEqual({
      wcag: ['1.4.3'],
      level: 'AA',
    })
    expect(wcagFromTags(['wcag2a', 'wcag2aa', 'wcag412', 'wcag111'])).toEqual({
      wcag: ['1.1.1', '4.1.2'],
      level: 'A',
    })
    expect(wcagFromTags(['wcag21aa', 'wcag1412', 'wcag143']).wcag).toEqual(['1.4.3', '1.4.12'])
    expect(wcagFromTags(['best-practice'])).toEqual({ wcag: [], level: null })
  })
})

describe('toScanIssue', () => {
  it('maps a raw result, keeping the full element count', () => {
    const issue = toScanIssue(raw({ nodeCount: 40 }))
    expect(issue).toMatchObject({
      id: 'image-alt',
      impact: 'critical',
      wcag: ['1.1.1'],
      level: 'A',
      bestPractice: false,
      elements: 40,
    })
    expect(issue.nodes).toEqual([
      { target: 'img', html: '<img src="a.png">', summary: 'Fix any of the following' },
    ])
  })

  it('drops an impact it does not know and spots best practices', () => {
    const issue = toScanIssue(raw({ impact: 'bogus', tags: ['best-practice'], nodes: [] }))
    expect(issue.impact).toBeNull()
    expect(issue.bestPractice).toBe(true)
    expect(issue.elements).toBe(0)
  })
})

describe('ordering and counting', () => {
  const issues = [
    toScanIssue(raw({ id: 'region', impact: 'moderate', nodeCount: 9 })),
    toScanIssue(raw({ id: 'label', impact: 'critical', nodeCount: 1 })),
    toScanIssue(raw({ id: 'color-contrast', impact: 'serious', nodeCount: 3 })),
    toScanIssue(raw({ id: 'image-alt', impact: 'critical', nodeCount: 2 })),
  ]

  it('puts the worst first, then the most widespread', () => {
    expect(sortIssues(issues).map((i) => i.id)).toEqual([
      'image-alt',
      'label',
      'color-contrast',
      'region',
    ])
  })

  it('counts elements per impact', () => {
    expect(countByImpact(issues)).toEqual({ critical: 3, serious: 3, moderate: 9, minor: 0 })
  })
})

describe('explained rules', () => {
  const ruleIds = new Set(axe.getRules().map((rule) => rule.ruleId))

  it('are real axe-core rules', () => {
    for (const id of explainedRules) expect(ruleIds.has(id), id).toBe(true)
  })

  it('each have a plain-language explanation in both languages', () => {
    for (const id of explainedRules) {
      expect(en, id).toHaveProperty(`rule.${id}`)
      expect(he, id).toHaveProperty(`rule.${id}`)
    }
    // Ansy's own keyboard rules share the prefix; everything else must be an axe rule.
    const explained = Object.keys(en)
      .filter((key) => key.startsWith('rule.'))
      .map((key) => key.slice(5))
      .filter((id) => !keyboardRuleIds.includes(id))
    expect(explained.sort()).toEqual([...explainedRules].sort())
    expect(isExplainedRule('image-alt')).toBe(true)
    expect(isExplainedRule('no-such-rule')).toBe(false)
  })
})

describe('the in-page half', () => {
  it('ships as self-contained source text', () => {
    expect(scanPageSource.startsWith('function scanPage(')).toBe(true)
    expect(scanPageSource).not.toMatch(/\b(require|import|exports)\b/)
  })
})
