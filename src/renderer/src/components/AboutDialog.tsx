import { useEffect, useRef, useState } from 'react'
import { ansy } from '../lib/ansy'
import { useT } from '../lib/i18n'
import { AnsyMark, External } from './Icons'
import { Wordmark } from './Wordmark'

const GITHUB = 'https://github.com/SlikkDev/Ansy'
const SLIKK = 'https://slikk.dev/'

/** Name, version, what Ansy is and isn't, the disclaimer, the licence, and who built it. */
export function AboutDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT()
  const ref = useRef<HTMLDialogElement>(null)
  const [version, setVersion] = useState('')

  useEffect(() => {
    void ansy.app.info().then((info) => setVersion(info.version))
  }, [])

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      // The site view is a native layer above this window; hide it while the dialog is up.
      void ansy.site.suppress(true)
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      className="card m-auto w-[min(90vw,34rem)] p-0 text-ink backdrop:bg-black/55"
      aria-labelledby="about-title"
      onClose={() => {
        void ansy.site.suppress(false)
        onClose()
      }}
    >
      <div className="p-7">
        <div className="mb-4 flex items-center gap-3">
          <AnsyMark width={40} height={40} />
          <div>
            <h2 id="about-title" className="text-xl leading-tight">
              {t('about.title')}
            </h2>
            {version && <p className="text-sm text-ink-soft">{t('about.version', { version })}</p>}
          </div>
        </div>

        <p className="mb-4 text-base">{t('about.body')}</p>

        <p className="mb-4 border-s-2 border-accent ps-4 text-sm text-ink-soft">
          {t('about.disclaimer')}
        </p>

        <p className="mb-5 text-sm text-ink-soft">{t('about.license')}</p>

        <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
          <button
            type="button"
            className="btn-link inline-flex items-center gap-1"
            onClick={() => void ansy.app.openExternal(GITHUB)}
          >
            {t('about.source')}
            <External />
          </button>
          <button
            type="button"
            className="btn-link inline-flex items-center gap-2 no-underline"
            aria-label={t('about.credit')}
            onClick={() => void ansy.app.openExternal(SLIKK)}
          >
            <span>{t('about.builtBy')}</span>
            <Wordmark className="h-[0.95em] w-auto text-ink" />
          </button>
        </div>

        <div className="flex justify-end">
          <button type="button" className="btn" onClick={onClose}>
            {t('about.close')}
          </button>
        </div>
      </div>
    </dialog>
  )
}
