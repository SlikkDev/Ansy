import { useId, useState, type ReactNode } from 'react'
import {
  blurModes,
  experienceInfo,
  experiences,
  visionModes,
  zoomLevels,
  type ExperienceId,
  type ExperienceReport,
  type ExperienceState,
  type Observations,
} from '../../../shared/experiences'
import type { MessageKey } from '../../../shared/i18n'
import type { SiteState } from '../../../shared/ipc'
import { useT, type T } from '../lib/i18n'
import { KeyboardFindings, ScanResults } from './Findings'

interface Props {
  report: ExperienceReport | null
  site: SiteState
  onChange: (patch: Partial<ExperienceState>) => void
  /** Scan the page again. */
  onScan: () => void
  /** Start the keyboard trail over. */
  onClearTrail: () => void
}

const nameKey = (id: ExperienceId) => `exp.${id}` as MessageKey
const textKey = (id: ExperienceId, part: 'what' | 'look' | 'fidelity') =>
  `exp.${id}.${part}` as MessageKey

const heading = 'mb-1 text-xs font-semibold uppercase tracking-wide text-ink-soft'

/**
 * The experiences, each a task card: what changes, what to look for, how close
 * it is to the real thing, and the switch. One experience runs at a time.
 */
export function ExperiencePanel({ report, site, onChange, onScan, onClearTrail }: Props) {
  const t = useT()
  const active = report?.state.active ?? null
  const [open, setOpen] = useState<ExperienceId | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const [previousActive, setPreviousActive] = useState(active)

  // Follow the running experience, and tell assistive tech when it starts or stops.
  if (active !== previousActive) {
    setPreviousActive(active)
    const changed = active ?? previousActive
    if (changed) {
      setAnnouncement(
        t(active ? 'panel.status.on' : 'panel.status.off', { name: t(nameKey(changed)) }),
      )
    }
    if (active) setOpen(active)
  }

  return (
    <div className="p-5">
      <h2 id="panel-title" className="mb-2 text-lg">
        {t('panel.title')}
      </h2>
      <p className="mb-4 text-sm text-ink-soft">{t('panel.intro')}</p>
      <ul className="flex flex-col gap-2">
        {experiences.map((info) => (
          <ExperienceRow
            key={info.id}
            id={info.id}
            isOpen={open === info.id}
            isActive={active === info.id}
            onToggleOpen={() => setOpen(open === info.id ? null : info.id)}
          >
            {info.available ? (
              <ExperienceCard
                id={info.id}
                report={report}
                isActive={active === info.id}
                siteOpen={site.open && !site.error}
                onChange={onChange}
                onScan={onScan}
                onClearTrail={onClearTrail}
              />
            ) : (
              <p className="text-sm text-ink-soft">{t(textKey(info.id, 'what'))}</p>
            )}
          </ExperienceRow>
        ))}
      </ul>
      <p className="visually-hidden" role="status">
        {announcement}
      </p>
    </div>
  )
}

function ExperienceRow({
  id,
  isOpen,
  isActive,
  onToggleOpen,
  children,
}: {
  id: ExperienceId
  isOpen: boolean
  isActive: boolean
  onToggleOpen: () => void
  children: ReactNode
}) {
  const t = useT()
  const panelId = useId()
  const { available } = experienceInfo(id)
  return (
    <li className="card overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-start text-sm font-medium"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggleOpen}
      >
        <span>{t(nameKey(id))}</span>
        {isActive ? (
          <span className="badge badge-on">{t('panel.on')}</span>
        ) : available ? null : (
          <span className="badge">{t('panel.soon')}</span>
        )}
      </button>
      <div id={panelId} hidden={!isOpen} className="border-t border-line px-3 py-3">
        {isOpen && children}
      </div>
    </li>
  )
}

function ExperienceCard({
  id,
  report,
  isActive,
  siteOpen,
  onChange,
  onScan,
  onClearTrail,
}: {
  id: ExperienceId
  report: ExperienceReport | null
  isActive: boolean
  siteOpen: boolean
  onChange: (patch: Partial<ExperienceState>) => void
  onScan: () => void
  onClearTrail: () => void
}) {
  const t = useT()
  const { fidelity } = experienceInfo(id)
  const lookFor = t(textKey(id, 'look')).split('\n')
  const state = report?.state ?? null
  const isScan = id === 'scan'
  return (
    <div className="flex flex-col gap-3 text-sm">
      <section>
        <h3 className={heading}>{t('panel.whatHappens')}</h3>
        <p>{t(textKey(id, 'what'))}</p>
      </section>

      {state && <Options id={id} state={state} onChange={onChange} />}

      <section>
        <h3 className={heading}>{t('panel.lookFor')}</h3>
        <ul className="list-disc ps-5">
          {lookFor.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <p className="text-ink-soft">
        <span className="badge me-2">
          {t(fidelity === 'high' ? 'fidelity.high' : 'fidelity.medium')}
        </span>
        {t(textKey(id, 'fidelity'))}
      </p>

      <div className="flex flex-wrap gap-2">
        {isScan && isActive && (
          <button
            type="button"
            className="btn btn-primary"
            disabled={report?.scanning}
            onClick={onScan}
          >
            {t('exp.scan.again')}
          </button>
        )}
        <button
          type="button"
          className={isActive ? 'btn' : 'btn btn-primary'}
          aria-pressed={isActive}
          disabled={!siteOpen && !isActive}
          onClick={() => onChange({ active: isActive ? null : id })}
        >
          {isActive ? t('panel.turnOff') : isScan ? t('exp.scan.run') : t('panel.turnOn')}
        </button>
      </div>
      {!siteOpen && !isActive && <p className="text-xs text-ink-soft">{t('panel.noSite')}</p>}

      {isActive && (id === 'motion' || id === 'noSound') && (
        <section aria-live="polite">
          <h3 className={heading}>{t('panel.noticed')}</h3>
          <Noticed id={id} observations={report?.observations ?? null} t={t} />
        </section>
      )}

      {isActive && id === 'keyboard' && report?.keyboard && (
        <>
          <p className="text-ink-soft">{t('exp.keyboard.hint')}</p>
          <KeyboardFindings report={report.keyboard} onClear={onClearTrail} />
        </>
      )}

      {isActive && isScan && report && (
        <ScanResults scan={report.scan} scanning={report.scanning} />
      )}
    </div>
  )
}

function Options({
  id,
  state,
  onChange,
}: {
  id: ExperienceId
  state: ExperienceState
  onChange: (patch: Partial<ExperienceState>) => void
}) {
  const t = useT()
  const group = useId()
  switch (id) {
    case 'colorBlindness':
      return (
        <fieldset>
          <legend className={heading}>{t('exp.colorBlindness.mode')}</legend>
          {visionModes.map((mode) => (
            <label key={mode} className="flex items-center gap-2 py-0.5">
              <input
                type="radio"
                name={group}
                checked={state.vision === mode}
                onChange={() => onChange({ vision: mode })}
              />
              {t(`exp.vision.${mode}` as MessageKey)}
            </label>
          ))}
        </fieldset>
      )
    case 'blurLowContrast':
      return (
        <fieldset>
          <legend className={heading}>{t('exp.blurLowContrast.mode')}</legend>
          {blurModes.map((mode) => (
            <label key={mode} className="flex items-center gap-2 py-0.5">
              <input
                type="radio"
                name={group}
                checked={state.blur === mode}
                onChange={() => onChange({ blur: mode })}
              />
              {t(`exp.blur.${mode}` as MessageKey)}
            </label>
          ))}
        </fieldset>
      )
    case 'zoom':
      return (
        <fieldset>
          <legend className={heading}>{t('exp.zoom.level')}</legend>
          {zoomLevels.map((level) => (
            <label key={level} className="flex items-center gap-2 py-0.5">
              <input
                type="radio"
                name={group}
                checked={state.zoom === level && !state.narrow}
                onChange={() => onChange({ zoom: level, narrow: false })}
              />
              {t(`exp.zoom.${level * 100}` as MessageKey)}
            </label>
          ))}
          <label className="flex items-center gap-2 py-0.5">
            <input
              type="radio"
              name={group}
              checked={state.narrow}
              onChange={() => onChange({ narrow: true })}
            />
            {t('exp.zoom.narrow')}
          </label>
        </fieldset>
      )
    case 'largeText':
      return (
        <fieldset>
          <legend className={heading}>{t('panel.options')}</legend>
          <label className="flex items-center gap-2 py-0.5">
            <input
              type="checkbox"
              checked={state.textSize}
              onChange={(e) => onChange({ textSize: e.target.checked })}
            />
            {t('exp.largeText.size')}
          </label>
          <label className="flex items-center gap-2 py-0.5">
            <input
              type="checkbox"
              checked={state.textSpacing}
              onChange={(e) => onChange({ textSpacing: e.target.checked })}
            />
            {t('exp.largeText.spacing')}
          </label>
        </fieldset>
      )
    case 'keyboard':
      return (
        <fieldset>
          <legend className={heading}>{t('panel.options')}</legend>
          <label className="flex items-center gap-2 py-0.5">
            <input
              type="checkbox"
              checked={state.mouseOff}
              onChange={(e) => onChange({ mouseOff: e.target.checked })}
            />
            {t('exp.keyboard.mouseOff')}
          </label>
        </fieldset>
      )
    default:
      return null
  }
}

function Noticed({
  id,
  observations,
  t,
}: {
  id: ExperienceId
  observations: Observations | null
  t: T
}) {
  if (!observations) return <p className="text-ink-soft">{t('panel.noticedPending')}</p>
  const lines: string[] = []
  if (id === 'motion') {
    if (observations.animations) {
      lines.push(t('exp.motion.animations', { count: observations.animations }))
    }
    if (observations.autoplay)
      lines.push(t('exp.motion.autoplay', { count: observations.autoplay }))
    if (!lines.length) lines.push(t('exp.motion.calm'))
  } else {
    if (observations.media) {
      lines.push(t('exp.noSound.media', { count: observations.media }))
      if (observations.mediaWithoutCaptions) {
        lines.push(t('exp.noSound.noCaptions', { count: observations.mediaWithoutCaptions }))
      }
    }
    if (observations.embeddedPlayers) {
      lines.push(t('exp.noSound.players', { count: observations.embeddedPlayers }))
    }
    if (!lines.length) lines.push(t('exp.noSound.none'))
  }
  return (
    <ul className="list-disc ps-5">
      {lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  )
}
