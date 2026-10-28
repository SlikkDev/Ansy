import { useState } from 'react'
import type { UpdateStatus } from '../../../shared/update'
import { ansy } from '../lib/ansy'
import { useT } from '../lib/i18n'

/** One line under the toolbar once a newer Ansy has finished downloading. */
export function UpdateBar({ status }: { status: UpdateStatus }) {
  const t = useT()
  const [dismissed, setDismissed] = useState<string | null>(null)
  if (status.phase !== 'ready' || dismissed === status.version) return null
  return (
    <div
      role="status"
      data-update-bar
      className="flex flex-wrap items-center gap-3 border-b border-line bg-canvas-2 px-3 py-2 text-sm"
    >
      <span>{t('update.ready', { version: status.version })}</span>
      <button type="button" className="btn btn-primary" onClick={() => void ansy.updates.install()}>
        {t('update.restart')}
      </button>
      <button type="button" className="btn-link" onClick={() => setDismissed(status.version)}>
        {t('update.later')}
      </button>
    </div>
  )
}
