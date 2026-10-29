/**
 * The cognitive experiences' pure parts: the reading score for plain
 * language, and the flash counter for seizure risk. Both run in the main
 * process on what the in-page helpers and the frame stream hand them, and
 * both are deterministic, so the same page always gets the same answer.
 */

import type { KeyboardFinding } from './keyboard'

// ---------------------------------------------------------------- reading aids

/** What the reading aids found after changing the font and spacing. */
export interface ReadingReport {
  /** Text cut off by its box once the font or spacing changed (WCAG 1.4.12). */
  clipped: KeyboardFinding[]
}

export function isReadingReport(value: unknown): value is ReadingReport {
  return !!value && typeof value === 'object' && Array.isArray((value as ReadingReport).clipped)
}

// ------------------------------------------------------------- plain language

export type ReadingLevel = 'easy' | 'plain' | 'hard' | 'veryHard'

/** A block of text from the page, as the helper finds it. */
export interface TextBlock {
  text: string
  target: string
  /** A short description, e.g. p “Returns are accepted…”. */
  label: string
}

export interface PlainLanguageReport {
  /** How the score was made: a standard formula in English, a rough measure in Hebrew. */
  method: 'fleschKincaid' | 'roughHebrew'
  level: ReadingLevel
  /** Flesch-Kincaid grade, English only. */
  grade: number | null
  words: number
  sentences: number
  /** Words per sentence, one decimal. */
  sentenceLength: number
  /** Letters per word, one decimal. */
  wordLength: number
  /** The hardest blocks, hardest first, at most three. */
  hardest: (KeyboardFinding & { sentenceLength: number })[]
}

const HEBREW = /[֐-׿]/g
const LETTER = /\p{L}/u

/** The page reads as Hebrew when most of its letters are Hebrew. */
export function isHebrewText(text: string): boolean {
  const letters = text.split('').filter((c) => LETTER.test(c)).length
  return letters > 0 && (text.match(HEBREW)?.length ?? 0) / letters > 0.5
}

/** Sentences end at . ! ? and the like, or at the end of a block. Abbreviations are miscounted, as in every formula. */
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?…؟])\s+|\n+/u)
    .map((s) => s.trim())
    .filter((s) => wordsOf(s).length > 0)
}

export function wordsOf(text: string): string[] {
  return text
    .replace(/[֑-ׇ]/g, '')
    .split(/[^\p{L}\p{N}'’־-]+/u)
    .map((w) => w.replace(/^['’־-]+|['’־-]+$/g, ''))
    .filter((w) => LETTER.test(w))
}

/**
 * English syllables, by the usual rule of thumb: groups of vowels, less a
 * silent final e. Good to about one syllable in ten, which is what the
 * formula was made with.
 */
export function syllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '')
  if (!w) return 1
  if (w.length <= 3) return 1
  const trimmed = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '')
  return Math.max(1, trimmed.match(/[aeiouy]{1,2}/g)?.length ?? 1)
}

const round1 = (n: number) => Math.round(n * 10) / 10

/** Words per sentence, for ranking blocks; long words count a little extra. */
function blockDifficulty(text: string, hebrew: boolean): { score: number; sentenceLength: number } {
  const sentences = splitSentences(text)
  const words = sentences.flatMap(wordsOf)
  if (!words.length) return { score: 0, sentenceLength: 0 }
  const sentenceLength = words.length / Math.max(1, sentences.length)
  const long = words.filter((w) => w.length >= (hebrew ? 7 : 9)).length / words.length
  return { score: sentenceLength * (1 + long), sentenceLength }
}

/** Blocks under this many words say too little to rank. */
const MIN_BLOCK_WORDS = 12

/**
 * Scores the page's text. English uses the Flesch-Kincaid grade. Hebrew has
 * no accepted formula (syllables can't be counted in text without nikud), so
 * it gets a rough level from sentence and word length, and says so.
 */
export function scoreText(blocks: readonly TextBlock[]): PlainLanguageReport | null {
  const text = blocks.map((b) => b.text).join('\n')
  const hebrew = isHebrewText(text)
  const sentences = blocks.flatMap((b) => splitSentences(b.text))
  const words = sentences.flatMap(wordsOf)
  if (words.length < 20 || !sentences.length) return null

  const sentenceLength = words.length / sentences.length
  const wordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length
  let grade: number | null = null
  let level: ReadingLevel
  if (hebrew) {
    // Rough bands: the length of a sentence matters most; long words add to it.
    const points =
      (sentenceLength > 12 ? 1 : 0) +
      (sentenceLength > 18 ? 1 : 0) +
      (sentenceLength > 25 ? 1 : 0) +
      (wordLength > 4.8 ? 1 : 0) +
      (wordLength > 5.6 ? 1 : 0)
    level = points <= 1 ? 'easy' : points === 2 ? 'plain' : points === 3 ? 'hard' : 'veryHard'
  } else {
    const perWord = words.reduce((sum, w) => sum + syllables(w), 0) / words.length
    grade = round1(Math.max(0, 0.39 * sentenceLength + 11.8 * perWord - 15.59))
    // WCAG 3.1.5 asks for lower secondary school, about grade 9.
    level = grade <= 6 ? 'easy' : grade <= 9 ? 'plain' : grade <= 12 ? 'hard' : 'veryHard'
  }

  const hardest = blocks
    .filter((b) => wordsOf(b.text).length >= MIN_BLOCK_WORDS)
    .map((b) => ({ block: b, ...blockDifficulty(b.text, hebrew) }))
    .filter((b) => b.sentenceLength > (hebrew ? 15 : 20))
    .sort((a, b) => b.score - a.score || a.block.target.localeCompare(b.block.target))
    .slice(0, 3)
    .map(({ block, sentenceLength: length }) => ({
      label: block.label,
      target: block.target,
      sentenceLength: Math.round(length),
    }))

  return {
    method: hebrew ? 'roughHebrew' : 'fleschKincaid',
    level,
    grade,
    words: words.length,
    sentences: sentences.length,
    sentenceLength: round1(sentenceLength),
    wordLength: round1(wordLength),
    hardest,
  }
}

export function isTextBlocks(value: unknown): value is TextBlock[] {
  return (
    Array.isArray(value) &&
    value.every(
      (b) =>
        !!b &&
        typeof b === 'object' &&
        typeof (b as TextBlock).text === 'string' &&
        typeof (b as TextBlock).target === 'string' &&
        typeof (b as TextBlock).label === 'string',
    )
  )
}

// ------------------------------------------------------------------- flashing

/**
 * WCAG 2.3.1's general flash threshold: no more than three flashes in any
 * second, where a flash is a pair of opposing changes in relative luminance
 * of 10% or more, the darker state below 0.8, over an area larger than a
 * quarter of a 10° field of view (about 2.8% of a 1024×768 screen at a usual
 * viewing distance). Red flashes have a stricter rule Ansy doesn't check.
 */
export const FLASH_LIMIT = 3
const FLASH_DELTA = 0.1
const FLASH_DARK = 0.8
const FLASH_AREA = 0.028

/** A frame reduced to a grid of relative luminance, row by row. */
export interface LumaFrame {
  /** Milliseconds. */
  at: number
  cols: number
  rows: number
  luma: Float32Array | number[]
}

export interface FlashRegion {
  /** Fractions of the view, 0 to 1. */
  x: number
  y: number
  width: number
  height: number
}

export interface FlashReport {
  /** Frames looked at so far. */
  frames: number
  /** The most flashes counted in any one second. */
  worst: number
  /** Where the worst second's flashing was. */
  region: FlashRegion | null
  /** Where the flashing is, as an element, once Ansy has asked the page. */
  element: KeyboardFinding | null
}

export const emptyFlashReport: FlashReport = { frames: 0, worst: 0, region: null, element: null }

/** sRGB 0–255 to relative luminance, as WCAG defines it. */
export function relativeLuminance(r: number, g: number, b: number): number {
  const lin = (c: number) => {
    const s = c / 255
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

/** Averages a BGRA bitmap (as Electron hands it) down to a luminance grid. */
export function lumaGrid(
  bgra: Uint8Array,
  width: number,
  height: number,
  cols: number,
  rows: number,
): Float32Array {
  const sums = new Float32Array(cols * rows)
  const counts = new Uint32Array(cols * rows)
  // Every other pixel each way is plenty for areas this size.
  for (let y = 0; y < height; y += 2) {
    const row = Math.min(rows - 1, Math.floor((y * rows) / height))
    for (let x = 0; x < width; x += 2) {
      const col = Math.min(cols - 1, Math.floor((x * cols) / width))
      const i = (y * width + x) * 4
      sums[row * cols + col]! += relativeLuminance(bgra[i + 2]!, bgra[i + 1]!, bgra[i]!)
      counts[row * cols + col]! += 1
    }
  }
  for (let i = 0; i < sums.length; i += 1) sums[i] = counts[i] ? sums[i]! / counts[i]! : 0
  return sums
}

interface Transition {
  at: number
  /** +1 brighter, -1 darker. */
  direction: 1 | -1
  region: FlashRegion
}

/**
 * Counts flashes in a stream of frames. A transition is a frame where enough
 * of the view changed luminance the same way past the threshold; two opposing
 * transitions make a flash. Feed it frames in order; read `report`.
 */
export class FlashCounter {
  private previous: LumaFrame | null = null
  private transitions: Transition[] = []
  report: FlashReport = { ...emptyFlashReport }

  push(frame: LumaFrame): boolean {
    const before = this.report.worst
    this.report = { ...this.report, frames: this.report.frames + 1 }
    const prev = this.previous
    this.previous = frame
    if (!prev || prev.cols !== frame.cols || prev.rows !== frame.rows) return false

    const cells = frame.cols * frame.rows
    let up = 0
    let down = 0
    const box = { up: [Infinity, Infinity, -1, -1], down: [Infinity, Infinity, -1, -1] }
    for (let i = 0; i < cells; i += 1) {
      const a = prev.luma[i]!
      const b = frame.luma[i]!
      if (Math.abs(b - a) < FLASH_DELTA || Math.min(a, b) >= FLASH_DARK) continue
      const which = b > a ? 'up' : 'down'
      if (which === 'up') up += 1
      else down += 1
      const col = i % frame.cols
      const row = Math.floor(i / frame.cols)
      const r = box[which]
      r[0] = Math.min(r[0]!, col)
      r[1] = Math.min(r[1]!, row)
      r[2] = Math.max(r[2]!, col)
      r[3] = Math.max(r[3]!, row)
    }
    const direction: 1 | -1 = up >= down ? 1 : -1
    const changed = Math.max(up, down) / cells
    if (changed >= FLASH_AREA) {
      const r = box[direction === 1 ? 'up' : 'down']
      const region = {
        x: r[0]! / frame.cols,
        y: r[1]! / frame.rows,
        width: (r[2]! - r[0]! + 1) / frame.cols,
        height: (r[3]! - r[1]! + 1) / frame.rows,
      }
      const last = this.transitions[this.transitions.length - 1]
      // The same way twice in a row is one slow change, not two.
      if (!last || last.direction !== direction)
        this.transitions.push({ at: frame.at, direction, region })
    }
    // Keep one second of history, and count the pairs in it.
    this.transitions = this.transitions.filter((t) => frame.at - t.at < 1000)
    const flashes = Math.floor(this.transitions.length / 2)
    if (flashes > this.report.worst) {
      this.report = {
        ...this.report,
        worst: flashes,
        region: this.transitions[this.transitions.length - 1]!.region,
      }
    }
    return this.report.worst !== before
  }

  reset(): void {
    this.previous = null
    this.transitions = []
    this.report = { ...emptyFlashReport }
  }
}
