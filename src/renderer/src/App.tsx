import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import {
  sanitizeExperiencePatch,
  type ExperienceReport,
  type ExperienceState,
} from '../../shared/experiences'
import type { Finding } from '../../shared/findings'
import { resolveLocale, type Locale } from '../../shared/i18n'
import { emptySiteState, type InitialState, type Settings, type SiteState } from '../../shared/ipc'
import type { TaskId } from '../../shared/tasks'
import { AboutDialog } from './components/AboutDialog'
import { AddressBar, type AddressBarHandle } from './components/AddressBar'
import { CaptureDialog, type CaptureDraft } from './components/CaptureDialog'
import { AnsyMark, Info } from './components/Icons'
import { ExperiencePanel } from './components/ExperiencePanel'
import { FindingsTab } from './components/FindingsTab'
import { NavButtons } from './components/NavButtons'
import { Panel, type PanelTab } from './components/Panel'
import { SiteFrame } from './components/SiteFrame'
import { TasksTab } from './components/TasksTab'
import { LangSwitch, ThemeToggle } from './components/Toggles'
import { ansy } from './lib/ansy'
import { CaptureProvider, type Capture, type CaptureStart } from './lib/findings'
import { applyLocale, I18nProvider, useT } from './lib/i18n'
import { ReaderProvider } from './lib/reader'
import { applyTheme, followSystemTheme, resolveTheme } from './lib/theme'

export function App({ initial }: { initial: InitialState }) {
  const [settings, setSettings] = useState<Settings>(initial.settings)
  const [locale, setLocale] = useState<Locale>(initial.locale)
  const [theme, setTheme] = useState(() => resolveTheme(initial.settings.theme))
  const [site, setSite] = useState<SiteState>(emptySiteState)
  const [report, setReport] = useState<ExperienceReport | null>(null)
  const [findings, setFindings] = useState<Finding[]>([])
  const [task, setTask] = useState<TaskId | null>(null)
  const [tab, setTab] = useState<PanelTab>('experiences')
  const [draft, setDraft] = useState<CaptureDraft | null>(null)
  const [aboutOpen, setAboutOpen] = useState(false)
  const addressRef = useRef<AddressBarHandle>(null)
  const captures = useRef(0)
  const isMac = initial.platform === 'darwin'

  useEffect(() => {
    void ansy.site.getState().then((state) => state && setSite(state))
    return ansy.site.onState(setSite)
  }, [])

  useEffect(() => {
    void ansy.experiences.get().then((current) => current && setReport(current))
    return ansy.experiences.onReport(setReport)
  }, [])

  useEffect(() => {
    void ansy.findings.list().then(setFindings)
    return ansy.findings.onChange(setFindings)
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

  /** From the tasks tab: turn the experience on and go where it shows. */
  const tryExperience = useCallback(
    (patch: Partial<ExperienceState>) => {
      changeExperience(patch)
      setTab('experiences')
    },
    [changeExperience],
  )

  const scanAgain = useCallback(() => {
    void ansy.experiences.scan().then((next) => next && setReport(next))
  }, [])

  const clearTrail = useCallback(() => void ansy.experiences.resetKeyboard(), [])

  const siteOpen = site.open && !site.error
  const startCapture = useCallback((start: CaptureStart) => {
    captures.current += 1
    const seq = captures.current
    // The picture is taken before the dialog covers the site.
    void ansy.findings.snapshot(start.element?.target ?? null).then((preview) => {
      if (captures.current === seq) setDraft({ seq, start, preview })
    })
  }, [])
  const capture = useMemo<Capture>(
    () => ({ task, enabled: siteOpen, start: startCapture }),
    [task, siteOpen, startCapture],
  )

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

  const setSlikkLink = useCallback((slikkLink: boolean) => {
    setSettings((current) => ({ ...current, slikkLink }))
    void ansy.settings.set({ slikkLink }).then(setSettings)
  }, [])

  return (
    <I18nProvider locale={locale}>
      <CaptureProvider value={capture}>
        <ReaderProvider report={report} locale={locale}>
          <Shell
            site={site}
            report={report}
            platform={initial.platform}
            findings={findings}
            task={task}
            tab={tab}
            slikkLink={settings.slikkLink}
            onTab={setTab}
            onTask={setTask}
            onExperience={changeExperience}
            onTryExperience={tryExperience}
            onScan={scanAgain}
            onClearTrail={clearTrail}
            onSlikkLink={setSlikkLink}
            locale={locale}
            theme={theme}
            isMac={isMac}
            addressRef={addressRef}
            onLocale={changeLocale}
            onTheme={toggleTheme}
            onAbout={() => setAboutOpen(true)}
          />
          <CaptureDialog
            draft={draft}
            site={site}
            task={task}
            experience={report?.state.active ?? null}
            onClose={() => setDraft(null)}
            onSaved={() => setTab('findings')}
          />
          <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
        </ReaderProvider>
      </CaptureProvider>
    </I18nProvider>
  )
}

interface ShellProps {
  site: SiteState
  report: ExperienceReport | null
  platform: string
  findings: Finding[]
  task: TaskId | null
  tab: PanelTab
  slikkLink: boolean
  onTab: (tab: PanelTab) => void
  onTask: (task: TaskId | null) => void
  onExperience: (patch: Partial<ExperienceState>) => void
  onTryExperience: (patch: Partial<ExperienceState>) => void
  onScan: () => void
  onClearTrail: () => void
  onSlikkLink: (on: boolean) => void
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
  platform,
  findings,
  task,
  tab,
  slikkLink,
  onTab,
  onTask,
  onExperience,
  onTryExperience,
  onScan,
  onClearTrail,
  onSlikkLink,
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
          aria-label={t('panel.region')}
          tabIndex={-1}
        >
          <Panel tab={tab} onTab={onTab} findingsCount={findings.length}>
            {{
              experiences: (
                <ExperiencePanel
                  report={report}
                  site={site}
                  platform={platform}
                  onChange={onExperience}
                  onScan={onScan}
                  onClearTrail={onClearTrail}
                />
              ),
              tasks: <TasksTab task={task} onTask={onTask} onExperience={onTryExperience} />,
              findings: (
                <FindingsTab
                  findings={findings}
                  site={site}
                  slikkLink={slikkLink}
                  onSlikkLink={onSlikkLink}
                />
              ),
            }}
          </Panel>
        </aside>
      </div>
    </div>
  )
}
