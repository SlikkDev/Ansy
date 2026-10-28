// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { keyboardHelper, keyboardHelperSource, MOUSE_OFF_CSS } from '../../src/main/keyboard-helper'
import type { KeyboardReport } from '../../src/shared/keyboard'

type Api = { report(): KeyboardReport; reset(): void; uninstall(): void }
const api = () => (globalThis as unknown as { __ansyKeyboard?: Api }).__ansyKeyboard
const overlay = () => document.querySelector('[data-ansy-overlay]')

/** A Tab press, as the page sees it. jsdom does not move focus for it, so tests do. */
const tab = () =>
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const el = (id: string) => document.getElementById(id) as HTMLElement

beforeEach(() => {
  document.head.innerHTML =
    '<style>.quiet { outline-style: none } .visible { outline-style: solid; outline-width: 2px; outline-color: red }</style>'
  document.body.innerHTML = `
    <a id="home" href="#">Home</a>
    <a id="quiet" class="quiet" href="#">Terms</a>
    <a id="loud" class="visible" href="#">Privacy</a>
    <button id="buy">Buy now</button>
    <div id="wish" onclick="void 0">Add to wishlist</div>
    <span id="fake" role="button">Fake</span>
    <div id="trap" tabindex="0">Trap</div>
    <textarea id="notes"></textarea>
  `
  // jsdom lays nothing out; give every element a size so nothing is skipped as invisible.
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    width: 40,
    height: 20,
    top: 0,
    left: 0,
    right: 40,
    bottom: 20,
    toJSON: () => ({}),
  } as DOMRect)
  keyboardHelper()
})

afterEach(() => {
  api()?.uninstall()
  vi.restoreAllMocks()
})

describe('keyboardHelper', () => {
  it('installs once and draws its overlay', () => {
    expect(overlay()).not.toBeNull()
    keyboardHelper()
    expect(document.querySelectorAll('[data-ansy-overlay]')).toHaveLength(1)
  })

  it('counts a stop only when a key moved the focus', async () => {
    tab()
    el('home').focus()
    expect(api()!.report().stops).toBe(1)
    // A click: no key in the last moment, no stop, no marker.
    await wait(320)
    el('buy').focus()
    expect(api()!.report().stops).toBe(1)
    expect(overlay()!.children).toHaveLength(2) // the ring and one numbered marker
    tab()
    el('quiet').focus()
    expect(api()!.report().stops).toBe(2)
  })

  it('notices where Tab stops moving focus, but not where it types', async () => {
    tab()
    el('trap').focus()
    await wait(80)
    tab()
    await wait(80)
    expect(api()!.report().traps).toEqual([])
    tab()
    await wait(80)
    expect(api()!.report().traps).toEqual([{ label: 'div “Trap”', target: '#trap' }])

    tab()
    el('notes').focus()
    await wait(80)
    tab()
    await wait(80)
    tab()
    await wait(80)
    expect(api()!.report().traps).toHaveLength(1)
  })

  it('notices focus that looks no different from no focus', async () => {
    tab()
    el('quiet').focus()
    tab()
    el('loud').focus()
    await wait(10)
    tab()
    el('buy').focus()
    await wait(10)
    expect(api()!.report().invisibleFocus).toEqual([{ label: 'a “Terms”', target: '#quiet' }])
  })

  it('lists what reacts to a click but cannot take focus', () => {
    expect(api()!.report().unreachable).toEqual([
      { label: 'div “Add to wishlist”', target: '#wish' },
      { label: 'span (button) “Fake”', target: '#fake' },
    ])
  })

  it('clears the trail and uninstalls cleanly', () => {
    tab()
    el('home').focus()
    expect(api()!.report().stops).toBe(1)
    api()!.reset()
    expect(api()!.report().stops).toBe(0)
    expect(overlay()!.children).toHaveLength(1)
    api()!.uninstall()
    expect(overlay()).toBeNull()
    expect(api()).toBeUndefined()
    tab()
    el('home').focus()
    expect(document.querySelector('[data-ansy-overlay]')).toBeNull()
  })

  it('ships as self-contained source text', () => {
    expect(keyboardHelperSource.startsWith('(function keyboardHelper()')).toBe(true)
    expect(keyboardHelperSource).not.toMatch(/\b(require|import|exports)\b/)
    expect(MOUSE_OFF_CSS).toContain('pointer-events: none')
  })
})
