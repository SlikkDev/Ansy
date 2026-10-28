/**
 * The reports: the findings for one site as plain text and as the HTML the PDF
 * is printed from. Pure: both sides of the app can build one, and the tests
 * read them without Electron.
 */

import {
  findingHeadline,
  keyboardRuleIds,
  readerRuleIds,
  type Finding,
  type FindingRule,
} from './findings'
import type { Locale, MessageKey } from './i18n'
import { isExplainedRule } from './scan'

export type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string

export interface ReportOptions {
  locale: Locale
  t: Translate
  /** The site the findings are for, as shown: its host. */
  site: string
  /** Ansy's version, printed on the cover. */
  version: string
  /** End with the "Ask Slikk.Dev to fix this" line. */
  slikkLink: boolean
  /** When the report is made; defaults to now. */
  now?: number
}

export const SLIKK_URL = 'https://slikk.dev/'
export const ANSY_URL = 'https://slikkdev.github.io/Ansy/'

/** Where the rule's words come from: Ansy's own, for the rules it explains; axe's otherwise. */
export function explainRule(rule: FindingRule, t: Translate): string {
  if (
    isExplainedRule(rule.id) ||
    keyboardRuleIds.includes(rule.id) ||
    readerRuleIds.includes(rule.id)
  ) {
    return t(`rule.${rule.id}` as MessageKey)
  }
  return rule.description
}

export function formatDate(at: number, locale: Locale): string {
  return new Date(at).toLocaleString(locale === 'he' ? 'he-IL' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function severityLabel(finding: Finding, t: Translate): string {
  return finding.severity === 'owner'
    ? t('findings.severity.owner')
    : t(`exp.scan.impact.${finding.severity}` as MessageKey)
}

export function wcagLabel(rule: FindingRule, t: Translate): string {
  if (!rule.wcag.length) return t('exp.scan.bestPractice')
  const sc = rule.wcag.join(', ')
  return rule.level
    ? t('exp.scan.wcag', { sc, level: rule.level })
    : t('exp.scan.wcagNoLevel', { sc })
}

export function retestLabel(finding: Finding, t: Translate, locale: Locale): string | null {
  if (!finding.retest) return null
  const outcome = t(`findings.retest.${finding.retest.outcome}` as MessageKey)
  return t('findings.retest.at', { date: formatDate(finding.retest.at, locale), outcome })
}

const countLine = (n: number, t: Translate) =>
  n === 1 ? t('findings.one') : t('findings.count', { count: n })

/** The report as plain text, for an email or a ticket. */
export function plainTextReport(findings: readonly Finding[], options: ReportOptions): string {
  const { t, locale } = options
  const now = options.now ?? Date.now()
  const rule = '-'.repeat(60)
  const lines: string[] = []
  const push = (...items: string[]) => lines.push(...items)

  push(
    t('report.title', { site: options.site }),
    t('report.subtitle', { version: options.version, date: formatDate(now, locale) }),
    countLine(findings.length, t),
    '',
    t('report.what').toUpperCase(),
    t('report.whatBody'),
    t('report.severityIntro'),
    '',
  )

  findings.forEach((finding, index) => {
    push(
      rule,
      t('report.finding', { n: index + 1, total: findings.length }) +
        ': ' +
        findingHeadline(finding),
    )
    push(`${t('findings.severity')}: ${severityLabel(finding, t)}`)
    if (finding.rule) push(wcagLabel(finding.rule, t))
    push(`${t('findings.page')}: ${finding.title || finding.url}`, `  ${finding.url}`)
    push(`${t('findings.when')}: ${formatDate(finding.at, locale)}`)
    push(
      `${t('findings.experience')}: ${finding.experience ? t(`exp.${finding.experience}` as MessageKey) : t('findings.noExperience')}`,
    )
    push(
      `${t('findings.task')}: ${finding.task ? t(`task.${finding.task}` as MessageKey) : t('findings.noTask')}`,
    )
    if (finding.note) push('', `${t('findings.note')}:`, finding.note)
    if (finding.rule) {
      push('', `${t('findings.saw')}:`, explainRule(finding.rule, t))
      if (finding.rule.helpUrl) push(`${t('exp.scan.more')}: ${finding.rule.helpUrl}`)
    }
    if (finding.element) {
      push('', `${t('findings.element')}:`, `  ${finding.element.target}`)
      if (finding.element.html) push(`  ${finding.element.html}`)
    }
    const retest = retestLabel(finding, t, locale)
    if (retest) push('', retest)
    push('')
  })

  push(
    rule,
    '',
    t('report.closing').toUpperCase(),
    t('report.closingBody'),
    '',
    t('about.disclaimer'),
    '',
  )
  if (options.slikkLink) push(`${t('report.slikk')}: ${SLIKK_URL}`, t('report.slikkBody'), '')
  push(`${t('report.madeWith')}: ${ANSY_URL}`)
  return lines.join('\n') + '\n'
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const esc = escapeHtml

/** The Ansy mark, as on the About screen, for the cover. */
const MARK = `<svg viewBox="0 0 32 32" width="44" height="44" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#17130f" opacity=".08"/><path d="M4.5 16C8 9.8 12 7.5 16 7.5S24 9.8 27.5 16C24 22.2 20 24.5 16 24.5S8 22.2 4.5 16Z" fill="none" stroke="#17130f" stroke-width="2.2" stroke-linejoin="round"/><circle cx="16" cy="16" r="4.6" fill="#FF2D6B"/></svg>`

export interface HtmlReportOptions extends ReportOptions {
  /** CSS declaring the brand fonts (data URLs), or empty to use the system's. */
  fontsCss: string
  /** Where the page's screenshot can be loaded from, or null when there is none. */
  screenshotSrc: (finding: Finding) => string | null
}

const STYLE = `
@page { size: A4; margin: 18mm 16mm; }
html { font-size: 11pt; }
body { margin: 0; color: #17130f; background: #fff; font-family: 'Inter', 'Heebo', system-ui, sans-serif; line-height: 1.5; }
[dir='rtl'] body { font-family: 'Heebo', 'Inter', system-ui, sans-serif; }
h1, h2, h3 { font-family: 'Outfit', 'Heebo', system-ui, sans-serif; font-weight: 600; letter-spacing: -0.01em; margin: 0 0 0.4em; }
[dir='rtl'] h1, [dir='rtl'] h2, [dir='rtl'] h3 { font-family: 'Heebo', 'Outfit', system-ui, sans-serif; }
h1 { font-size: 2rem; line-height: 1.15; }
h2 { font-size: 1.35rem; line-height: 1.25; }
h3 { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.06em; color: #5a534c; margin: 1.1em 0 0.2em; }
p { margin: 0 0 0.6em; }
.page { break-after: page; }
.page:last-child { break-after: auto; }
.cover { padding-top: 30mm; }
.cover .mark { margin-bottom: 1.2rem; }
.muted { color: #5a534c; }
.lede { font-size: 1.05rem; }
.badge { display: inline-block; padding: 0.05rem 0.55rem; border: 1px solid #5a534c; border-radius: 999px; font-size: 0.75rem; font-weight: 600; white-space: nowrap; vertical-align: middle; }
.badge-critical, .badge-serious { background: #cc0046; border-color: #cc0046; color: #fff; }
.meta { font-size: 0.9rem; margin: 0.4em 0 0.8em; }
.meta div { margin-bottom: 0.1em; }
.ltr { direction: ltr; unicode-bidi: isolate; }
code, .code { font-family: ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace; font-size: 0.82rem; word-break: break-all; }
.code { display: block; background: #f1ece4; border-radius: 6px; padding: 0.5rem 0.7rem; margin: 0.2em 0 0.6em; white-space: pre-wrap; }
.note { border-inline-start: 3px solid #ff2d6b; padding-inline-start: 0.9rem; white-space: pre-wrap; }
.shot { max-width: 100%; max-height: 118mm; border: 1px solid #c9c2b8; border-radius: 6px; margin-top: 0.4em; }
.rule { border: 0; border-top: 1px solid #c9c2b8; margin: 1.2em 0; }
.disclaimer { border-inline-start: 3px solid #ff2d6b; padding-inline-start: 0.9rem; color: #5a534c; font-size: 0.95rem; }
a { color: #cc0046; }
.footer { margin-top: 2.5em; font-size: 0.9rem; color: #5a534c; }
`

/** The report as a standalone HTML document, printed to PDF by the main process. */
export function htmlReport(findings: readonly Finding[], options: HtmlReportOptions): string {
  const { t, locale } = options
  const now = options.now ?? Date.now()
  const dir = locale === 'he' ? 'rtl' : 'ltr'
  const parts: string[] = []

  parts.push(`<section class="page cover">
<div class="mark">${MARK}</div>
<h1>${esc(t('report.title', { site: options.site }))}</h1>
<p class="lede muted">${esc(t('report.subtitle', { version: options.version, date: formatDate(now, locale) }))}</p>
<p class="lede">${esc(countLine(findings.length, t))}</p>
<hr class="rule">
<h2>${esc(t('report.what'))}</h2>
<p>${esc(t('report.whatBody'))}</p>
<p>${esc(t('report.severityIntro'))}</p>
</section>`)

  findings.forEach((finding, index) => {
    const lines: string[] = []
    lines.push(`<section class="page">`)
    lines.push(
      `<p class="muted">${esc(t('report.finding', { n: index + 1, total: findings.length }))}</p>`,
    )
    lines.push(`<h2>${esc(findingHeadline(finding)) || '&nbsp;'}</h2>`)
    const severity = `<span class="badge badge-${esc(finding.severity)}">${esc(severityLabel(finding, t))}</span>`
    lines.push(
      `<p>${severity}${finding.rule ? ` <span class="muted">${esc(wcagLabel(finding.rule, t))}</span>` : ''}</p>`,
    )
    lines.push(`<div class="meta">`)
    lines.push(
      `<div><strong>${esc(t('findings.page'))}:</strong> ${esc(finding.title || finding.url)} <span class="ltr muted">${esc(finding.url)}</span></div>`,
    )
    lines.push(
      `<div><strong>${esc(t('findings.when'))}:</strong> ${esc(formatDate(finding.at, locale))}</div>`,
    )
    lines.push(
      `<div><strong>${esc(t('findings.experience'))}:</strong> ${esc(finding.experience ? t(`exp.${finding.experience}` as MessageKey) : t('findings.noExperience'))}</div>`,
    )
    lines.push(
      `<div><strong>${esc(t('findings.task'))}:</strong> ${esc(finding.task ? t(`task.${finding.task}` as MessageKey) : t('findings.noTask'))}</div>`,
    )
    lines.push(`</div>`)
    if (finding.note) {
      lines.push(`<h3>${esc(t('findings.note'))}</h3><p class="note">${esc(finding.note)}</p>`)
    }
    if (finding.rule) {
      lines.push(`<h3>${esc(t('findings.saw'))}</h3><p>${esc(explainRule(finding.rule, t))}</p>`)
      if (finding.rule.helpUrl) {
        lines.push(
          `<p class="ltr"><a href="${esc(finding.rule.helpUrl)}">${esc(finding.rule.helpUrl)}</a></p>`,
        )
      }
    }
    if (finding.element) {
      lines.push(`<h3>${esc(t('findings.element'))}</h3>`)
      lines.push(`<code class="code ltr">${esc(finding.element.target)}</code>`)
      if (finding.element.html)
        lines.push(`<code class="code ltr">${esc(finding.element.html)}</code>`)
    }
    const src = finding.screenshot ? options.screenshotSrc(finding) : null
    if (src) {
      lines.push(`<h3>${esc(t('findings.screenshot'))}</h3>`)
      lines.push(
        `<img class="shot" src="${esc(src)}" alt="${esc(t('findings.screenshotAlt', { title: finding.title || finding.url }))}">`,
      )
    }
    const retest = retestLabel(finding, t, locale)
    if (retest) lines.push(`<p class="muted">${esc(retest)}</p>`)
    lines.push(`</section>`)
    parts.push(lines.join('\n'))
  })

  const slikk = options.slikkLink
    ? `<h3>${esc(t('report.slikk'))}</h3><p>${esc(t('report.slikkBody'))} <a class="ltr" href="${SLIKK_URL}" rel="nofollow noopener noreferrer">${SLIKK_URL}</a></p>`
    : ''
  parts.push(`<section class="page">
<h2>${esc(t('report.closing'))}</h2>
<p>${esc(t('report.closingBody'))}</p>
<p class="disclaimer">${esc(t('about.disclaimer'))}</p>
${slikk}
<p class="footer">${esc(t('report.madeWith'))}: <a class="ltr" href="${ANSY_URL}">${ANSY_URL}</a><br>${esc(t('about.license'))}</p>
</section>`)

  return `<!doctype html>
<html lang="${locale}" dir="${dir}">
<head>
<meta charset="utf-8">
<title>${esc(t('report.title', { site: options.site }))}</title>
<style>${options.fontsCss}${STYLE}</style>
</head>
<body>
${parts.join('\n')}
</body>
</html>
`
}
