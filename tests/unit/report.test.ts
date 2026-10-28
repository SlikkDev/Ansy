import { describe, expect, it } from 'vitest'
import type { Finding } from '../../src/shared/findings'
import { translate, type Locale, type MessageKey } from '../../src/shared/i18n'
import {
  ANSY_URL,
  escapeHtml,
  explainRule,
  htmlReport,
  plainTextReport,
  SLIKK_URL,
  type HtmlReportOptions,
} from '../../src/shared/report'

const t = (locale: Locale) => (key: MessageKey, vars?: Record<string, string | number>) =>
  translate(locale, key, vars)

const findings: Finding[] = [
  {
    id: 'aaaaaaaa-0000-4000-8000-000000000001',
    at: Date.UTC(2026, 9, 28, 12, 0),
    kind: 'keyboard',
    url: 'http://127.0.0.1:4321/',
    title: 'Sample shop',
    experience: 'keyboard',
    task: 'form',
    note: 'Pressed Tab on the widget & it never left.\nHad to reload.',
    severity: 'critical',
    rule: {
      id: 'keyboard-trap',
      help: 'Tab gets stuck here',
      description: '',
      helpUrl: '',
      wcag: ['2.1.2'],
      level: 'A',
    },
    element: { target: '#trap', html: 'div “A widget that keeps Tab”' },
    screenshot: true,
    retest: { at: Date.UTC(2026, 9, 29, 9, 30), outcome: 'failing', by: 'ansy' },
  },
  {
    id: 'aaaaaaaa-0000-4000-8000-000000000002',
    at: Date.UTC(2026, 9, 28, 12, 5),
    kind: 'scan',
    url: 'http://127.0.0.1:4321/',
    title: 'Sample shop',
    experience: 'scan',
    task: null,
    note: '',
    severity: 'minor',
    rule: {
      id: 'some-new-rule',
      help: 'Something axe knows about',
      description: 'The longer axe description <b>with markup</b>.',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/some-new-rule',
      wcag: [],
      level: null,
    },
    element: { target: 'img', html: '<img src="x.png">' },
    screenshot: false,
    retest: null,
  },
  {
    id: 'aaaaaaaa-0000-4000-8000-000000000003',
    at: Date.UTC(2026, 9, 28, 12, 10),
    kind: 'note',
    url: 'http://127.0.0.1:4321/contact.html',
    title: 'Contact',
    experience: null,
    task: 'contact',
    note: 'The phone number is an image.',
    severity: 'owner',
    rule: null,
    element: null,
    screenshot: false,
    retest: null,
  },
]

const options = (locale: Locale, slikkLink = true) => ({
  locale,
  t: t(locale),
  site: '127.0.0.1:4321',
  version: '1.2.3',
  slikkLink,
  now: Date.UTC(2026, 9, 30, 8, 0),
})

describe('plainTextReport', () => {
  it('reads top to bottom: cover, each finding, how to send it', () => {
    const text = plainTextReport(findings, options('en'))
    expect(text).toMatch(
      /^Accessibility findings for 127\.0\.0\.1:4321\nMade with Ansy 1\.2\.3 on /,
    )
    expect(text).toContain('3 findings')
    expect(text).toContain('Finding 1 of 3: Tab gets stuck here')
    expect(text).toContain('Severity: Critical')
    expect(text).toContain('WCAG 2.1.2, level A')
    expect(text).toContain('Experience: Keyboard only')
    expect(text).toContain('Task: Fill in a form')
    expect(text).toContain('Pressed Tab on the widget & it never left.\nHad to reload.')
    expect(text).toContain('Once Tab lands here, it cannot leave.')
    expect(text).toContain('  #trap')
    expect(text).toMatch(/Checked .*: Still there/)
    // A rule Ansy has no words for falls back to axe's own, and keeps the link.
    expect(text).toContain('Finding 2 of 3: Something axe knows about')
    expect(text).toContain('Best practice, not a WCAG rule')
    expect(text).toContain('The longer axe description <b>with markup</b>.')
    expect(text).toContain(
      'More about this rule: https://dequeuniversity.com/rules/axe/4.10/some-new-rule',
    )
    expect(text).toContain('Finding 3 of 3: The phone number is an image.')
    expect(text).toContain('Severity: Reported by the owner')
    expect(text).toContain('Experience: No experience on')
    const closing = text.indexOf('SENDING THIS TO YOUR DEVELOPER')
    expect(closing).toBeGreaterThan(text.indexOf('Finding 3 of 3'))
    expect(text).toContain('It cannot certify that your site meets WCAG')
    expect(text).toContain(`Ask Slikk.Dev to fix this: ${SLIKK_URL}`)
    expect(text.trimEnd().endsWith(`Made with Ansy, free and open source: ${ANSY_URL}`)).toBe(true)
  })

  it('leaves the Slikk.Dev line out when asked', () => {
    const text = plainTextReport(findings, options('en', false))
    expect(text).not.toContain('Slikk.Dev')
    expect(text).toContain(ANSY_URL)
  })

  it('is written in Hebrew too', () => {
    const text = plainTextReport(findings, options('he'))
    expect(text).toContain('ממצאי נגישות עבור 127.0.0.1:4321')
    expect(text).toContain('ממצא 1 מתוך 3: Tab gets stuck here')
    expect(text).toContain('WCAG 2.1.2 (רמה A)')
    expect(text).toContain('חוויה: מקלדת בלבד')
    expect(text).toContain('משימה: למלא טופס')
    expect(text).toContain(`בקשו מ־Slikk.Dev לתקן את זה: ${SLIKK_URL}`)
    expect(text).not.toMatch(/אנסי/)
  })
})

describe('htmlReport', () => {
  const html = (locale: Locale, slikkLink = true) =>
    htmlReport(findings, {
      ...options(locale, slikkLink),
      fontsCss: '@font-face{font-family:Test}',
      screenshotSrc: (finding) => (finding.screenshot ? `${finding.id}.png` : null),
    } satisfies HtmlReportOptions)

  it('is a page per finding between a cover and a closing page', () => {
    const page = html('en')
    expect(page.startsWith('<!doctype html>\n<html lang="en" dir="ltr">')).toBe(true)
    expect(page.match(/<section class="page/g)).toHaveLength(findings.length + 2)
    expect(page).toContain('@font-face{font-family:Test}')
    expect(page).toContain('<h1>Accessibility findings for 127.0.0.1:4321</h1>')
    expect(page).toContain('<span class="badge badge-critical">Critical</span>')
    expect(page).toContain('<img class="shot" src="aaaaaaaa-0000-4000-8000-000000000001.png"')
    expect(page).not.toContain('aaaaaaaa-0000-4000-8000-000000000002.png')
    expect(page).toContain(
      `<a class="ltr" href="${SLIKK_URL}" rel="nofollow noopener noreferrer">${SLIKK_URL}</a>`,
    )
    expect(page).toContain('It cannot certify that your site meets WCAG')
  })

  it('escapes everything that came from the page or the owner', () => {
    const page = html('en')
    expect(page).toContain('Pressed Tab on the widget &amp; it never left.')
    expect(page).toContain('The longer axe description &lt;b&gt;with markup&lt;/b&gt;.')
    expect(page).toContain('&lt;img src=&quot;x.png&quot;&gt;')
    expect(page).not.toContain('<b>with markup</b>')
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;',
    )
  })

  it('flips to right-to-left for Hebrew and drops the Slikk.Dev line on request', () => {
    expect(html('he').startsWith('<!doctype html>\n<html lang="he" dir="rtl">')).toBe(true)
    expect(html('he')).toContain('<h1>ממצאי נגישות עבור 127.0.0.1:4321</h1>')
    expect(html('en', false)).not.toContain('slikk.dev')
  })
})

describe('explainRule', () => {
  it("uses Ansy's words for the rules it knows and axe's for the rest", () => {
    const base = { help: '', description: 'axe says', helpUrl: '', wcag: [], level: null }
    expect(explainRule({ ...base, id: 'image-alt' }, t('en'))).toContain('no text alternative')
    expect(explainRule({ ...base, id: 'focus-visible' }, t('he'))).toContain('בפוקוס של המקלדת')
    expect(explainRule({ ...base, id: 'brand-new' }, t('en'))).toBe('axe says')
  })
})
