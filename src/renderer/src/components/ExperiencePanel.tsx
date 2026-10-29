import { useId, useState, type ReactNode } from 'react'
import {
  blurModes,
  experienceAreas,
  experienceInfo,
  experiences,
  fieldModes,
  hazeModes,
  readerRates,
  visionModes,
  zoomLevels,
  type ExperienceArea,
  type ExperienceId,
  type ExperienceReport,
  type ExperienceState,
  type Observations,
} from '../../../shared/experiences'
import type { MessageKey } from '../../../shared/i18n'
import type { SiteState } from '../../../shared/ipc'
import { useT, type T } from '../lib/i18n'
import { switchSpeeds } from '../../../shared/motor'
import { KeyboardFindings, ScanResults, SwitchFindings, VoiceCommands } from './Findings'
import { ReaderCard } from './ReaderCard'

interface Props {
  report: ExperienceReport | null
  site: SiteState
  platform: string
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

const fidelityKey = {
  high: 'fidelity.high',
  medium: 'fidelity.medium',
  low: 'fidelity.low',
} as const

/**
 * The experiences, grouped by area, each a task card: what changes, what to
 * look for, how close it is to the real thing, and the switch. One experience
 * runs at a time.
 */
export function ExperiencePanel({ report, site, platform, onChange, onScan, onClearTrail }: Props) {
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
      <div className="flex flex-col gap-4">
        {experienceAreas.map((area) => (
          <AreaGroup key={area} area={area}>
            {experiences
              .filter((info) => info.area === area)
              .map((info) => (
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
                      platform={platform}
                      onChange={onChange}
                      onScan={onScan}
                      onClearTrail={onClearTrail}
                    />
                  ) : (
                    <p className="text-sm text-ink-soft">{t(textKey(info.id, 'what'))}</p>
                  )}
                </ExperienceRow>
              ))}
          </AreaGroup>
        ))}
      </div>
      <p className="visually-hidden" role="status">
        {announcement}
      </p>
    </div>
  )
}

function AreaGroup({ area, children }: { area: ExperienceArea; children: ReactNode }) {
  const t = useT()
  const id = useId()
  return (
    <section aria-labelledby={id}>
      <h3 id={id} className={heading}>
        {t(`area.${area}` as MessageKey)}
      </h3>
      <ul className="flex flex-col gap-2">{children}</ul>
    </section>
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
  platform,
  onChange,
  onScan,
  onClearTrail,
}: {
  id: ExperienceId
  report: ExperienceReport | null
  isActive: boolean
  siteOpen: boolean
  platform: string
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
        <h4 className={heading}>{t('panel.whatHappens')}</h4>
        <p>{t(textKey(id, 'what'))}</p>
      </section>

      {state && <Options id={id} state={state} onChange={onChange} />}

      <section>
        <h4 className={heading}>{t('panel.lookFor')}</h4>
        <ul className="list-disc ps-5">
          {lookFor.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <p className="text-ink-soft">
        <span className="badge me-2">{t(fidelityKey[fidelity])}</span>
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

      {isActive && (id === 'motion' || id === 'noSound' || id === 'darkMode') && (
        <section aria-live="polite">
          <h4 className={heading}>{t('panel.noticed')}</h4>
          <Noticed id={id} observations={report?.observations ?? null} t={t} />
        </section>
      )}

      {isActive && id === 'keyboard' && report?.keyboard && (
        <>
          <p className="text-ink-soft">{t('exp.keyboard.hint')}</p>
          <KeyboardFindings report={report.keyboard} onClear={onClearTrail} />
        </>
      )}

      {isActive && id === 'switchAccess' && report?.switchAccess && (
        <>
          <p className="text-ink-soft">{t('exp.switchAccess.hint')}</p>
          <SwitchFindings report={report.switchAccess} onClear={onClearTrail} />
        </>
      )}

      {isActive && id === 'tremor' && report?.tremor && (
        <section aria-live="polite">
          <h4 className={heading}>{t('panel.noticed')}</h4>
          <p>
            {report.tremor.clicks
              ? t('exp.tremor.clicks', {
                  clicks: report.tremor.clicks,
                  misses: report.tremor.misses,
                })
              : t('exp.tremor.noClicks')}
          </p>
        </section>
      )}

      {isActive && id === 'voiceControl' && report?.voice && (
        <VoiceCommands mismatches={report.voice.mismatches} platform={platform} />
      )}

      {isActive && (isScan || id === 'tremor' || id === 'voiceControl') && report && (
        <ScanResults scan={report.scan} scanning={report.scanning} />
      )}

      {isActive && id === 'reader' && report?.reader && (
        <ReaderCard report={report.reader} platform={platform} />
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
    case 'tunnelVision':
      return (
        <fieldset>
          <legend className={heading}>{t('exp.tunnelVision.mode')}</legend>
          {fieldModes.map((mode) => (
            <label key={mode} className="flex items-center gap-2 py-0.5">
              <input
                type="radio"
                name={group}
                checked={state.field === mode}
                onChange={() => onChange({ field: mode })}
              />
              {t(`exp.field.${mode}` as MessageKey)}
            </label>
          ))}
        </fieldset>
      )
    case 'haze':
      return (
        <fieldset>
          <legend className={heading}>{t('exp.haze.mode')}</legend>
          {hazeModes.map((mode) => (
            <label key={mode} className="flex items-center gap-2 py-0.5">
              <input
                type="radio"
                name={group}
                checked={state.haze === mode}
                onChange={() => onChange({ haze: mode })}
              />
              {t(`exp.haze.${mode}` as MessageKey)}
            </label>
          ))}
        </fieldset>
      )
    case 'darkMode':
      return (
        <fieldset>
          <legend className={heading}>{t('panel.options')}</legend>
          <label className="flex items-center gap-2 py-0.5">
            <input
              type="checkbox"
              checked={state.darkForce}
              onChange={(e) => onChange({ darkForce: e.target.checked })}
            />
            {t('exp.darkMode.force')}
          </label>
          <p className="ps-6 text-xs text-ink-soft">{t('exp.darkMode.forceHint')}</p>
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
    case 'switchAccess':
      return (
        <fieldset>
          <legend className={heading}>{t('exp.switchAccess.speed')}</legend>
          {switchSpeeds.map((speed) => (
            <label key={speed} className="flex items-center gap-2 py-0.5">
              <input
                type="radio"
                name={group}
                checked={state.switchSpeed === speed}
                onChange={() => onChange({ switchSpeed: speed })}
              />
              {t(`exp.switchAccess.speed.${speed}` as MessageKey)}
            </label>
          ))}
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
    case 'reader':
      return (
        <>
          <fieldset>
            <legend className={heading}>{t('panel.options')}</legend>
            <label className="flex items-center gap-2 py-0.5">
              <input
                type="checkbox"
                checked={state.readerVoice}
                onChange={(e) => onChange({ readerVoice: e.target.checked })}
              />
              {t('exp.reader.voice')}
            </label>
            <label className="flex items-center gap-2 py-0.5">
              <input
                type="checkbox"
                checked={state.readerCover}
                onChange={(e) => onChange({ readerCover: e.target.checked })}
              />
              {t('exp.reader.cover')}
            </label>
            <p className="ps-6 text-xs text-ink-soft">{t('exp.reader.coverHint')}</p>
          </fieldset>
          <fieldset>
            <legend className={heading}>{t('exp.reader.rate')}</legend>
            {readerRates.map((rate) => (
              <label key={rate} className="flex items-center gap-2 py-0.5">
                <input
                  type="radio"
                  name={group}
                  checked={state.readerRate === rate}
                  onChange={() => onChange({ readerRate: rate })}
                />
                {t(`exp.reader.rate.${rate}` as MessageKey)}
              </label>
            ))}
          </fieldset>
        </>
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
  } else if (id === 'darkMode') {
    lines.push(t(observations.darkBackground ? 'exp.darkMode.has' : 'exp.darkMode.none'))
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
