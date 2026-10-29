/**
 * Replayed re-tests: the keys pressed on a page, kept with the keyboard and
 * reader findings made on it, so "Check again" can press them again on the
 * reopened page and see for itself. Only keys that move around a page are
 * kept, never typed text: Tab, Enter, Space, Escape, the arrows, Home, End,
 * the page keys, and Ansy Reader's own letters, which never reach the page.
 */

import type { ReaderCommand, ReaderTarget } from './reader'

export interface KeyStep {
  /** The key's DOM code, which is the same on every keyboard layout: Tab, ArrowDown, KeyH. */
  code: string
  shift?: true
  ctrl?: true
}

/** A walk longer than this is too long to replay in a re-test; the owner judges it. */
export const MAX_STEPS = 150

/** Keys that move around a page, kept whatever is on. */
const navigationKeys: Record<string, string> = {
  Tab: 'Tab',
  Enter: 'Enter',
  NumpadEnter: 'Enter',
  Space: 'Space',
  Escape: 'Escape',
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
  Home: 'Home',
  End: 'End',
  PageUp: 'PageUp',
  PageDown: 'PageDown',
}

/** Ansy Reader's quick keys: a letter for each kind of item, and a digit for each heading level. */
export const readerTargetKeys: Record<string, ReaderTarget> = {
  KeyH: 'heading',
  KeyK: 'link',
  KeyB: 'button',
  KeyF: 'field',
  KeyE: 'edit',
  KeyL: 'list',
  KeyG: 'image',
  KeyD: 'landmark',
  KeyT: 'table',
}

const readerKey = (code: string) => code in readerTargetKeys || /^Digit[1-6]$/.test(code)

/** The key Electron's sendInputEvent wants for a DOM code. Null for one Ansy doesn't replay. */
export function keyCodeFor(code: string): string | null {
  if (navigationKeys[code]) return navigationKeys[code]!
  if (/^Key[A-Z]$/.test(code)) return code.slice(3).toLowerCase()
  if (/^Digit\d$/.test(code)) return code.slice(5)
  return null
}

export interface KeyPress {
  code: string
  shift: boolean
  control: boolean
  meta: boolean
}

/**
 * The step to keep for a key pressed in the site, or null to keep nothing.
 * Letters and digits are kept only when the reader took them, so nothing the
 * owner types into a field is ever written down.
 */
export function stepFor(input: KeyPress, takenByReader: boolean): KeyStep | null {
  const known = !!navigationKeys[input.code] || (takenByReader && readerKey(input.code))
  if (!known) return null
  const step: KeyStep = { code: input.code === 'NumpadEnter' ? 'Enter' : input.code }
  if (input.shift) step.shift = true
  if (input.control || input.meta) step.ctrl = true
  return step
}

/** A move made with the reader card's buttons, as the key that does the same. */
export function stepForReaderCommand(command: ReaderCommand): KeyStep | null {
  switch (command.kind) {
    case 'first':
      return { code: 'Home', ctrl: true }
    case 'last':
      return { code: 'End', ctrl: true }
    case 'activate':
      return { code: 'Enter' }
    case 'move': {
      const back = command.dir === -1 ? ({ shift: true } as const) : {}
      if (command.target === null) return { code: command.dir === 1 ? 'ArrowDown' : 'ArrowUp' }
      if (command.target === 'heading' && command.level) {
        return { code: `Digit${command.level}`, ...back }
      }
      const code = Object.keys(readerTargetKeys).find((k) => readerTargetKeys[k] === command.target)
      return code ? { code, ...back } : null
    }
    default:
      return null
  }
}

/** Keeps only steps Ansy can replay. Null when there is nothing usable or too much. */
export function sanitizeSteps(raw: unknown): KeyStep[] | null {
  if (!Array.isArray(raw) || raw.length > MAX_STEPS) return null
  const steps: KeyStep[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') return null
    const r = item as Record<string, unknown>
    if (typeof r.code !== 'string' || !keyCodeFor(r.code)) return null
    const step: KeyStep = { code: r.code }
    if (r.shift === true) step.shift = true
    if (r.ctrl === true) step.ctrl = true
    steps.push(step)
  }
  return steps
}

const keyNames: Record<string, string> = {
  Escape: 'Esc',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  PageUp: 'Page Up',
  PageDown: 'Page Down',
}

/** How a step is written for a person: Shift+Tab, Ctrl+Home, H. */
export function keyLabel(step: KeyStep): string {
  const name =
    keyNames[step.code] ??
    (/^Key[A-Z]$/.test(step.code)
      ? step.code.slice(3)
      : /^Digit\d$/.test(step.code)
        ? step.code.slice(5)
        : step.code)
  return `${step.ctrl ? 'Ctrl+' : ''}${step.shift ? 'Shift+' : ''}${name}`
}

/** The steps written short, the same key in a row counted once: "Tab ×9, Enter". */
export function stepsSummary(steps: readonly KeyStep[]): string {
  const runs: { label: string; count: number }[] = []
  for (const step of steps) {
    const label = keyLabel(step)
    const last = runs[runs.length - 1]
    if (last && last.label === label) last.count += 1
    else runs.push({ label, count: 1 })
  }
  return runs.map((r) => (r.count > 1 ? `${r.label} ×${r.count}` : r.label)).join(', ')
}

/** The keys to remember from a page's walk: null when the walk ran too long to replay. */
export class KeyTrail {
  private url = ''
  private steps: KeyStep[] = []
  private overflow = false

  /** A new page: its walk starts over. */
  start(url: string): void {
    this.url = url
    this.steps = []
    this.overflow = false
  }

  push(step: KeyStep | null): void {
    if (!step || this.overflow) return
    if (this.steps.length >= MAX_STEPS) {
      this.overflow = true
      this.steps = []
      return
    }
    this.steps.push(step)
  }

  /** The walk on this page so far, if it is the page the walk was on. */
  for(url: string): KeyStep[] | null {
    if (this.overflow || withoutHash(url) !== withoutHash(this.url)) return null
    return this.steps.slice()
  }
}

const withoutHash = (url: string) => url.split('#')[0] ?? url
