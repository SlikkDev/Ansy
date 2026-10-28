import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { translate } from '../../src/shared/i18n'
import {
  findNext,
  findingLabel,
  isReaderCommand,
  itemSpeech,
  linearize,
  readerFindings,
  readerRuleHolds,
  readerSpeech,
  type AXNode,
  type ReaderItem,
} from '../../src/shared/reader'
import type { Translate } from '../../src/shared/report'

/** Trees captured from the practice shop through the DevTools protocol (tests/fixtures/axtree). */
const tree = (page: string): AXNode[] =>
  JSON.parse(readFileSync(join(__dirname, '..', 'fixtures', 'axtree', `${page}.json`), 'utf8'))

const en: Translate = (key, vars) => translate('en', key, vars)
const he: Translate = (key, vars) => translate('he', key, vars)

const brief = (item: ReaderItem) =>
  `${item.role}${item.level ? item.level : ''}${item.landmark ? ':' + item.landmark : ''} ${item.name}`.trim()

describe('reading order', () => {
  it('reads the shop front the way a screen reader does', () => {
    const snapshot = linearize(tree('index'))
    expect(snapshot.title).toBe('Sample shop')
    expect(snapshot.items.map(brief)).toEqual([
      'heading1 Sample shop',
      'text A small shop built with the usual mistakes, for trying the experiences on. Nothing is sold.',
      'landmark:navigation Main',
      'link Home',
      'link Contact',
      'text Red mug: in stock · Blue mug: sold out',
      'text Free shipping this week only!',
      'text Email',
      'edit Email',
      'edit',
      'button Buy now',
      'image',
      'text Add to wishlist',
      'text Read the',
      'link terms',
      'text before you buy.',
      'text A widget that keeps Tab',
      'video Unable to play media.',
      'video Unable to play media.',
      'text Low contrast legal text that is hard to read.',
    ])
    expect(snapshot).toMatchObject({ headings: 1, links: 3, fields: 3, landmarks: 1 })
    expect(snapshot.items.every((item, i) => item.index === i)).toBe(true)
    expect(snapshot.items[8]!.node).toBeGreaterThan(0)
  })

  it('announces landmarks, lists and tables on the way in and out', () => {
    const snapshot = linearize(tree('checkout'))
    expect(snapshot.items.map(brief)).toEqual([
      'landmark:banner',
      'link Sample shop',
      'landmark:navigation Main',
      'link Home',
      'link Contact',
      'landmark:main',
      'heading1 Checkout',
      'heading3 Your order',
      'list',
      'text Red mug, 1 × 12.00',
      'text Shipping, 3.00',
      'listEnd',
      'table',
      'header Item',
      'header Price',
      'cell Red mug',
      'cell 12.00',
      'cell Total',
      'cell 15.00',
      'tableEnd',
      'image',
      'heading2 Your details',
      'text Name',
      'edit Name',
      'text Email',
      'edit Email',
      'text Card number',
      'edit',
      'text Quantity',
      'combobox Quantity',
      'button',
      'checkbox Gift wrap',
      'button Place order',
      'landmark:contentinfo',
      'text Sample shop, a practice site. Nothing is shipped and nothing is charged.',
    ])
    expect(snapshot.items[8]).toMatchObject({ role: 'list', count: 2 })
    expect(snapshot.items[12]).toMatchObject({ role: 'table', count: 3, columns: 2 })
    expect(snapshot.items[31]).toMatchObject({ role: 'checkbox', states: ['unchecked'] })
    expect(snapshot.items[23]).toMatchObject({ role: 'edit', editable: true, focusable: true })
    expect(snapshot).toMatchObject({ headings: 3, links: 3, fields: 7, landmarks: 4 })
  })

  it('reads one element on its own, for focus that landed on it', () => {
    const nodes = tree('checkout')
    const checkbox = nodes.find((n) => n.role?.value === 'checkbox')!
    expect(linearize(nodes, checkbox.nodeId).items.map(brief)).toEqual(['checkbox Gift wrap'])
    // A focusable box with only text in it still reads as a line.
    const trap = tree('index').find(
      (n) => n.properties?.some((p) => p.name === 'focusable') && n.role?.value === 'generic',
    )!
    expect(linearize(tree('index'), trap.nodeId).items.map(brief)).toEqual([
      'text A widget that keeps Tab',
    ])
  })

  it('leaves out what is hidden from assistive tech, and bullets and separators', () => {
    const nodes: AXNode[] = [
      {
        nodeId: '1',
        role: { value: 'RootWebArea' },
        name: { value: 'T' },
        childIds: ['2', '3', '6'],
      },
      {
        nodeId: '2',
        ignored: true,
        ignoredReasons: [{ name: 'ariaHiddenElement' }],
        role: { value: 'none' },
        childIds: ['4'],
      },
      { nodeId: '3', role: { value: 'StaticText' }, name: { value: ' · ' } },
      { nodeId: '4', role: { value: 'StaticText' }, name: { value: 'secret' } },
      { nodeId: '6', role: { value: 'paragraph' }, childIds: ['7', '8', '9'] },
      { nodeId: '7', role: { value: 'StaticText' }, name: { value: 'Pay ' } },
      { nodeId: '8', role: { value: 'strong' }, childIds: ['10'] },
      { nodeId: '9', role: { value: 'StaticText' }, name: { value: ' now.' } },
      { nodeId: '10', role: { value: 'StaticText' }, name: { value: 'today' } },
    ]
    expect(linearize(nodes).items.map(brief)).toEqual(['text Pay today now.'])
  })

  it('stops at the cap and says so', () => {
    const nodes: AXNode[] = [
      { nodeId: 'r', role: { value: 'RootWebArea' }, name: { value: 'Long' }, childIds: [] },
    ]
    for (let i = 0; i < 4100; i += 1) {
      nodes.push({ nodeId: `l${i}`, role: { value: 'link' }, name: { value: `Link ${i}` } })
      nodes[0]!.childIds!.push(`l${i}`)
    }
    const snapshot = linearize(nodes)
    expect(snapshot.items.length).toBe(4000)
    expect(snapshot.truncated).toBe(true)
  })
})

describe('what the reader stumbles on', () => {
  it('finds the unnamed, the skipped and the missing on the checkout page', () => {
    const snapshot = linearize(tree('checkout'))
    const found = readerFindings(snapshot)
    expect(found.map((f) => `${f.rule}@${f.index}`)).toEqual([
      'reader-heading-order@7',
      'reader-image-name@20',
      'reader-field-name@27',
      'reader-button-name@30',
    ])
    expect(findingLabel(found[0]!, en)).toBe('heading level 3 “Your order”')
    expect(findingLabel(found[3]!, en)).toBe('button (no name)')
    expect(findingLabel(found[3]!, he)).toBe('כפתור (בלי שם)')
  })

  it('reports a page with no landmarks once, as a whole', () => {
    const nodes: AXNode[] = [
      { nodeId: '1', role: { value: 'RootWebArea' }, name: { value: 'T' }, childIds: ['2'] },
      {
        nodeId: '2',
        role: { value: 'heading' },
        name: { value: 'Hi' },
        properties: [{ name: 'level', value: { value: 1 } }],
      },
    ]
    const found = readerFindings(linearize(nodes))
    expect(found).toEqual([
      { rule: 'reader-no-landmarks', index: -1, role: 'other', name: '', level: 0, element: null },
    ])
    expect(findingLabel(found[0]!, en)).toBe('The whole page')
    expect(readerFindings(linearize([]))).toEqual([])
  })

  it('knows when a finding is fixed on a later look', () => {
    const items = linearize(tree('checkout')).items
    expect(readerRuleHolds('reader-button-name', items[30]!)).toBe('failing')
    expect(readerRuleHolds('reader-button-name', items[32]!)).toBe('fixed')
    expect(readerRuleHolds('reader-field-name', items[27]!)).toBe('failing')
    expect(readerRuleHolds('reader-field-name', items[23]!)).toBe('fixed')
    expect(readerRuleHolds('reader-image-name', items[6]!)).toBe('fixed')
    expect(readerRuleHolds('reader-link-name', items[6]!)).toBe('unknown')
    expect(readerRuleHolds('reader-no-landmarks', null)).toBe('unknown')
  })
})

describe('moving', () => {
  const items = linearize(tree('checkout')).items

  it('steps, jumps by kind and by heading level, and says when there is nothing', () => {
    expect(findNext(items, -1, null, 1)).toBe(0)
    expect(findNext(items, 0, null, -1)).toBe(-1)
    expect(findNext(items, -1, 'heading', 1)).toBe(6)
    expect(findNext(items, 6, 'heading', 1)).toBe(7)
    expect(findNext(items, -1, 'heading', 1, 2)).toBe(21)
    expect(findNext(items, 21, 'heading', -1, 1)).toBe(6)
    expect(findNext(items, -1, 'field', 1)).toBe(23)
    expect(findNext(items, 23, 'field', 1)).toBe(25)
    expect(findNext(items, 29, 'field', 1)).toBe(30)
    expect(findNext(items, -1, 'edit', 1)).toBe(23)
    expect(findNext(items, -1, 'landmark', 1)).toBe(0)
    expect(findNext(items, 0, 'landmark', 1)).toBe(2)
    expect(findNext(items, -1, 'table', 1)).toBe(12)
    expect(findNext(items, -1, 'list', 1)).toBe(8)
    expect(findNext(items, -1, 'image', 1)).toBe(20)
    expect(findNext(items, 20, 'image', 1)).toBe(-1)
    expect(findNext(items, items.length - 1, null, 1)).toBe(-1)
  })

  it('checks commands from the screens', () => {
    expect(isReaderCommand({ kind: 'move', target: null, dir: 1 })).toBe(true)
    expect(isReaderCommand({ kind: 'move', target: 'heading', dir: -1, level: 3 })).toBe(true)
    expect(isReaderCommand({ kind: 'move', target: 'heading', dir: -1, level: 9 })).toBe(false)
    expect(isReaderCommand({ kind: 'move', target: 'nope', dir: 1 })).toBe(false)
    expect(isReaderCommand({ kind: 'move', target: null, dir: 2 })).toBe(false)
    expect(isReaderCommand({ kind: 'refresh' })).toBe(true)
    expect(isReaderCommand({ kind: 'fly' })).toBe(false)
    expect(isReaderCommand('move')).toBe(false)
  })
})

describe('what is said', () => {
  const items = linearize(tree('checkout')).items
  const say = (index: number, t: Translate = en) => itemSpeech(items[index]!, t)

  it('names the thing, then what it is, then its state', () => {
    expect(say(6)).toBe('Checkout, heading level 1')
    expect(say(1)).toBe('Sample shop, link')
    expect(say(0)).toBe('banner landmark')
    expect(say(2)).toBe('Main, navigation landmark')
    expect(say(8)).toBe('list with 2 items')
    expect(say(9)).toBe('Red mug, 1 × 12.00')
    expect(say(11)).toBe('out of list')
    expect(say(12)).toBe('table with 3 rows and 2 columns')
    expect(say(13)).toBe('Item, column header')
    expect(say(15)).toBe('Red mug')
    expect(say(20)).toBe('graphic')
    expect(say(23)).toBe('Name, edit, blank')
    expect(say(27)).toBe('edit, blank')
    expect(say(29)).toMatch(/^Quantity, combo box/)
    expect(say(30)).toBe('button')
    expect(say(31)).toBe('Gift wrap, check box, not checked')
    expect(say(32)).toBe('Place order, button')
  })

  it('speaks Hebrew too', () => {
    expect(say(6, he)).toBe('Checkout, כותרת רמה 1')
    expect(say(31, he)).toBe('Gift wrap, תיבת סימון, לא מסומן')
    expect(say(23, he)).toBe('Name, עריכה, ריק')
    expect(say(2, he)).toBe('Main, ציון דרך ניווט')
  })

  it('has words for every state and for roles it has none of its own for', () => {
    const base = items[31]!
    expect(
      itemSpeech({ ...base, states: ['checked', 'required', 'disabled', 'invalid'] }, en),
    ).toBe('Gift wrap, check box, checked, required, unavailable, invalid entry')
    expect(itemSpeech({ ...base, role: 'switch', states: ['checked'] }, en)).toBe(
      'Gift wrap, switch, on',
    )
    expect(itemSpeech({ ...base, role: 'other', raw: 'DescriptionList', states: [] }, en)).toBe(
      'Gift wrap, description list',
    )
    expect(
      itemSpeech(
        { ...base, role: 'edit', states: ['multiline'], value: 'Hello', description: 'Optional' },
        en,
      ),
    ).toBe('Gift wrap, edit, multi line, Hello, Optional')
  })

  it('announces pages, edges, misses and modes', () => {
    expect(
      readerSpeech(
        {
          type: 'page',
          title: 'Checkout',
          items: 35,
          headings: 3,
          links: 3,
          fields: 7,
          landmarks: 4,
          truncated: false,
        },
        en,
      ),
    ).toBe('Checkout. Page loaded. Headings: 3. Links: 3. Form fields: 7. Landmarks: 4.')
    expect(
      readerSpeech(
        {
          type: 'page',
          title: '',
          items: 4000,
          headings: 0,
          links: 0,
          fields: 0,
          landmarks: 0,
          truncated: true,
        },
        en,
      ),
    ).toBe(
      'Untitled page. Page loaded. Headings: 0. Links: 0. Form fields: 0. Landmarks: 0. The page is long; Ansy reads its first 4000 items.',
    )
    expect(readerSpeech({ type: 'edge', edge: 'bottom' }, en)).toBe('Bottom')
    expect(readerSpeech({ type: 'none', target: 'heading', dir: 1 }, en)).toBe('No next heading')
    expect(readerSpeech({ type: 'none', target: 'heading', dir: -1, level: 2 }, en)).toBe(
      'No previous heading level 2',
    )
    expect(readerSpeech({ type: 'none', target: 'field', dir: 1 }, he)).toBe(
      'אין עוד שדה טופס קדימה',
    )
    expect(readerSpeech({ type: 'mode', mode: 'focus' }, en)).toBe('Focus mode')
    expect(readerSpeech({ type: 'empty' }, en)).toBe('Nothing to read. Open a page first.')
    expect(readerSpeech({ type: 'stop' }, en)).toBe('')
  })
})
