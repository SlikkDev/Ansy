/** What the keyboard-only helper reports from inside the page. */

export interface KeyboardFinding {
  /** A short description of the element, e.g. `button “Buy now”`. */
  label: string
  /** A CSS selector that reaches it again. */
  target: string
}

export interface KeyboardReport {
  /** Focus stops so far: how many times focus moved to a new element by keyboard. */
  stops: number
  /** Elements where Tab stopped moving focus. */
  traps: KeyboardFinding[]
  /** Elements that showed no sign of focus when they had it. */
  invisibleFocus: KeyboardFinding[]
  /** Things that react to a click but the keyboard cannot reach. */
  unreachable: KeyboardFinding[]
}

export const emptyKeyboardReport: KeyboardReport = {
  stops: 0,
  traps: [],
  invisibleFocus: [],
  unreachable: [],
}

export function isKeyboardReport(value: unknown): value is KeyboardReport {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.stops === 'number' &&
    ['traps', 'invisibleFocus', 'unreachable'].every((k) => Array.isArray(v[k]))
  )
}
