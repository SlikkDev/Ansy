/**
 * The automatic scan: axe-core's results, trimmed to what Ansy shows and
 * mapped to WCAG. Pure helpers live here so they are unit-tested without
 * Electron; the scan itself runs in src/main/scan.ts.
 */

export type Impact = 'minor' | 'moderate' | 'serious' | 'critical'

export const impacts: readonly Impact[] = ['critical', 'serious', 'moderate', 'minor']

export interface ScanNode {
  /** A CSS selector for the element, as axe reports it. */
  target: string
  /** The element's outer HTML, trimmed. */
  html: string
  /** axe's one-line summary of what to fix, trimmed. */
  summary: string
}

export interface ScanIssue {
  /** axe's rule id, e.g. "color-contrast". */
  id: string
  impact: Impact | null
  /** axe's localized one-liner. */
  help: string
  description: string
  helpUrl: string
  /** WCAG success criteria, e.g. ["1.4.3"]. Empty for best practices. */
  wcag: string[]
  level: 'A' | 'AA' | 'AAA' | null
  bestPractice: boolean
  /** How many elements fail it. `nodes` holds the first of them; the page keeps the rest short. */
  elements: number
  nodes: ScanNode[]
}

export interface ScanResult {
  url: string
  locale: string
  /** When the scan ran, milliseconds since the epoch. */
  at: number
  issues: ScanIssue[]
  /** What axe could not decide by itself; a person has to look. */
  incomplete: ScanIssue[]
  /** How many rules passed outright. */
  passes: number
  /** What the page is called, for the report later. */
  title: string
}

/** What the page sends back: axe's raw result, trimmed inside the page. */
export interface RawAxeResult {
  id: string
  impact: string | null
  help: string
  description: string
  helpUrl: string
  tags: string[]
  nodes: { target: string[]; html: string; failureSummary?: string }[]
  /** The full count, when `nodes` was trimmed inside the page. */
  nodeCount?: number
}

const LEVEL_TAGS: Record<string, 'A' | 'AA' | 'AAA'> = {
  wcag2a: 'A',
  wcag2aa: 'AA',
  wcag2aaa: 'AAA',
  wcag21a: 'A',
  wcag21aa: 'AA',
  wcag21aaa: 'AAA',
  wcag22a: 'A',
  wcag22aa: 'AA',
  wcag22aaa: 'AAA',
}

/** "wcag143" → "1.4.3", "wcag1412" → "1.4.12". Anything else is not a criterion. */
export function criterionFromTag(tag: string): string | null {
  const m = /^wcag(\d)(\d)(\d{1,2})$/.exec(tag)
  if (!m) return null
  return `${m[1]}.${m[2]}.${Number(m[3])}`
}

export function wcagFromTags(tags: string[]): { wcag: string[]; level: ScanIssue['level'] } {
  const wcag: string[] = []
  let level: ScanIssue['level'] = null
  const rank = { A: 1, AA: 2, AAA: 3 }
  for (const tag of tags) {
    const sc = criterionFromTag(tag)
    if (sc && !wcag.includes(sc)) wcag.push(sc)
    const l = LEVEL_TAGS[tag]
    // The lowest level a rule carries is the one it fails at.
    if (l && (!level || rank[l] < rank[level])) level = l
  }
  wcag.sort((a, b) => {
    const [a1, a2, a3] = a.split('.').map(Number)
    const [b1, b2, b3] = b.split('.').map(Number)
    return a1! - b1! || a2! - b2! || a3! - b3!
  })
  return { wcag, level }
}

const impactSet = new Set<string>(impacts)

export function toScanIssue(raw: RawAxeResult): ScanIssue {
  const { wcag, level } = wcagFromTags(raw.tags)
  return {
    id: raw.id,
    impact: raw.impact && impactSet.has(raw.impact) ? (raw.impact as Impact) : null,
    help: raw.help,
    description: raw.description,
    helpUrl: raw.helpUrl,
    wcag,
    level,
    bestPractice: raw.tags.includes('best-practice'),
    elements: raw.nodeCount ?? raw.nodes.length,
    nodes: raw.nodes.map((n) => ({
      target: n.target.join(' '),
      html: n.html,
      summary: n.failureSummary ?? '',
    })),
  }
}

/** Worst first, then by how many elements fail. */
export function sortIssues(issues: ScanIssue[]): ScanIssue[] {
  const rank = (i: ScanIssue) => (i.impact ? impacts.indexOf(i.impact) : impacts.length)
  return [...issues].sort((a, b) => rank(a) - rank(b) || b.elements - a.elements)
}

export function countByImpact(issues: ScanIssue[]): Record<Impact, number> {
  const counts: Record<Impact, number> = { critical: 0, serious: 0, moderate: 0, minor: 0 }
  for (const issue of issues) if (issue.impact) counts[issue.impact] += issue.elements
  return counts
}

/** The rules Ansy explains in its own words; the rest fall back to axe's localized help. */
export const explainedRules = [
  'color-contrast',
  'image-alt',
  'input-image-alt',
  'role-img-alt',
  'svg-img-alt',
  'object-alt',
  'label',
  'select-name',
  'label-title-only',
  'form-field-multiple-labels',
  'autocomplete-valid',
  'link-name',
  'button-name',
  'link-in-text-block',
  'html-has-lang',
  'html-lang-valid',
  'document-title',
  'heading-order',
  'empty-heading',
  'page-has-heading-one',
  'region',
  'landmark-one-main',
  'bypass',
  'list',
  'listitem',
  'frame-title',
  'meta-viewport',
  'tabindex',
  'target-size',
  'label-content-name-mismatch',
  'scrollable-region-focusable',
  'nested-interactive',
  'aria-hidden-focus',
  'aria-required-attr',
  'aria-valid-attr-value',
  'aria-roles',
  'aria-allowed-attr',
  'duplicate-id-aria',
  'video-caption',
  'image-redundant-alt',
  'th-has-data-cells',
  'skip-link',
] as const

export type ExplainedRule = (typeof explainedRules)[number]

export function isExplainedRule(id: string): id is ExplainedRule {
  return (explainedRules as readonly string[]).includes(id)
}
