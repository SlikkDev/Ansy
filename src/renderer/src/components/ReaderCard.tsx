import { useEffect, useRef, useState } from 'react'
import type { MessageKey } from '../../../shared/i18n'
import {
  findingLabel,
  itemSpeech,
  readerRuleFor,
  type ReaderFinding,
  type ReaderReport,
} from '../../../shared/reader'
import { ansy } from '../lib/ansy'
import { useCapture } from '../lib/findings'
import { useI18n, useT } from '../lib/i18n'
import { useReader } from '../lib/reader'

const heading = 'mb-1 text-xs font-semibold uppercase tracking-wide text-ink-soft'

/**
 * The Ansy Reader card while it runs: the voice it found, where it is on the
 * page, buttons for the same moves the keys make, the keys themselves, the
 * transcript, and what the reader stumbled on.
 */
export function ReaderCard({ report, platform }: { report: ReaderReport; platform: string }) {
  const t = useT()
  const { locale } = useI18n()
  const reader = useReader()
  const capture = useCapture()
  const [saving, setSaving] = useState(false)

  const saveCurrent = async () => {
    if (report.cursor < 0 || saving) return
    setSaving(true)
    const element = await ansy.reader.element(report.cursor)
    setSaving(false)
    capture.start({ kind: 'note', element })
  }

  const hint = `exp.reader.noVoice.${platform}` as MessageKey
  const hasHint = platform === 'linux' || platform === 'darwin' || platform === 'win32'

  return (
    <div className="flex flex-col gap-3" data-reader>
      <p className="text-ink-soft" aria-live="polite">
        {reader.voice
          ? t('exp.reader.voiceOk', { name: reader.voice })
          : `${t('exp.reader.noVoice', { language: t(`exp.reader.language.${locale}`) })}${hasHint ? ' ' + t(hint) : ''}`}
      </p>

      <section>
        <h3 className={heading}>{t('exp.reader.current')}</h3>
        <p className="text-base font-medium" dir="auto" data-reader-current>
          {report.current ? itemSpeech(report.current, t) : t('exp.reader.nothing')}
        </p>
        <p className="mt-1 text-xs text-ink-soft">
          {t(report.mode === 'focus' ? 'exp.reader.mode.focus' : 'exp.reader.mode.browse')}
          {report.ready && (
            <>
              {' · '}
              {t('exp.reader.counts', {
                headings: report.headings,
                links: report.links,
                fields: report.fields,
                landmarks: report.landmarks,
              })}
            </>
          )}
        </p>
      </section>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn"
          onClick={() => reader.run({ kind: 'move', target: null, dir: -1 })}
        >
          {t('exp.reader.prev')}
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => reader.run({ kind: 'move', target: null, dir: 1 })}
        >
          {t('exp.reader.next')}
        </button>
        <button
          type="button"
          className="btn"
          disabled={!report.current}
          onClick={() => reader.run({ kind: 'activate' })}
        >
          {t('exp.reader.activate')}
        </button>
        {reader.reading ? (
          <button type="button" className="btn btn-primary" onClick={reader.stop}>
            {t('exp.reader.stop')}
          </button>
        ) : (
          <button type="button" className="btn" onClick={reader.readAll}>
            {t('exp.reader.readAll')}
          </button>
        )}
        <button type="button" className="btn" onClick={() => reader.run({ kind: 'refresh' })}>
          {t('exp.reader.refresh')}
        </button>
        {capture.enabled && (
          <button
            type="button"
            className="btn"
            disabled={report.cursor < 0 || saving}
            onClick={() => void saveCurrent()}
          >
            {t('exp.reader.saveCurrent')}
          </button>
        )}
      </div>

      <details>
        <summary className="cursor-pointer text-ink-soft">{t('exp.reader.keys')}</summary>
        <ul className="mt-1 list-disc ps-5 text-xs">
          {t('exp.reader.keys.list')
            .split('\n')
            .map((line) => (
              <li key={line}>{line}</li>
            ))}
        </ul>
      </details>

      <Transcript report={report} />

      <ReaderFindings findings={report.findings} />
    </div>
  )
}

function Transcript({ report }: { report: ReaderReport }) {
  const t = useT()
  const reader = useReader()
  const end = useRef<HTMLLIElement>(null)
  const count = reader.transcript.length

  // The newest line stays in view, like a terminal.
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest' })
  }, [count])

  /** The reader finding an item is about, if any, so the line shows what a real visitor would miss. */
  const findingFor = (index: number) => report.findings.find((f) => f.index === index) ?? null

  return (
    <section>
      <div className="mb-1 flex items-center justify-between gap-2">
        <h3 className={heading}>{t('exp.reader.transcript')}</h3>
        <button type="button" className="btn-link text-xs" disabled={!count} onClick={reader.clear}>
          {t('exp.reader.clear')}
        </button>
      </div>
      {count ? (
        <ol
          className="max-h-64 overflow-y-auto rounded border border-line bg-canvas p-2 text-sm"
          aria-label={t('exp.reader.transcript')}
          data-transcript
          // A scrolling region the keyboard can reach (WCAG 2.1.1), like a terminal's history.
          // The a11y lint rule's own docs make this exact exception for scroll containers.
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
        >
          {reader.transcript.map((line, i) => {
            const finding = line.event.type === 'item' ? findingFor(line.event.item.index) : null
            return (
              <li
                key={line.id}
                ref={i === count - 1 ? end : undefined}
                className="border-b border-line py-1 last:border-b-0"
              >
                <span dir="auto">{line.text}</span>
                {finding && ' '}
                {finding && (
                  <span className="badge ms-2">
                    {t(`reader.rule.${finding.rule}` as MessageKey)}
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      ) : (
        <p className="text-ink-soft">{t('exp.reader.transcriptEmpty')}</p>
      )}
    </section>
  )
}

/** What the reader stumbled on, each with the same two links as a keyboard finding. */
function ReaderFindings({ findings }: { findings: ReaderFinding[] }) {
  const t = useT()
  const capture = useCapture()
  const [missing, setMissing] = useState<number | null>(null)
  if (!findings.length) return null
  return (
    <section>
      <h3 className={heading}>{t('panel.noticed')}</h3>
      <ul className="list-disc ps-5" aria-live="polite">
        {findings.map((finding, i) => {
          const rule = readerRuleFor(finding.rule, t)
          return (
            <li key={`${finding.rule}-${finding.index}-${i}`} data-reader-finding={finding.rule}>
              <span className="font-medium">{rule.help}</span>
              {': '}
              <span dir="auto">{findingLabel(finding, t)}</span>{' '}
              <span className="inline-flex flex-wrap items-center gap-x-2">
                {finding.index >= 0 && (
                  <>
                    <button
                      type="button"
                      className="btn-link text-xs"
                      onClick={() =>
                        void ansy.reader
                          .show(finding.index)
                          .then((found) => setMissing(found ? null : finding.index))
                      }
                    >
                      {t('panel.show')}
                    </button>
                    <span aria-live="polite" className="text-xs text-ink-soft">
                      {missing === finding.index ? t('panel.showMissing') : ''}
                    </span>
                  </>
                )}
                {capture.enabled && (
                  <button
                    type="button"
                    className="btn-link text-xs"
                    onClick={() =>
                      capture.start({
                        kind: 'reader',
                        severity: rule.severity,
                        rule: {
                          id: rule.id,
                          help: rule.help,
                          description: rule.description,
                          helpUrl: rule.helpUrl,
                          wcag: rule.wcag,
                          level: rule.level,
                        },
                        element: finding.element,
                      })
                    }
                  >
                    {t('findings.save')}
                  </button>
                )}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
