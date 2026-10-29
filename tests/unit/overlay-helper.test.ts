// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import {
  overlayHelper,
  overlayHideSource,
  overlaySource,
  overlayUninstallSource,
} from '../../src/main/overlay-helper'

const layer = () => document.querySelector<HTMLElement>('[data-ansy-overlay]')

describe('overlayHelper', () => {
  it('paints one layer that takes no clicks and hides from assistive tech', () => {
    overlayHelper('tunnel')
    const el = layer()
    expect(el).not.toBeNull()
    expect(el?.getAttribute('aria-hidden')).toBe('true')
    expect(el?.style.pointerEvents).toBe('none')
    expect(el?.getAttribute('style')).toContain('radial-gradient')
    // A second install switches what it paints instead of adding a layer.
    overlayHelper('cataract')
    expect(document.querySelectorAll('[data-ansy-overlay]')).toHaveLength(1)
    expect(layer()?.getAttribute('style')).toContain('sepia')
  })

  it('hides for a screenshot and uninstalls without a trace', () => {
    const api = (globalThis as unknown as { __ansyOverlay: { hide(h: boolean): void } })
      .__ansyOverlay
    api.hide(true)
    expect(layer()?.style.display).toBe('none')
    api.hide(false)
    expect(layer()?.style.display).toBe('')
    ;(0, eval)(overlayUninstallSource)
    expect(layer()).toBeNull()
    expect('__ansyOverlay' in globalThis).toBe(false)
  })

  it('ships as self-contained source text', () => {
    expect(overlaySource('glare')).toMatch(/^\(function overlayHelper\(/)
    expect(overlaySource('glare')).toContain('("glare")')
    expect(overlaySource('glare')).not.toMatch(/\b(require|import|exports)\b/)
    expect(overlayHideSource(true)).toContain('hide(true)')
  })
})
