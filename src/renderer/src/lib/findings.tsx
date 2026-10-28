import { createContext, useContext, type ReactNode } from 'react'
import type { FindingElement, FindingKind, FindingRule, Severity } from '../../../shared/findings'
import type { TaskId } from '../../../shared/tasks'

/** What a "Save as finding" button knows; the dialog asks the owner for the rest. */
export interface CaptureStart {
  kind: FindingKind
  severity?: Severity
  rule?: FindingRule | null
  element?: FindingElement | null
}

export interface Capture {
  /** The guided task under way, offered as the finding's default. */
  task: TaskId | null
  /** A site is open, so there is something to save a finding about. */
  enabled: boolean
  /** Photographs the site and opens the dialog. */
  start: (what: CaptureStart) => void
}

const CaptureContext = createContext<Capture | null>(null)

/** Lets any card deep in the panel start a finding without threading callbacks through every level. */
export function CaptureProvider({ value, children }: { value: Capture; children: ReactNode }) {
  return <CaptureContext.Provider value={value}>{children}</CaptureContext.Provider>
}

export function useCapture(): Capture {
  const value = useContext(CaptureContext)
  if (!value) throw new Error('useCapture needs a CaptureProvider')
  return value
}
