import { useState } from 'react'
import { keyboardRules, type KeyboardRuleGroup } from '../../../shared/findings'
import type { MessageKey } from '../../../shared/i18n'
import type { KeyboardFinding, KeyboardReport } from '../../../shared/keyboard'
import type { SwitchReport } from '../../../shared/motor'
import { isExplainedRule, type ScanIssue, type ScanResult } from '../../../shared/scan'
import { spokenTarget, type VoiceMismatch, type VoiceResult } from '../../../shared/voice'
import { ansy } from '../lib/ansy'
import { useCapture, type CaptureStart } from '../lib/findings'
import { useI18n, useT } from '../lib/i18n'

const heading = 'mb-1 text-xs font-semibold uppercase tracking-wide text-ink-soft'

/** Opens the finding dialog with what this row knows. */
export function SaveFinding({ start }: { start: CaptureStart }) {
  const t = useT()
  const capture = useCapture()
  return (
    <button type="button" className="btn-link text-xs" onClick={() => capture.start(start)}>
      {t('findings.save')}
    </button>
  )
}

/** Scrolls the site to the element and rings it; says so when it is gone. */
export function ShowOnPage({ target }: { target: string }) {
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
  const groups: { key: MessageKey; group: KeyboardRuleGroup; items: KeyboardFinding[] }[] = [
    { key: 'exp.keyboard.traps', group: 'traps', items: report.traps },
    { key: 'exp.keyboard.invisible', group: 'invisibleFocus', items: report.invisibleFocus },
    { key: 'exp.keyboard.unreachable', group: 'unreachable', items: report.unreachable },
  ]
  /** A keyboard finding carries one of Ansy's own rules, so it reads like a scan finding in the report. */
  const startFor = (group: (typeof groups)[number], item: KeyboardFinding): CaptureStart => {
    const rule = keyboardRules[group.group]
    return {
      kind: 'keyboard',
      severity: rule.severity,
      rule: {
        id: rule.id,
        help: t(group.key),
        description: '',
        helpUrl: '',
        wcag: [...rule.wcag],
        level: rule.level,
      },
      element: { target: item.target, html: item.label },
    }
  }
  return (
    <section>
      <h4 className={heading}>{t('panel.noticed')}</h4>
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
              <h5 className="font-medium">{t(group.key)}</h5>
              <ul className="list-disc ps-5">
                {group.items.map((item) => (
                  <li key={item.target}>
                    <span dir="auto">{item.label}</span> <ShowOnPage target={item.target} />{' '}
                    <SaveFinding start={startFor(group, item)} />
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

/**
 * The switch access card's tally: moves and picks so far, and what scanning
 * never lands on. A skipped control is the keyboard's "unreachable" rule: switch
 * devices reach what the keyboard reaches, so the fix and its check are the same.
 */
export function SwitchFindings({ report, onClear }: { report: SwitchReport; onClear: () => void }) {
  const t = useT()
  const rule = keyboardRules.unreachable
  const startFor = (item: KeyboardFinding): CaptureStart => ({
    kind: 'keyboard',
    severity: rule.severity,
    rule: {
      id: rule.id,
      help: t('exp.switchAccess.skipped'),
      description: '',
      helpUrl: '',
      wcag: [...rule.wcag],
      level: rule.level,
    },
    element: { target: item.target, html: item.label },
  })
  return (
    <section>
      <h4 className={heading}>{t('panel.noticed')}</h4>
      <div aria-live="polite">
        <p>
          {report.steps
            ? t('exp.switchAccess.steps', { steps: report.steps, picks: report.picks })
            : t('exp.switchAccess.noSteps')}
        </p>
        {report.lastPickSteps !== null && (
          <p>{t('exp.switchAccess.lastPick', { count: report.lastPickSteps })}</p>
        )}
        {report.skipped.length > 0 && (
          <div className="mt-2">
            <h5 className="font-medium">{t('exp.switchAccess.skipped')}</h5>
            <ul className="list-disc ps-5">
              {report.skipped.map((item) => (
                <li key={item.target}>
                  <span dir="auto">{item.label}</span> <ShowOnPage target={item.target} />{' '}
                  <SaveFinding start={startFor(item)} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <button type="button" className="btn mt-3" onClick={onClear} disabled={!report.steps}>
        {t('exp.switchAccess.clear')}
      </button>
    </section>
  )
}

/** The axe rule a voice miss breaks, so it is saved and checked again like a scan finding. */
const labelInName = {
  id: 'label-content-name-mismatch',
  wcag: ['2.5.3'],
  level: 'A' as const,
  helpUrl: 'https://dequeuniversity.com/rules/axe/4.14/label-content-name-mismatch',
}

/** What the last command did, in a sentence. */
export function voiceMessage(t: ReturnType<typeof useT>, said: string, result: VoiceResult | null) {
  if (!result) return t('exp.voiceControl.result.noPage')
  switch (result.outcome) {
    case 'clicked':
    case 'focused':
      return t(`exp.voiceControl.result.${result.outcome}`, { name: result.name ?? '' })
    case 'numbers':
    case 'choose':
      return t(`exp.voiceControl.result.${result.outcome}`, { count: result.count ?? 0 })
    case 'mismatch':
      return t('exp.voiceControl.result.mismatch', {
        said: spokenTarget(said),
        name: result.mismatch?.name ?? '',
      })
    case 'notFound':
      return t('exp.voiceControl.result.notFound', { said: spokenTarget(said) })
    default:
      return t(`exp.voiceControl.result.${result.outcome}` as MessageKey)
  }
}

/**
 * Voice control's command box: type a command, or speak it into the box with
 * the computer's own dictation. Ansy hears nothing itself.
 */
export function VoiceCommands({
  mismatches,
  platform,
}: {
  mismatches: VoiceMismatch[]
  platform: string
}) {
  const t = useT()
  const { locale } = useI18n()
  const [text, setText] = useState('')
  const [last, setLast] = useState<{ said: string; message: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const dictation =
    platform === 'darwin'
      ? t('exp.voiceControl.dictation.mac')
      : platform === 'win32'
        ? t('exp.voiceControl.dictation.windows')
        : t('exp.voiceControl.dictation.other')
  const run = async () => {
    const said = text.trim()
    if (!said || busy) return
    setBusy(true)
    try {
      const result = await ansy.experiences.voice(said)
      setLast({ said, message: voiceMessage(t, said, result) })
      setText('')
    } finally {
      setBusy(false)
    }
  }
  const startFor = (item: VoiceMismatch): CaptureStart => ({
    kind: 'scan',
    severity: 'serious',
    rule: {
      ...labelInName,
      help: t('exp.voiceControl.missed'),
      description: t('rule.label-content-name-mismatch'),
      wcag: [...labelInName.wcag],
    },
    element: { target: item.target, html: item.html },
  })
  return (
    <section className="flex flex-col gap-2">
      <form
        className="flex flex-col gap-1"
        onSubmit={(event) => {
          event.preventDefault()
          void run()
        }}
      >
        <label htmlFor="ansy-voice-command" className="font-medium">
          {t('exp.voiceControl.command')}
        </label>
        <div className="flex gap-2">
          <input
            id="ansy-voice-command"
            className="field min-w-0 flex-1"
            dir="auto"
            autoComplete="off"
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={busy || !text.trim()}>
            {t('exp.voiceControl.run')}
          </button>
        </div>
      </form>
      <p className="text-xs text-ink-soft">{t('exp.voiceControl.examples')}</p>
      <p className="text-xs text-ink-soft">
        {t('exp.voiceControl.examplesOther')}{' '}
        {locale === 'he' ? (
          <bdi lang="en" dir="ltr">
            click Buy now · show numbers · scroll down
          </bdi>
        ) : (
          <bdi lang="he" dir="rtl">
            לחץ על · הצג מספרים · גלול למטה
          </bdi>
        )}
      </p>
      <p className="text-xs text-ink-soft">{dictation}</p>
      <section>
        <h4 className={heading}>{t('exp.voiceControl.results')}</h4>
        <p aria-live="polite" aria-atomic="true">
          {last ? (
            <>
              <span className="text-ink-soft">
                {locale === 'he' ? '״' : '“'}
                <bdi>{last.said}</bdi>
                {locale === 'he' ? '״' : '”'}
              </span>{' '}
              {last.message}
            </>
          ) : (
            t('exp.voiceControl.nothingYet')
          )}
        </p>
        {mismatches.length > 0 && (
          <div className="mt-2">
            <h5 className="font-medium">{t('exp.voiceControl.missed')}</h5>
            <ul className="list-disc ps-5">
              {mismatches.map((item) => (
                <li key={item.target}>
                  <span dir="auto">
                    {t('exp.voiceControl.shows', { visible: item.visible, name: item.name })}
                  </span>{' '}
                  <ShowOnPage target={item.target} /> <SaveFinding start={startFor(item)} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
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
      <h4 className={heading}>{t('panel.noticed')}</h4>
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
              <h5 className="font-medium">{t('exp.scan.incomplete')}</h5>
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
      <h5 className="font-medium">{issue.help}</h5>
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
              <span className="inline-flex flex-wrap gap-x-3">
                <ShowOnPage target={node.target} />
                <SaveFinding
                  start={{
                    kind: 'scan',
                    severity: issue.impact ?? 'moderate',
                    rule: {
                      id: issue.id,
                      help: issue.help,
                      description: issue.description,
                      helpUrl: issue.helpUrl,
                      wcag: issue.wcag,
                      level: issue.level,
                    },
                    element: { target: node.target, html: node.html },
                  }}
                />
              </span>
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
