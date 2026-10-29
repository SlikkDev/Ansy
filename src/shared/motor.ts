/** What the switch access and tremor helpers report from inside the page. */

import type { KeyboardFinding } from './keyboard'

/** How long switch scanning rests on each control before it moves on, by speed. */
export const switchSpeeds = ['slow', 'normal', 'fast'] as const
export type SwitchSpeed = (typeof switchSpeeds)[number]

export const switchInterval: Record<SwitchSpeed, number> = {
  slow: 2000,
  normal: 1300,
  fast: 800,
}

export interface SwitchReport {
  /** Moves the highlight made, on this page and the ones before since counting began. */
  steps: number
  /** Controls picked with the switch. */
  picks: number
  /** How many moves the last pick waited for, or null before the first one. */
  lastPickSteps: number | null
  /** Things that react to a click but scanning never lands on. */
  skipped: KeyboardFinding[]
}

export const emptySwitchReport: SwitchReport = {
  steps: 0,
  picks: 0,
  lastPickSteps: null,
  skipped: [],
}

export function isSwitchReport(value: unknown): value is SwitchReport {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.steps === 'number' &&
    typeof v.picks === 'number' &&
    (v.lastPickSteps === null || typeof v.lastPickSteps === 'number') &&
    Array.isArray(v.skipped)
  )
}

export interface TremorReport {
  /** Clicks made while the tremor was on. */
  clicks: number
  /** Of those, the ones the shake carried onto something else than the pointer was on. */
  misses: number
}

export const emptyTremorReport: TremorReport = { clicks: 0, misses: 0 }

export function isTremorReport(value: unknown): value is TremorReport {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return typeof v.clicks === 'number' && typeof v.misses === 'number'
}
