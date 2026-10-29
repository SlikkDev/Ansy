// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  switchHelper,
  switchHelperSource,
  switchUninstallSource,
  tremorHelper,
  tremorHelperSource,
  tremorUninstallSource,
} from '../../src/main/motor-helpers'
import { isSwitchReport, isTremorReport } from '../../src/shared/motor'

// jsdom lays nothing out, so every element gets a box for the helpers to see.
const box = { width: 40, height: 20, top: 0, left: 0, right: 40, bottom: 20, x: 0, y: 0 }

describe('switchHelper', () => {
  afterEach(() => {
    ;(0, eval)(switchUninstallSource)
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('steps through the controls and picks the one it is on with Space', () => {
    vi.useFakeTimers()
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(box as DOMRect)
    Element.prototype.scrollIntoView = () => {}
    document.body.innerHTML =
      '<a href="#a">One</a><button id="two">Two</button><div role="button" onclick="">Fake</div>'
    const clicked = vi.fn()
    document.getElementById('two')?.addEventListener('click', clicked)

    const first = switchHelper(1000)
    expect(isSwitchReport(first)).toBe(true)
    expect(document.querySelectorAll('[data-ansy-switch]')).toHaveLength(1)

    vi.advanceTimersByTime(2000)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', cancelable: true }))
    expect(clicked).toHaveBeenCalledOnce()

    const api = (globalThis as unknown as { __ansySwitch: { report(): unknown } }).__ansySwitch
    expect(api.report()).toMatchObject({ steps: 2, picks: 1, lastPickSteps: 2 })
    // A clickable div no key can reach is what scanning skips.
    expect(switchHelper(1000).skipped.map((s) => s.label)).toEqual(['div (button) “Fake”'])
  })

  it('uninstalls without a trace', () => {
    switchHelper(1000)
    ;(0, eval)(switchUninstallSource)
    expect(document.querySelector('[data-ansy-switch]')).toBeNull()
    expect('__ansySwitch' in globalThis).toBe(false)
  })

  it('ships as self-contained source text', () => {
    expect(switchHelperSource(800.4)).toMatch(/^\(function switchHelper\(/)
    expect(switchHelperSource(800.4)).toContain('(800)')
    expect(switchHelperSource(800)).not.toMatch(/\b(require|import|exports)\b/)
  })
})

describe('tremorHelper', () => {
  it('draws a stand-in pointer that takes no clicks, and counts clicks', () => {
    const report = tremorHelper()
    expect(isTremorReport(report)).toBe(true)
    const pointer = document.querySelector<HTMLElement>('[data-ansy-tremor]')
    expect(pointer?.style.pointerEvents).toBe('none')
    expect(pointer?.getAttribute('aria-hidden')).toBe('true')
    ;(0, eval)(tremorUninstallSource)
    expect(document.querySelector('[data-ansy-tremor]')).toBeNull()
    expect('__ansyTremor' in globalThis).toBe(false)
  })

  it('ships as self-contained source text', () => {
    expect(tremorHelperSource).toMatch(/^\(function tremorHelper\(/)
    expect(tremorHelperSource).not.toMatch(/\b(require|import|exports)\b/)
  })
})
