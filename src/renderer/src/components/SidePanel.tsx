import type { MessageKey } from '../../../shared/i18n'
import { useT } from '../lib/i18n'

/** The ten experiences of 1.0, in the order the plan lists them. Each becomes a task card in a later step. */
export const experienceKeys: MessageKey[] = [
  'exp.colorBlindness',
  'exp.blurLowContrast',
  'exp.reader',
  'exp.zoom',
  'exp.largeText',
  'exp.highContrast',
  'exp.keyboard',
  'exp.noSound',
  'exp.motion',
  'exp.scan',
]

export function SidePanel() {
  const t = useT()
  return (
    <div className="p-5">
      <h2 id="panel-title" className="mb-2 text-lg">
        {t('panel.title')}
      </h2>
      <p className="mb-4 text-sm text-ink-soft">{t('panel.intro')}</p>
      <ul className="flex flex-col gap-2">
        {experienceKeys.map((key) => (
          <li key={key} className="card flex items-center justify-between gap-3 px-3 py-2 text-sm">
            <span>{t(key)}</span>
            <span className="badge">{t('panel.soon')}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
