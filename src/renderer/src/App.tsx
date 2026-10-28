import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import {
  sanitizeExperiencePatch,
  type ExperienceReport,
  type ExperienceState,
} from '../../shared/experiences'
import { resolveLocale, type Locale } from '../../shared/i18n'
import { emptySiteState, type InitialState, type Settings, type SiteState } from '../../shared/ipc'
import { AboutDialog } from './components/AboutDialog'
import { AddressBar, type AddressBarHandle } from './components/AddressBar'
import { AnsyMark, Info } from './components/Icons'
import { ExperiencePanel } from './components/ExperiencePanel'
import { NavButtons } from './components/NavButtons'
import { SiteFrame } from './components/SiteFrame'
import { LangSwitch, ThemeToggle } from './components/Toggles'
import { ansy } from './lib/ansy'
import { applyLocale, I18nProvider, useT } from './lib/i18n'
import { applyTheme, followSystemTheme, resolveTheme } from './lib/theme'

export function App({ initial }: { initial: InitialState }) {
  const [settings, setSettings] = useState<Settings>(initial.settings)
  const [locale, setLocale] = useState<Locale>(initial.locale)
  const [theme, setTheme] = useState(() => resolveTheme(initial.settings.theme))
  const [site, setSite] = useState<SiteState>(emptySiteState)
  const [report, setReport] = useState<ExperienceReport | null>(null)
  const [aboutOpen, setAboutOpen] = useState(false)
  const addressRef = useRef<AddressBarHandle>(null)
  const isMac = initial.platform === 'darwin'

  useEffect(() => {
    void ansy.site.getState().then((state) => state && setSite(state))
    return ansy.site.onState(setSite)
  }, [])

  useEffect(() => {
    void ansy.experiences.get().then((current) => current && setReport(current))
    return ansy.experiences.onReport(setReport)
  }, [])

  const changeExperience = useCallback((patch: Partial<ExperienceState>) => {
    // Show the choice at once; the main process confirms (and adds what it noticed) right after.
    setReport((current) => {
      if (!current) return current
      const state = sanitizeExperiencePatch(current.state, patch)
      const startsScan = state.active === 'scan' && current.state.active !== 'scan'
      return { ...current, state, scanning: current.scanning || startsScan }
    })
    void ansy.experiences.set(patch).then((next) => next && setReport(next))
  }, [])

  const scanAgain = useCallback(() => {
    void ansy.experiences.scan().then((next) => next && setReport(next))
  }, [])

  const clearTrail = useCallback(() => void ansy.experiences.resetKeyboard(), [])

  useEffect(
    () =>
      ansy.ui.onCommand((command) => {
        if (command === 'focus-address') addressRef.current?.focus()
        if (command === 'open-about') setAboutOpen(true)
      }),
    [],
  )

  const themeSetting = settings.theme
  useEffect(() => followSystemTheme(() => themeSetting, setTheme), [themeSetting])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const primary = isMac ? event.metaKey : event.ctrlKey
      if (primary && event.key.toLowerCase() === 'l') {
        event.preventDefault()
        addressRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isMac])

  const changeLocale = useCallback(
    async (next: Locale) => {
      const saved = await ansy.settings.set({ locale: next })
      setSettings(saved)
      const resolved = resolveLocale(saved.locale, initial.systemLocale)
      applyLocale(resolved)
      setLocale(resolved)
    },
    [initial.systemLocale],
  )

  const toggleTheme = useCallback(async () => {
    const saved = await ansy.settings.set({ theme: theme === 'dark' ? 'light' : 'dark' })
    setSettings(saved)
    setTheme(applyTheme(saved.theme))
  }, [theme])

  return (
    <I18nProvider locale={locale}>
      <Shell
        site={site}
        report={report}
        onExperience={changeExperience}
        onScan={scanAgain}
        onClearTrail={clearTrail}
        locale={locale}
        theme={theme}
        isMac={isMac}
        addressRef={addressRef}
        onLocale={changeLocale}
        onTheme={toggleTheme}
        onAbout={() => setAboutOpen(true)}
      />
      <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </I18nProvider>
  )
}

interface ShellProps {
  site: SiteState
  report: ExperienceReport | null
  onExperience: (patch: Partial<ExperienceState>) => void
  onScan: () => void
  onClearTrail: () => void
  locale: Locale
  theme: 'dark' | 'light'
  isMac: boolean
  addressRef: RefObject<AddressBarHandle | null>
  onLocale: (next: Locale) => void
  onTheme: () => void
  onAbout: () => void
}

function Shell({
  site,
  report,
  onExperience,
  onScan,
  onClearTrail,
  locale,
  theme,
  isMac,
  addressRef,
  onLocale,
  onTheme,
  onAbout,
}: ShellProps) {
  const t = useT()
  const narrow = report?.state.active === 'zoom' && report.state.narrow
  return (
    <div className="flex h-full flex-col">
      <a className="skip-link" href="#panel">
        {t('skip.panel')}
      </a>

      <header className="flex items-center gap-3 border-b border-line bg-surface px-3 py-2">
        <div className="flex items-center gap-2 pe-1">
          <AnsyMark />
          <span className="font-display text-lg font-semibold leading-none">{t('app.name')}</span>
          <span className="hidden text-xs text-ink-soft lg:inline">{t('app.by')}</span>
        </div>
        <NavButtons site={site} />
        <AddressBar ref={addressRef} site={site} />
        <div className="flex items-center gap-1">
          <LangSwitch locale={locale} onChange={onLocale} />
          <ThemeToggle theme={theme} onToggle={onTheme} />
          <button
            type="button"
            className="btn btn-icon"
            onClick={onAbout}
            aria-label={t('toolbar.about')}
            title={t('toolbar.about')}
          >
            <Info />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <main id="site" className="relative min-w-0 flex-1" aria-label={t('site.region')}>
          <SiteFrame site={site} isMac={isMac} narrow={narrow} />
        </main>
        <aside
          id="panel"
          className="w-96 shrink-0 overflow-y-auto border-s border-line bg-surface"
          aria-labelledby="panel-title"
          tabIndex={-1}
        >
          <ExperiencePanel
            report={report}
            site={site}
            onChange={onExperience}
            onScan={onScan}
            onClearTrail={onClearTrail}
          />
        </aside>
      </div>
    </div>
  )
}
