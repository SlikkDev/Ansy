import { useState } from 'react'
import type { ExperienceId, ExperienceState } from '../../../shared/experiences'
import type { MessageKey } from '../../../shared/i18n'
import { tasks, type TaskId } from '../../../shared/tasks'
import { useCapture } from '../lib/findings'
import { useT } from '../lib/i18n'

const heading = 'mb-1 text-xs font-semibold uppercase tracking-wide text-ink-soft'

/**
 * The guided tasks: three things every visitor tries to do, each with a goal,
 * steps, and the experiences to try it with. Starting one makes it the default
 * on every finding saved until it is finished.
 */
export function TasksTab({
  task,
  onTask,
  onExperience,
}: {
  task: TaskId | null
  onTask: (task: TaskId | null) => void
  /** Turns an experience on and shows the Experiences tab. */
  onExperience: (patch: Partial<ExperienceState>) => void
}) {
  const t = useT()
  const capture = useCapture()
  const [announcement, setAnnouncement] = useState('')

  const start = (id: TaskId | null) => {
    onTask(id)
    setAnnouncement(
      id
        ? t('tasks.status.started', { name: t(`task.${id}` as MessageKey) })
        : t('tasks.status.finished'),
    )
  }

  return (
    <div className="p-5">
      <h2 className="mb-2 text-lg">{t('tasks.title')}</h2>
      <p className="mb-4 text-sm text-ink-soft">{t('tasks.intro')}</p>
      <ul className="flex flex-col gap-3">
        {tasks.map((info) => {
          const current = task === info.id
          const steps = t(`task.${info.id}.steps` as MessageKey).split('\n')
          return (
            <li key={info.id} className="card p-3 text-sm" data-task={info.id}>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-medium">{t(`task.${info.id}` as MessageKey)}</h3>
                {current && <span className="badge badge-on">{t('tasks.current')}</span>}
              </div>
              <section className="mb-2">
                <h4 className={heading}>{t('tasks.goal')}</h4>
                <p>{t(`task.${info.id}.goal` as MessageKey)}</p>
              </section>
              <section className="mb-2">
                <h4 className={heading}>{t('tasks.steps')}</h4>
                <ol className="list-decimal ps-5">
                  {steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </section>
              <section className="mb-3">
                <h4 className={heading}>{t('tasks.try')}</h4>
                <ul className="flex flex-wrap gap-1.5">
                  {info.experiences.map((id: ExperienceId) => (
                    <li key={id}>
                      <button
                        type="button"
                        className="btn min-h-8 px-2.5 text-xs"
                        disabled={!capture.enabled}
                        aria-label={t('tasks.turnOn', { name: t(`exp.${id}` as MessageKey) })}
                        onClick={() => onExperience({ active: id })}
                      >
                        {t(`exp.${id}` as MessageKey)}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={current ? 'btn' : 'btn btn-primary'}
                  aria-pressed={current}
                  onClick={() => start(current ? null : info.id)}
                >
                  {current ? t('tasks.finish') : t('tasks.start')}
                </button>
                {current && (
                  <button
                    type="button"
                    className="btn"
                    disabled={!capture.enabled}
                    onClick={() => capture.start({ kind: 'note' })}
                  >
                    {t('findings.noteNew')}
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      {!capture.enabled && <p className="mt-3 text-xs text-ink-soft">{t('panel.noSite')}</p>}
      <p className="visually-hidden" aria-live="polite">
        {announcement}
      </p>
    </div>
  )
}
