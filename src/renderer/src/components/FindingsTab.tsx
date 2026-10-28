import { useState } from 'react'
import {
  findingHeadline,
  forSite,
  siteKeyOf,
  sitesOf,
  type Finding,
  type RetestOutcome,
} from '../../../shared/findings'
import type { MessageKey } from '../../../shared/i18n'
import type { ExportFormat, SiteState } from '../../../shared/ipc'
import { explainRule, formatDate, severityLabel, wcagLabel } from '../../../shared/report'
import { ansy } from '../lib/ansy'
import { useCapture } from '../lib/findings'
import { useI18n, useT } from '../lib/i18n'

const heading = 'mb-1 text-xs font-semibold uppercase tracking-wide text-ink-soft'

/**
 * The findings, one site at a time: the list, the exports, and the switch for
 * the Slikk.Dev line at the end of a report.
 */
export function FindingsTab({
  findings,
  site,
  slikkLink,
  onSlikkLink,
}: {
  findings: Finding[]
  site: SiteState
  slikkLink: boolean
  onSlikkLink: (on: boolean) => void
}) {
  const t = useT()
  const capture = useCapture()
  const sites = sitesOf(findings)
  const [chosen, setChosen] = useState<string | null>(null)
  const [status, setStatus] = useState('')

  // The open site when it has findings, else the newest; a choice that vanished falls back too.
  const openSite = site.open ? siteKeyOf(site.url) : null
  const selected =
    chosen && sites.includes(chosen)
      ? chosen
      : openSite && sites.includes(openSite)
        ? openSite
        : (sites[0] ?? null)
  const list = forSite(findings, selected)

  const exportAs = async (format: ExportFormat) => {
    if (!selected) return
    setStatus('')
    const result = await ansy.findings.export(format, selected)
    if (result.ok) setStatus(t('findings.saved', { path: result.path }))
    else if (!result.canceled) setStatus(t('findings.exportFailed'))
  }
  const copy = async () => {
    if (!selected) return
    setStatus('')
    setStatus(
      (await ansy.findings.copy(selected)) ? t('findings.copied') : t('findings.exportFailed'),
    )
  }

  return (
    <div className="p-5">
      <h2 className="mb-2 text-lg">{t('findings.title')}</h2>
      <p className="mb-4 text-sm text-ink-soft">{t('findings.intro')}</p>

      {findings.length === 0 ? (
        <p className="mb-4 text-sm">{t('findings.empty')}</p>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-end gap-3">
            <div className="min-w-0 flex-1">
              <label htmlFor="findings-site" className="mb-1 block text-sm font-medium">
                {t('findings.site')}
              </label>
              <select
                id="findings-site"
                className="field w-full"
                dir="ltr"
                value={selected ?? ''}
                onChange={(event) => setChosen(event.target.value)}
              >
                {sites.map((host) => (
                  <option key={host} value={host}>
                    {host}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-sm text-ink-soft">
              {list.length === 1 ? t('findings.one') : t('findings.count', { count: list.length })}
            </p>
          </div>

          <div className="mb-2 flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary" onClick={() => void exportAs('pdf')}>
              {t('findings.exportPdf')}
            </button>
            <button type="button" className="btn" onClick={() => void exportAs('text')}>
              {t('findings.saveText')}
            </button>
            <button type="button" className="btn" onClick={() => void copy()}>
              {t('findings.copy')}
            </button>
          </div>
          <label className="mb-3 flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={slikkLink}
              onChange={(event) => onSlikkLink(event.target.checked)}
            />
            {t('findings.slikkLink')}
          </label>
        </>
      )}

      <p aria-live="polite" className="mb-3 break-all text-sm text-ink-soft">
        {status}
      </p>

      <button
        type="button"
        className="btn mb-4"
        disabled={!capture.enabled}
        onClick={() => capture.start({ kind: 'note' })}
      >
        {t('findings.noteNew')}
      </button>
      {!capture.enabled && <p className="mb-4 text-xs text-ink-soft">{t('panel.noSite')}</p>}

      <ul className="flex flex-col gap-2">
        {list.map((finding) => (
          <FindingCard key={finding.id} finding={finding} siteOpen={capture.enabled} />
        ))}
      </ul>
    </div>
  )
}

function FindingCard({ finding, siteOpen }: { finding: Finding; siteOpen: boolean }) {
  const t = useT()
  const { locale } = useI18n()
  const [shot, setShot] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const [status, setStatus] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const rule = finding.rule

  const loadShot = () => {
    if (shot) return
    void ansy.findings.screenshot(finding.id).then((data) => setShot(data))
  }
  const check = async () => {
    setChecking(true)
    setStatus(t('findings.retesting'))
    const result = await ansy.findings.retest(finding.id)
    setChecking(false)
    setStatus(result ? '' : t('findings.retest.busy'))
  }
  const judge = (outcome: RetestOutcome) =>
    void ansy.findings.update(finding.id, { retest: { at: Date.now(), outcome, by: 'owner' } })
  const show = () =>
    void ansy.experiences.show(finding.element?.target ?? '').then((found) => {
      if (!found) setStatus(t('panel.showMissing'))
    })

  return (
    <li className="card p-3 text-sm" data-finding={finding.id}>
      <p className="mb-1 flex flex-wrap items-center gap-2 text-xs">
        <span className={`badge badge-${finding.severity}`}>{severityLabel(finding, t)}</span>
        {rule && <span className="text-ink-soft">{wcagLabel(rule, t)}</span>}
      </p>
      <h3 className="text-base font-medium" dir="auto">
        {findingHeadline(finding)}
      </h3>
      <p className="text-xs text-ink-soft">
        {finding.title || finding.url}
        {' · '}
        {formatDate(finding.at, locale)}
      </p>
      <p className="text-xs text-ink-soft">
        {finding.experience
          ? t(`exp.${finding.experience}` as MessageKey)
          : t('findings.noExperience')}
        {' · '}
        {finding.task ? t(`task.${finding.task}` as MessageKey) : t('findings.noTask')}
      </p>

      {finding.note && (
        <section className="mt-2">
          <h4 className={heading}>{t('findings.note')}</h4>
          <p className="whitespace-pre-wrap border-s-2 border-accent ps-3" dir="auto">
            {finding.note}
          </p>
        </section>
      )}
      {rule && (
        <section className="mt-2">
          <h4 className={heading}>{t('findings.saw')}</h4>
          <p>{explainRule(rule, t)}</p>
        </section>
      )}
      {finding.element && (
        <section className="mt-2">
          <h4 className={heading}>{t('findings.element')}</h4>
          <code
            dir="ltr"
            className="block overflow-hidden text-ellipsis whitespace-nowrap text-xs text-ink-soft"
          >
            {finding.element.html || finding.element.target}
          </code>
        </section>
      )}
      {finding.screenshot && (
        <details className="mt-2" onToggle={loadShot}>
          <summary className="cursor-pointer text-ink-soft">{t('findings.screenshotShow')}</summary>
          {shot && (
            <img
              src={shot}
              alt={t('findings.screenshotAlt', { title: finding.title || finding.url })}
              className="mt-2 w-full rounded-md border border-line"
            />
          )}
        </details>
      )}

      {finding.retest && (
        <p className="mt-2">
          <span className="badge me-2">
            {t(`findings.retest.${finding.retest.outcome}` as MessageKey)}
          </span>
          <span className="text-xs text-ink-soft">{formatDate(finding.retest.at, locale)}</span>
        </p>
      )}
      {finding.retest?.outcome === 'unknown' && finding.retest.by === 'ansy' && (
        <div className="mt-2">
          <p className="mb-1">{t('findings.retest.ask')}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn" onClick={() => judge('fixed')}>
              {t('findings.retest.fixed')}
            </button>
            <button type="button" className="btn" onClick={() => judge('failing')}>
              {t('findings.retest.failing')}
            </button>
          </div>
        </div>
      )}

      <p aria-live="polite" className="mt-2 text-xs text-ink-soft">
        {status}
      </p>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {finding.element && siteOpen && (
          <button type="button" className="btn-link" onClick={show}>
            {t('panel.show')}
          </button>
        )}
        <button type="button" className="btn-link" disabled={checking} onClick={() => void check()}>
          {t('findings.retest')}
        </button>
        {confirmDelete ? (
          <>
            <button
              type="button"
              className="btn-link"
              onClick={() => void ansy.findings.remove(finding.id)}
            >
              {t('findings.deleteSure')}
            </button>
            <button type="button" className="btn-link" onClick={() => setConfirmDelete(false)}>
              {t('findings.keep')}
            </button>
          </>
        ) : (
          <button type="button" className="btn-link" onClick={() => setConfirmDelete(true)}>
            {t('findings.delete')}
          </button>
        )}
      </div>
    </li>
  )
}
