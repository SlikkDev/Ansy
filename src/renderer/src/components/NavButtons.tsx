import type { SiteState } from '../../../shared/ipc'
import { ansy } from '../lib/ansy'
import { useT } from '../lib/i18n'
import { ArrowBack, ArrowForward, Reload, Stop } from './Icons'

/** Back, forward, and reload (or stop while a page loads). */
export function NavButtons({ site }: { site: SiteState }) {
  const t = useT()
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        className="btn btn-icon"
        onClick={() => void ansy.site.back()}
        disabled={!site.canGoBack}
        aria-label={t('toolbar.back')}
        title={t('toolbar.back')}
      >
        <ArrowBack />
      </button>
      <button
        type="button"
        className="btn btn-icon"
        onClick={() => void ansy.site.forward()}
        disabled={!site.canGoForward}
        aria-label={t('toolbar.forward')}
        title={t('toolbar.forward')}
      >
        <ArrowForward />
      </button>
      {site.loading ? (
        <button
          type="button"
          className="btn btn-icon"
          onClick={() => void ansy.site.stop()}
          aria-label={t('toolbar.stop')}
          title={t('toolbar.stop')}
        >
          <Stop />
        </button>
      ) : (
        <button
          type="button"
          className="btn btn-icon"
          onClick={() => void ansy.site.reload()}
          disabled={!site.open}
          aria-label={t('toolbar.reload')}
          title={t('toolbar.reload')}
        >
          <Reload />
        </button>
      )}
    </div>
  )
}
