import { useEffect, useRef, useState, type FormEvent } from 'react'
import { experiences, type ExperienceId } from '../../../shared/experiences'
import { type Finding, type FindingDraft, type Severity, isFinding } from '../../../shared/findings'
import type { MessageKey } from '../../../shared/i18n'
import type { SiteState } from '../../../shared/ipc'
import { explainRule, wcagLabel } from '../../../shared/report'
import { tasks, type TaskId } from '../../../shared/tasks'
import { ansy } from '../lib/ansy'
import type { CaptureStart } from '../lib/findings'
import { useT } from '../lib/i18n'

/** What the dialog is opened with. A new `seq` resets the form. */
export interface CaptureDraft {
  seq: number
  start: CaptureStart
  /** The screenshot Ansy just took, as a data URL, or null when it could not. */
  preview: string | null
}

/**
 * "Save a finding": what Ansy saw (if it was Ansy), the owner's note, the task
 * and experience it belongs to, and the screenshot. A native dialog, like
 * About, so the site view is covered while it is open.
 */
export function CaptureDialog({
  draft,
  site,
  task,
  experience,
  onClose,
  onSaved,
}: {
  draft: CaptureDraft | null
  site: SiteState
  task: TaskId | null
  experience: ExperienceId | null
  onClose: () => void
  onSaved: (finding: Finding) => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const open = draft !== null

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      void ansy.site.suppress(true)
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      className="card m-auto w-[min(92vw,36rem)] p-0 text-ink backdrop:bg-black/55"
      aria-labelledby="capture-title"
      onClose={() => {
        void ansy.site.suppress(false)
        onClose()
      }}
    >
      {draft && (
        <CaptureForm
          key={draft.seq}
          draft={draft}
          site={site}
          task={task}
          experience={experience}
          onCancel={() => ref.current?.close()}
          onSaved={(finding) => {
            onSaved(finding)
            ref.current?.close()
          }}
        />
      )}
    </dialog>
  )
}

const label = 'mb-1 block text-sm font-medium'
const heading = 'mb-1 text-xs font-semibold uppercase tracking-wide text-ink-soft'

function CaptureForm({
  draft,
  site,
  task,
  experience,
  onCancel,
  onSaved,
}: {
  draft: CaptureDraft
  site: SiteState
  task: TaskId | null
  experience: ExperienceId | null
  onCancel: () => void
  onSaved: (finding: Finding) => void
}) {
  const t = useT()
  const { start, preview } = draft
  const [note, setNote] = useState('')
  const [chosenTask, setChosenTask] = useState<TaskId | ''>(task ?? '')
  const [chosenExperience, setChosenExperience] = useState<ExperienceId | ''>(experience ?? '')
  const [keep, setKeep] = useState(preview !== null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const rule = start.rule ?? null
  const severity: Severity = start.kind === 'note' ? 'owner' : (start.severity ?? 'moderate')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (start.kind === 'note' && !note.trim()) {
      setError(t('capture.needNote'))
      return
    }
    setSaving(true)
    const finding: FindingDraft = {
      kind: start.kind,
      url: site.url,
      title: site.title,
      experience: chosenExperience || null,
      task: chosenTask || null,
      note: note.trim(),
      severity,
      rule,
      element: start.element ?? null,
      screenshot: keep && preview !== null,
    }
    const saved = await ansy.findings.add(finding)
    setSaving(false)
    if (isFinding(saved)) onSaved(saved)
    else setError(t('capture.failed'))
  }

  return (
    <form className="flex flex-col gap-4 p-6" onSubmit={(event) => void submit(event)}>
      <h2 id="capture-title" className="text-xl leading-tight">
        {t('capture.title')}
      </h2>

      <p className="text-sm text-ink-soft">
        {t('capture.page')}: {site.title || site.url}{' '}
        <span dir="ltr" className="break-all">
          {site.url}
        </span>
      </p>

      {rule && (
        <section className="text-sm">
          <h3 className={heading}>{t('capture.saw')}</h3>
          <p className="mb-1 flex flex-wrap items-center gap-2 text-xs">
            <span className={`badge badge-${severity}`}>
              {severity === 'owner'
                ? t('findings.severity.owner')
                : t(`exp.scan.impact.${severity}` as MessageKey)}
            </span>
            <span className="text-ink-soft">{wcagLabel(rule, t)}</span>
          </p>
          <p className="font-medium">{rule.help}</p>
          <p>{explainRule(rule, t)}</p>
          {start.element && (
            <code
              dir="ltr"
              className="mt-1 block overflow-hidden text-ellipsis whitespace-nowrap text-xs text-ink-soft"
            >
              {start.element.html || start.element.target}
            </code>
          )}
        </section>
      )}

      <div>
        <label htmlFor="capture-note" className={label}>
          {t('capture.note')}
        </label>
        <textarea
          id="capture-note"
          className="field min-h-24 w-full py-2"
          value={note}
          onChange={(event) => {
            setNote(event.target.value)
            if (error) setError('')
          }}
          aria-describedby="capture-note-hint"
          aria-invalid={error ? true : undefined}
        />
        <p id="capture-note-hint" className="mt-1 text-xs text-ink-soft">
          {t('capture.noteHint')}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="capture-task" className={label}>
            {t('capture.task')}
          </label>
          <select
            id="capture-task"
            className="field w-full"
            value={chosenTask}
            onChange={(event) => setChosenTask(event.target.value as TaskId | '')}
          >
            <option value="">{t('capture.none')}</option>
            {tasks.map((info) => (
              <option key={info.id} value={info.id}>
                {t(`task.${info.id}` as MessageKey)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="capture-experience" className={label}>
            {t('capture.experience')}
          </label>
          <select
            id="capture-experience"
            className="field w-full"
            value={chosenExperience}
            onChange={(event) => setChosenExperience(event.target.value as ExperienceId | '')}
          >
            <option value="">{t('capture.none')}</option>
            {experiences
              .filter((info) => info.available)
              .map((info) => (
                <option key={info.id} value={info.id}>
                  {t(`exp.${info.id}` as MessageKey)}
                </option>
              ))}
          </select>
        </div>
      </div>

      {preview ? (
        <div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={keep}
              onChange={(event) => setKeep(event.target.checked)}
            />
            {t('capture.screenshot')}
          </label>
          <img
            src={preview}
            alt={t('capture.screenshotAlt')}
            className="mt-2 max-h-44 w-auto rounded-md border border-line"
          />
        </div>
      ) : (
        <p className="text-sm text-ink-soft">{t('capture.noScreenshot')}</p>
      )}

      <p aria-live="assertive" className="text-sm text-accent">
        {error}
      </p>

      <div className="flex justify-end gap-2">
        <button type="button" className="btn" onClick={onCancel}>
          {t('capture.cancel')}
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {t('capture.save')}
        </button>
      </div>
    </form>
  )
}
