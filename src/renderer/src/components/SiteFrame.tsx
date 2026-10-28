import { useLayoutEffect, useRef } from 'react'
import type { SiteState } from '../../../shared/ipc'
import { ansy } from '../lib/ansy'
import { useI18n, useT } from '../lib/i18n'
import { AnsyMark } from './Icons'

/**
 * The hole Ansy leaves for the site view. The native view is placed over this
 * element, so it reports its own bounds to the main process whenever they
 * change, and shows the welcome and error cards when there is no page to show.
 */
export function SiteFrame({ site, isMac }: { site: SiteState; isMac: boolean }) {
  const t = useT()
  const { dir } = useI18n()
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const send = () => {
      const rect = element.getBoundingClientRect()
      void ansy.site.setBounds({
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
      })
    }
    send()
    const observer = new ResizeObserver(send)
    observer.observe(element)
    window.addEventListener('resize', send)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', send)
    }
    // dir moves the frame to the other side of the panel without resizing it.
  }, [dir])

  const status = site.loading
    ? t('site.loading')
    : site.error
      ? t('error.title')
      : site.open
        ? site.title
        : t('site.empty')

  return (
    <div ref={ref} className="absolute inset-0 overflow-auto">
      <p className="visually-hidden" aria-live="polite">
        {status}
      </p>

      {site.open && !site.error && (
        <>
          <h1 className="visually-hidden">{site.title || site.url}</h1>
          <button type="button" className="skip-link" onClick={() => void ansy.site.focus()}>
            {t('site.focus')}
          </button>
        </>
      )}

      {!site.open && (
        <div className="flex h-full items-center justify-center p-8">
          <div className="card max-w-xl px-8 py-10 text-center">
            <AnsyMark width={56} height={56} className="mx-auto mb-5" />
            <h1 className="mb-3 text-3xl leading-tight">{t('welcome.title')}</h1>
            <p className="mb-5 text-base text-ink-soft">{t('welcome.body')}</p>
            <p className="text-sm text-ink-soft">
              {t('welcome.hint', { shortcut: isMac ? '⌘L' : 'Ctrl+L' })}
            </p>
          </div>
        </div>
      )}

      {site.error && (
        <div className="flex h-full items-center justify-center p-8">
          <div className="card max-w-xl px-8 py-10 text-center">
            <h1 className="mb-3 text-2xl leading-tight">{t('error.title')}</h1>
            <p className="mb-2 text-base text-ink-soft">{t('error.body')}</p>
            <p className="mb-6 text-sm text-ink-soft" dir="ltr">
              {site.error.description} ({site.error.code})
            </p>
            <button type="button" className="btn" onClick={() => void ansy.site.reload()}>
              {t('error.retry')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
