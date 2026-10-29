import { useEffect, useState } from 'react'
import {
  FLASH_LIMIT,
  isHebrewText,
  type FlashReport,
  type PlainLanguageReport,
  type ReadingReport,
} from '../../../shared/cognitive'
import { pageRules } from '../../../shared/findings'
import type { MessageKey } from '../../../shared/i18n'
import type { KeyboardFinding } from '../../../shared/keyboard'
import { ansy } from '../lib/ansy'
import type { CaptureStart } from '../lib/findings'
import { useT } from '../lib/i18n'
import { listVoices, onVoices, pickVoice, speak, stopSpeaking } from '../lib/speech'
import { SaveFinding, ShowOnPage } from './Findings'

const heading = 'mb-1 text-xs font-semibold uppercase tracking-wide text-ink-soft'

type PageRule = (typeof pageRules)[keyof typeof pageRules]

/** A finding from one of Ansy's own page checks, ready for the capture dialog. */
const checkStart = (rule: PageRule, help: string, item: KeyboardFinding): CaptureStart => ({
  kind: 'check',
  severity: rule.severity,
  rule: {
    id: rule.id,
    help,
    description: '',
    helpUrl: '',
    wcag: [...rule.wcag],
    level: rule.level,
  },
  element: { target: item.target, html: item.label },
})

function FoundList({
  title,
  items,
  rule,
}: {
  title: string
  items: KeyboardFinding[]
  rule: PageRule
}) {
  return (
    <div className="mt-2">
      <h5 className="font-medium">{title}</h5>
      <ul className="list-disc ps-5">
        {items.map((item) => (
          <li key={item.target}>
            <span dir="auto">{item.label}</span> <ShowOnPage target={item.target} />{' '}
            <SaveFinding start={checkStart(rule, title, item)} />
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Reads the text selected in the site aloud, in its own language, with the
 * system's voice. The words show on the card too, for a computer with no voice.
 */
function ReadAloud() {
  const t = useT()
  const [voices, setVoices] = useState(listVoices)
  const [said, setSaid] = useState<{ text: string; spoken: boolean } | null>(null)
  const [empty, setEmpty] = useState(false)
  useEffect(() => onVoices(() => setVoices(listVoices())), [])
  useEffect(() => () => stopSpeaking(), [])

  const read = async () => {
    const text = await ansy.experiences.selection()
    setEmpty(!text)
    if (!text) {
      setSaid(null)
      return
    }
    const locale = isHebrewText(text) ? 'he' : 'en'
    const { voice } = pickVoice(locale, voices)
    const spoken = speak(text, { locale, rate: 'normal', voice })
    setSaid({ text, spoken })
  }

  return (
    <section>
      <h4 className={heading}>{t('exp.readingAids.readAloud')}</h4>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn" onClick={() => void read()}>
          {t('exp.readingAids.read')}
        </button>
        <button type="button" className="btn" onClick={stopSpeaking}>
          {t('exp.readingAids.stop')}
        </button>
      </div>
      <div aria-live="polite" className="mt-2">
        {empty && <p>{t('exp.readingAids.noSelection')}</p>}
        {said && (
          <>
            {!said.spoken && <p className="text-ink-soft">{t('exp.readingAids.noVoice')}</p>}
            <p dir="auto" className="card mt-1 max-h-40 overflow-auto p-2">
              {said.text}
            </p>
          </>
        )}
      </div>
    </section>
  )
}

export function ReadingAidsCard({ report }: { report: ReadingReport | null }) {
  const t = useT()
  return (
    <>
      <p className="text-ink-soft">{t('exp.readingAids.hint')}</p>
      <ReadAloud />
      {report && (
        <section aria-live="polite">
          <h4 className={heading}>{t('panel.noticed')}</h4>
          {report.clipped.length ? (
            <FoundList
              title={t('exp.readingAids.clipped')}
              items={report.clipped}
              rule={pageRules.textClipped}
            />
          ) : (
            <p>{t('exp.readingAids.noClipped')}</p>
          )}
        </section>
      )}
    </>
  )
}

export function PlainLanguageCard({
  report,
}: {
  report: { score: PlainLanguageReport | null } | null
}) {
  const t = useT()
  const score = report?.score ?? null
  return (
    <section aria-live="polite">
      <h4 className={heading}>{t('panel.noticed')}</h4>
      {!report ? (
        <p>{t('exp.plainLanguage.scoring')}</p>
      ) : !score ? (
        <p>{t('exp.plainLanguage.tooLittle')}</p>
      ) : (
        <>
          <p className="font-medium">
            {score.method === 'roughHebrew' && (
              <span className="badge me-2">{t('exp.plainLanguage.rough')}</span>
            )}
            {t(`exp.plainLanguage.level.${score.level}` as MessageKey)}
          </p>
          <p>
            {score.method === 'fleschKincaid'
              ? t('exp.plainLanguage.grade', { grade: score.grade ?? 0 })
              : t('exp.plainLanguage.hebrew')}
          </p>
          <p className="text-ink-soft">
            {t('exp.plainLanguage.counts', {
              words: score.words,
              sentences: score.sentences,
              sentenceLength: score.sentenceLength,
              wordLength: score.wordLength,
            })}
          </p>
          {score.hardest.length > 0 ? (
            <FoundList
              title={t('exp.plainLanguage.hardest')}
              items={score.hardest.map((h, i) => ({
                target: h.target,
                label: `${i + 1}. ${h.label} (${t('exp.plainLanguage.perSentence', { count: h.sentenceLength })})`,
              }))}
              rule={pageRules.readingLevel}
            />
          ) : (
            <p>{t('exp.plainLanguage.noHardest')}</p>
          )}
        </>
      )}
    </section>
  )
}

export function FlashingCard({ report }: { report: FlashReport | null }) {
  const t = useT()
  if (!report) return null
  const over = report.worst > FLASH_LIMIT
  return (
    <section aria-live="polite">
      <h4 className={heading}>{t('panel.noticed')}</h4>
      <p>{t('exp.flashing.watching', { frames: report.frames })}</p>
      <p className={over ? 'font-medium' : undefined}>
        {report.worst
          ? t(over ? 'exp.flashing.over' : 'exp.flashing.under', { count: report.worst })
          : t('exp.flashing.none')}
      </p>
      {over && report.element && (
        <FoundList
          title={t('exp.flashing.where')}
          items={[report.element]}
          rule={pageRules.flashes}
        />
      )}
    </section>
  )
}
