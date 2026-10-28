import { useState } from 'react'
import type { MessageKey } from '../../../shared/i18n'
import type { KeyboardFinding, KeyboardReport } from '../../../shared/keyboard'
import { isExplainedRule, type ScanIssue, type ScanResult } from '../../../shared/scan'
import { ansy } from '../lib/ansy'
import { useT } from '../lib/i18n'

const heading = 'mb-1 text-xs font-semibold uppercase tracking-wide text-ink-soft'

/** Scrolls the site to the element and rings it; says so when it is gone. */
function ShowOnPage({ target }: { target: string }) {
  const t = useT()
  const [missing, setMissing] = useState(false)
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button
        type="button"
        className="btn-link text-xs"
        onClick={() => void ansy.experiences.show(target).then((found) => setMissing(!found))}
      >
        {t('panel.show')}
      </button>
      <span aria-live="polite" className="text-xs text-ink-soft">
        {missing ? t('panel.showMissing') : ''}
      </span>
    </span>
  )
}

/** The keyboard-only card's running tally: stops so far, and what the keyboard could not do. */
export function KeyboardFindings({
  report,
  onClear,
}: {
  report: KeyboardReport
  onClear: () => void
}) {
  const t = useT()
  const groups: { key: MessageKey; items: KeyboardFinding[] }[] = [
    { key: 'exp.keyboard.traps', items: report.traps },
    { key: 'exp.keyboard.invisible', items: report.invisibleFocus },
    { key: 'exp.keyboard.unreachable', items: report.unreachable },
  ]
  return (
    <section>
      <h3 className={heading}>{t('panel.noticed')}</h3>
      <p>
        {report.stops
          ? t('exp.keyboard.stops', { count: report.stops })
          : t('exp.keyboard.noStops')}
      </p>
      <div aria-live="polite">
        {groups
          .filter((group) => group.items.length > 0)
          .map((group) => (
            <div key={group.key} className="mt-2">
              <h4 className="font-medium">{t(group.key)}</h4>
              <ul className="list-disc ps-5">
                {group.items.map((item) => (
                  <li key={item.target}>
                    <span dir="auto">{item.label}</span> <ShowOnPage target={item.target} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </div>
      <button type="button" className="btn mt-3" onClick={onClear} disabled={!report.stops}>
        {t('exp.keyboard.clear')}
      </button>
    </section>
  )
}

/** The scan card's results: a summary line, then each rule with Ansy's explanation. */
export function ScanResults({ scan, scanning }: { scan: ScanResult | null; scanning: boolean }) {
  const t = useT()
  const elements = scan ? scan.issues.reduce((sum, issue) => sum + issue.elements, 0) : 0
  const summary = scanning
    ? t('exp.scan.scanning')
    : !scan
      ? t('exp.scan.failed')
      : scan.issues.length
        ? t('exp.scan.summary', { issues: scan.issues.length, elements })
        : t('exp.scan.clean')
  return (
    <section>
      <h3 className={heading}>{t('panel.noticed')}</h3>
      <p aria-live="polite" aria-atomic="true" className="mb-2">
        {summary}
      </p>
      {scan && (
        <>
          <ul className="flex flex-col gap-2">
            {scan.issues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </ul>
          {scan.incomplete.length > 0 && (
            <div className="mt-3">
              <h4 className="font-medium">{t('exp.scan.incomplete')}</h4>
              <p className="mb-2 text-ink-soft">{t('exp.scan.incompleteIntro')}</p>
              <ul className="flex flex-col gap-2">
                {scan.incomplete.map((issue) => (
                  <IssueCard key={issue.id} issue={issue} />
                ))}
              </ul>
            </div>
          )}
          <p className="mt-2 text-xs text-ink-soft">
            {t('exp.scan.passed', { count: scan.passes })}
          </p>
        </>
      )}
    </section>
  )
}

function IssueCard({ issue }: { issue: ScanIssue }) {
  const t = useT()
  const explanation = isExplainedRule(issue.id)
    ? t(`rule.${issue.id}` as MessageKey)
    : issue.description
  const where = issue.wcag.length
    ? issue.level
      ? t('exp.scan.wcag', { sc: issue.wcag.join(', '), level: issue.level })
      : t('exp.scan.wcagNoLevel', { sc: issue.wcag.join(', ') })
    : t('exp.scan.bestPractice')
  return (
    <li className="card p-3" data-rule={issue.id}>
      <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
        {issue.impact && (
          <span className={`badge badge-${issue.impact}`}>
            {t(`exp.scan.impact.${issue.impact}` as MessageKey)}
          </span>
        )}
        <span className="text-ink-soft">{where}</span>
      </div>
      <h4 className="font-medium">{issue.help}</h4>
      <p className="mt-1">{explanation}</p>
      <details className="mt-2">
        <summary className="cursor-pointer text-ink-soft">
          {issue.elements === 1
            ? t('exp.scan.element')
            : t('exp.scan.elements', { count: issue.elements })}
        </summary>
        <ul className="mt-1 flex flex-col gap-2">
          {issue.nodes.map((node, index) => (
            <li key={`${node.target}-${index}`}>
              <code
                dir="ltr"
                className="block overflow-hidden text-ellipsis whitespace-nowrap text-xs text-ink-soft"
              >
                {node.html}
              </code>
              <ShowOnPage target={node.target} />
            </li>
          ))}
        </ul>
      </details>
      <button
        type="button"
        className="btn-link mt-2 text-xs"
        onClick={() => void ansy.app.openExternal(issue.helpUrl)}
      >
        {t('exp.scan.more')}
      </button>
    </li>
  )
}
