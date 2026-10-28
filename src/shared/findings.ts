/**
 * Findings: what the owner saves while using the site, to hand to whoever
 * builds it. Each one carries enough to be found again (page, element) and
 * enough to be understood without Ansy (the note, what Ansy saw, the WCAG
 * rule, a screenshot). Pure helpers live here; the store is in src/main.
 */

import { experienceIds, type ExperienceId } from './experiences'
import type { Impact } from './scan'
import { impacts } from './scan'
import { isTaskId, type TaskId } from './tasks'

/** axe's impact for what the scan found; "owner" for what the owner met while using the site. */
export type Severity = Impact | 'owner'

export type FindingKind = 'scan' | 'keyboard' | 'reader' | 'note'

/** The rule a finding breaks: an axe rule, or one of Ansy's own keyboard or reader rules. */
export interface FindingRule {
  id: string
  /** A one-line title, as it was shown when the finding was saved. */
  help: string
  /** The longer explanation, for rules Ansy has no words of its own for. */
  description: string
  helpUrl: string
  wcag: string[]
  level: 'A' | 'AA' | 'AAA' | null
}

export interface FindingElement {
  /** A CSS selector that reaches it again. */
  target: string
  /** The element's outer HTML, trimmed, or a short label. */
  html: string
}

export type RetestOutcome = 'fixed' | 'failing' | 'unknown'

export interface Retest {
  at: number
  outcome: RetestOutcome
  /** Ansy decided by itself, or the owner said so after looking. */
  by: 'ansy' | 'owner'
}

/** What the capture dialog sends; the store adds the id, the time and the screenshot. */
export interface FindingDraft {
  kind: FindingKind
  url: string
  title: string
  experience: ExperienceId | null
  task: TaskId | null
  note: string
  severity: Severity
  rule: FindingRule | null
  element: FindingElement | null
  /** Keep the screenshot Ansy took when the dialog opened. */
  screenshot: boolean
}

export interface Finding extends Omit<FindingDraft, 'screenshot'> {
  id: string
  /** When it was saved, milliseconds since the epoch. */
  at: number
  /** A PNG of the page, with the element ringed, is stored beside the list. */
  screenshot: boolean
  retest: Retest | null
}

/** Findings are grouped by site: the page's host, which is what a report is about. */
export function siteKeyOf(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

export const byNewest = (a: Finding, b: Finding): number => b.at - a.at

export function sitesOf(findings: readonly Finding[]): string[] {
  const seen = new Set<string>()
  for (const finding of [...findings].sort(byNewest)) seen.add(siteKeyOf(finding.url))
  return [...seen]
}

export function forSite(findings: readonly Finding[], site: string | null): Finding[] {
  return findings.filter((f) => site === null || siteKeyOf(f.url) === site).sort(byNewest)
}

const severities = new Set<string>([...impacts, 'owner'])
const kinds = new Set<string>(['scan', 'keyboard', 'reader', 'note'])
const levels = new Set<string>(['A', 'AA', 'AAA'])

const text = (value: unknown, max: number): string =>
  typeof value === 'string' ? value.slice(0, max) : ''

function sanitizeRule(raw: unknown): FindingRule | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const id = text(r.id, 100)
  if (!id) return null
  return {
    id,
    help: text(r.help, 500),
    description: text(r.description, 2000),
    helpUrl: text(r.helpUrl, 500),
    wcag: Array.isArray(r.wcag) ? r.wcag.filter((w) => typeof w === 'string').slice(0, 10) : [],
    level: typeof r.level === 'string' && levels.has(r.level) ? (r.level as 'A') : null,
  }
}

function sanitizeElement(raw: unknown): FindingElement | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const target = text(r.target, 2000)
  if (!target) return null
  return { target, html: text(r.html, 500) }
}

/** Keeps only what a finding may hold; anything odd is dropped or emptied. Null when nothing usable. */
export function sanitizeFindingDraft(raw: unknown): FindingDraft | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const url = text(r.url, 2000)
  if (!url || !kinds.has(String(r.kind))) return null
  const experience =
    typeof r.experience === 'string' && (experienceIds as readonly string[]).includes(r.experience)
      ? (r.experience as ExperienceId)
      : null
  return {
    kind: r.kind as FindingKind,
    url,
    title: text(r.title, 500),
    experience,
    task: isTaskId(r.task) ? r.task : null,
    note: text(r.note, 5000).trim(),
    severity:
      typeof r.severity === 'string' && severities.has(r.severity)
        ? (r.severity as Severity)
        : 'owner',
    rule: sanitizeRule(r.rule),
    element: sanitizeElement(r.element),
    screenshot: r.screenshot === true,
  }
}

export function isFinding(value: unknown): value is Finding {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return typeof v.id === 'string' && typeof v.at === 'number' && sanitizeFindingDraft(v) !== null
}

/** The fields the owner may change after saving. */
export interface FindingPatch {
  note?: string
  retest?: Retest | null
}

export function sanitizeFindingPatch(raw: unknown): FindingPatch {
  const patch: FindingPatch = {}
  if (!raw || typeof raw !== 'object') return patch
  const r = raw as Record<string, unknown>
  if (typeof r.note === 'string') patch.note = r.note.slice(0, 5000).trim()
  if (r.retest === null) patch.retest = null
  else if (r.retest && typeof r.retest === 'object') {
    const t = r.retest as Record<string, unknown>
    if (
      typeof t.at === 'number' &&
      (t.outcome === 'fixed' || t.outcome === 'failing' || t.outcome === 'unknown') &&
      (t.by === 'ansy' || t.by === 'owner')
    ) {
      patch.retest = { at: t.at, outcome: t.outcome, by: t.by }
    }
  }
  return patch
}

/** A finding's one-line title: the rule it breaks, or the first line of the note. */
export function findingHeadline(finding: Pick<Finding, 'rule' | 'note'>): string {
  if (finding.rule?.help) return finding.rule.help
  const [first = ''] = finding.note.split('\n')
  return first.length > 90 ? first.slice(0, 89) + '…' : first
}

/**
 * Ansy's own rules for what the keyboard helper finds, so a keyboard finding
 * reads like a scan finding: a WCAG number, a level, and a severity.
 */
export const keyboardRules = {
  traps: { id: 'keyboard-trap', wcag: ['2.1.2'], level: 'A', severity: 'critical' },
  invisibleFocus: { id: 'focus-visible', wcag: ['2.4.7'], level: 'AA', severity: 'serious' },
  unreachable: { id: 'keyboard-unreachable', wcag: ['2.1.1'], level: 'A', severity: 'critical' },
} as const satisfies Record<
  string,
  { id: string; wcag: string[]; level: 'A' | 'AA' | 'AAA'; severity: Impact }
>

export type KeyboardRuleGroup = keyof typeof keyboardRules
export type KeyboardRuleId = (typeof keyboardRules)[KeyboardRuleGroup]['id']

export const keyboardRuleIds: readonly string[] = Object.values(keyboardRules).map((r) => r.id)

/**
 * What Ansy Reader stumbles on: the things a screen reader announces as
 * nothing, or as an outline that makes no sense. Each maps to the WCAG rule a
 * provider will recognise, with axe's severity for the matching axe rule.
 */
export const readerRules = {
  'reader-image-name': { wcag: ['1.1.1'], level: 'A', severity: 'critical' },
  'reader-link-name': { wcag: ['2.4.4'], level: 'A', severity: 'serious' },
  'reader-button-name': { wcag: ['4.1.2'], level: 'A', severity: 'critical' },
  'reader-field-name': { wcag: ['4.1.2'], level: 'A', severity: 'critical' },
  'reader-heading-empty': { wcag: ['2.4.6'], level: 'AA', severity: 'minor' },
  'reader-heading-order': { wcag: ['1.3.1'], level: 'A', severity: 'moderate' },
  'reader-no-landmarks': { wcag: ['2.4.1'], level: 'A', severity: 'moderate' },
} as const satisfies Record<
  string,
  { wcag: readonly string[]; level: 'A' | 'AA'; severity: Impact }
>

export type ReaderRuleId = keyof typeof readerRules
export const readerRuleIds: readonly string[] = Object.keys(readerRules)

export function isReaderRuleId(value: string): value is ReaderRuleId {
  return readerRuleIds.includes(value)
}
