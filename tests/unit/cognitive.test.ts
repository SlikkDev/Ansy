import { describe, expect, it } from 'vitest'
import {
  FlashCounter,
  isHebrewText,
  lumaGrid,
  relativeLuminance,
  scoreText,
  splitSentences,
  syllables,
  wordsOf,
  type TextBlock,
} from '../../src/shared/cognitive'

const block = (text: string, n: number): TextBlock => ({
  text,
  target: `p:nth-of-type(${n})`,
  label: `p “${text.slice(0, 10)}”`,
})

describe('the reading score', () => {
  it('counts words, sentences and syllables the usual way', () => {
    expect(splitSentences('One two. Three four! Five?')).toEqual([
      'One two.',
      'Three four!',
      'Five?',
    ])
    expect(wordsOf('Don’t stop – it’s 3 o’clock.')).toEqual(['Don’t', 'stop', 'it’s', 'o’clock'])
    expect(syllables('cat')).toBe(1)
    expect(syllables('table')).toBe(2)
    expect(syllables('information')).toBe(4)
    expect(isHebrewText('שלום עולם hello')).toBe(true)
    expect(isHebrewText('hello עולם')).toBe(false)
  })

  it('gives short, common English an easy grade and rings nothing', () => {
    const score = scoreText([
      block('We sell mugs. They are red or blue. Each one costs twelve. We ship them fast.', 1),
      block('You can send a mug back. Tell us within a month. We pay you back.', 2),
    ])
    expect(score).toMatchObject({ method: 'fleschKincaid', level: 'easy', hardest: [] })
    expect(score?.grade).toBeLessThan(6)
  })

  it('gives long legal English a high grade and rings the hardest paragraph first', () => {
    const legal =
      'Notwithstanding any provision to the contrary contained herein, the purchaser acknowledges that merchandise returned subsequent to the expiration of the applicable consideration period shall be ineligible for reimbursement, exchange or any alternative remedy whatsoever.'
    const score = scoreText([
      block('We sell mugs. They are red or blue. Each one costs twelve dollars today.', 1),
      block(legal, 2),
    ])
    expect(score?.level).toBe('veryHard')
    expect(score?.hardest.map((h) => h.target)).toEqual(['p:nth-of-type(2)'])
    // The same text scores the same, every time.
    expect(scoreText([block(legal, 2)])).toEqual(scoreText([block(legal, 2)]))
  })

  it('gives Hebrew a rough level from length alone, and says so', () => {
    const score = scoreText([
      block('אנחנו מוכרים ספלים. הם אדומים או כחולים. כל אחד עולה שנים עשר שקלים.', 1),
      block('אפשר להחזיר ספל. ספרו לנו בתוך חודש. נחזיר לכם את הכסף מהר.', 2),
    ])
    expect(score).toMatchObject({ method: 'roughHebrew', grade: null, level: 'easy' })
  })

  it('does not score a page with almost no text', () => {
    expect(scoreText([block('Buy now.', 1)])).toBeNull()
  })
})

describe('the flash counter', () => {
  const frame = (at: number, value: number, cells = 100) => ({
    at,
    cols: 10,
    rows: 10,
    luma: Array.from({ length: 100 }, (_, i) => (i < cells ? value : 0.5)),
  })

  it('counts a large area going dark and light four times a second as four flashes', () => {
    const counter = new FlashCounter()
    for (let i = 0; i <= 8; i += 1) counter.push(frame(i * 125, i % 2 ? 0.05 : 0.9, 20))
    expect(counter.report.worst).toBe(4)
    expect(counter.report.region).toMatchObject({ x: 0, y: 0, width: 1, height: 0.2 })
  })

  it('ignores slow changes, small areas and changes too faint to count', () => {
    const slow = new FlashCounter()
    for (let i = 0; i <= 8; i += 1) slow.push(frame(i * 600, i % 2 ? 0.05 : 0.9, 20))
    expect(slow.report.worst).toBe(1)
    const small = new FlashCounter()
    for (let i = 0; i <= 8; i += 1) small.push(frame(i * 125, i % 2 ? 0.05 : 0.9, 2))
    expect(small.report.worst).toBe(0)
    const faint = new FlashCounter()
    for (let i = 0; i <= 8; i += 1) faint.push(frame(i * 125, i % 2 ? 0.45 : 0.5, 50))
    expect(faint.report.worst).toBe(0)
  })

  it('reduces a bitmap to luminance per cell', () => {
    expect(relativeLuminance(255, 255, 255)).toBeCloseTo(1)
    expect(relativeLuminance(0, 0, 0)).toBe(0)
    // 4×2 pixels, BGRA: the left half white, the right half black.
    const px = (v: number) => [v, v, v, 255]
    const bitmap = Uint8Array.from([
      ...px(255),
      ...px(255),
      ...px(0),
      ...px(0),
      ...px(255),
      ...px(255),
      ...px(0),
      ...px(0),
    ])
    expect(Array.from(lumaGrid(bitmap, 4, 2, 2, 1)).map((v) => Math.round(v))).toEqual([1, 0])
  })
})
