/**
 * Voice control: the commands Ansy understands, typed or dictated into the
 * command box, and what the voice helper answers. The parsing is pure so it
 * can be tested without a page; the helper in src/main does the clicking.
 */

export type VoiceCommand =
  | { kind: 'click'; name: string }
  | { kind: 'clickNumber'; number: number }
  | { kind: 'showNumbers' }
  | { kind: 'hideNumbers' }
  | { kind: 'scroll'; direction: 'up' | 'down' }
  | { kind: 'type'; text: string }
  | { kind: 'unknown' }

export type VoiceOutcome =
  | 'clicked'
  | 'focused'
  | 'numbers'
  | 'hidden'
  | 'scrolled'
  | 'typed'
  | 'noField'
  | 'choose'
  | 'mismatch'
  | 'notFound'
  | 'unknown'
  | 'noPage'

/** A control that shows one thing and is named another: label in name, WCAG 2.5.3. */
export interface VoiceMismatch {
  /** A short description, e.g. button “Add to basket”. */
  label: string
  target: string
  /** What the control shows. */
  visible: string
  /** What it is called, which is what voice control listens for. */
  name: string
  /** The outer HTML, trimmed, for the finding. */
  html: string
}

export interface VoiceResult {
  outcome: VoiceOutcome
  /** The name of what was clicked or focused. */
  name?: string
  /** How many were numbered. */
  count?: number
  mismatch?: VoiceMismatch
}

export interface VoiceReport {
  /** Commands that missed a control because its name differs from what it shows, on this page. */
  mismatches: VoiceMismatch[]
}

export const emptyVoiceReport: VoiceReport = { mismatches: [] }

/**
 * How a spoken phrase and a control's name are compared: case, punctuation,
 * Hebrew points and spacing don't count. Dictation adds a capital and a full
 * stop; a page may write the same name with nikud or without.
 */
export function normalizeSpoken(text: string): string {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[֑-ׇ]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

const numberWords: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  אחת: 1,
  אחד: 1,
  שתיים: 2,
  שניים: 2,
  שלוש: 3,
  ארבע: 4,
  חמש: 5,
  שש: 6,
  שבע: 7,
  שמונה: 8,
  תשע: 9,
  עשר: 10,
}

const asNumber = (words: string): number | null => {
  if (/^\d{1,4}$/.test(words)) return Number(words)
  return numberWords[words] ?? null
}

/**
 * Reads one command, in English or Hebrew, whatever the interface language:
 * "click Buy now", "show numbers", "click 4" (or just "4"), "scroll down",
 * "type hello"; "לחץ על קנה עכשיו", "הצג מספרים", "גלול למטה", "הקלד שלום".
 */
export function parseVoiceCommand(raw: string): VoiceCommand {
  const original = raw.trim().replace(/[.!?。]+$/, '')
  // Typed text keeps its case and punctuation; everything else is compared loosely.
  const typed = /^(?:type|הקלד|הקלידי|כתוב|כתבי)\s+(.+)$/iu.exec(original)
  if (typed?.[1]) return { kind: 'type', text: typed[1] }

  const said = normalizeSpoken(original)
  if (!said) return { kind: 'unknown' }
  if (/^(?:show|display) numbers$/.test(said) || /^(?:הצג|הציגי|הראה|הראי) מספרים$/.test(said)) {
    return { kind: 'showNumbers' }
  }
  if (/^hide numbers$/.test(said) || /^(?:הסתר|הסתירי) מספרים$/.test(said)) {
    return { kind: 'hideNumbers' }
  }
  const scroll = /^(?:scroll (down|up)|(?:גלול|גללי) (למטה|למעלה))$/.exec(said)
  if (scroll) {
    return {
      kind: 'scroll',
      direction: scroll[1] === 'up' || scroll[2] === 'למעלה' ? 'up' : 'down',
    }
  }
  const bare = asNumber(said)
  if (bare !== null) return { kind: 'clickNumber', number: bare }
  const click =
    /^(?:click|press|tap|choose|select|לחץ|לחצי|הקש|הקישי|בחר|בחרי)(?: on| על)? (.+)$/.exec(said)
  if (click?.[1]) {
    const number = asNumber(click[1])
    return number !== null ? { kind: 'clickNumber', number } : { kind: 'click', name: click[1] }
  }
  return { kind: 'unknown' }
}

/** The name in a click command as it was typed or dictated, for quoting it back. */
export function spokenTarget(raw: string): string {
  const original = raw.trim().replace(/[.!?。]+$/, '')
  const click =
    /^(?:click|press|tap|choose|select|לחץ|לחצי|הקש|הקישי|בחר|בחרי)(?:\s+(?:on|על))?\s+(.+)$/iu.exec(
      original,
    )
  return click?.[1] ?? original
}

export function isVoiceResult(value: unknown): value is VoiceResult {
  return !!value && typeof value === 'object' && typeof (value as VoiceResult).outcome === 'string'
}
