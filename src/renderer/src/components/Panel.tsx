import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { useI18n, useT } from '../lib/i18n'

export type PanelTab = 'experiences' | 'tasks' | 'findings'

export const panelTabs: readonly PanelTab[] = ['experiences', 'tasks', 'findings']

/**
 * The side panel's three tabs. Every panel stays mounted, so an open card or a
 * half-written selection survives a look at another tab; only one is shown.
 * Arrow keys move between tabs and select as they go, Home and End jump.
 */
export function Panel({
  tab,
  onTab,
  findingsCount,
  children,
}: {
  tab: PanelTab
  onTab: (tab: PanelTab) => void
  findingsCount: number
  children: Record<PanelTab, ReactNode>
}) {
  const t = useT()
  const { dir } = useI18n()
  const base = useId()
  const buttons = useRef<Partial<Record<PanelTab, HTMLButtonElement | null>>>({})

  const select = (next: PanelTab) => {
    onTab(next)
    buttons.current[next]?.focus()
  }
  const onKeyDown = (event: KeyboardEvent, current: PanelTab) => {
    const forward = dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
    const back = dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft'
    const index = panelTabs.indexOf(current)
    const last = panelTabs.length - 1
    let next: PanelTab | undefined
    if (event.key === forward) next = panelTabs[index === last ? 0 : index + 1]
    else if (event.key === back) next = panelTabs[index === 0 ? last : index - 1]
    else if (event.key === 'Home') next = panelTabs[0]
    else if (event.key === 'End') next = panelTabs[last]
    if (!next) return
    event.preventDefault()
    select(next)
  }

  return (
    <>
      <div role="tablist" aria-label={t('panel.region')} className="tabs">
        {panelTabs.map((id) => (
          <button
            key={id}
            ref={(element) => {
              buttons.current[id] = element
            }}
            type="button"
            role="tab"
            id={`${base}-tab-${id}`}
            className="tab"
            aria-selected={tab === id}
            aria-controls={`${base}-panel-${id}`}
            tabIndex={tab === id ? 0 : -1}
            onClick={() => onTab(id)}
            onKeyDown={(event) => onKeyDown(event, id)}
          >
            {t(`tabs.${id}`)}
            {id === 'findings' && findingsCount > 0 && (
              <span className="badge">{findingsCount}</span>
            )}
          </button>
        ))}
      </div>
      {panelTabs.map((id) => (
        <div
          key={id}
          role="tabpanel"
          id={`${base}-panel-${id}`}
          aria-labelledby={`${base}-tab-${id}`}
          hidden={tab !== id}
        >
          {children[id]}
        </div>
      ))}
    </>
  )
}
