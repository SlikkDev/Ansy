// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { checkFocusable, checkFocusableSource } from '../../src/main/retest'
import { checkElementSource } from '../../src/main/scan'

describe('checkFocusable', () => {
  it('tells a clickable div from a real control', () => {
    document.body.innerHTML = `
      <div id="wish" onclick="">Add to wishlist</div>
      <div id="fixed" tabindex="0">Add to wishlist</div>
      <div id="wrapped"><button>Add to wishlist</button></div>
      <button id="off" disabled>Nope</button>
    `
    expect(checkFocusable('#wish')).toBe('unfocusable')
    expect(checkFocusable('#fixed')).toBe('focusable')
    expect(checkFocusable('#wrapped')).toBe('focusable')
    expect(checkFocusable('#off')).toBe('unfocusable')
    expect(checkFocusable('#gone')).toBe('missing')
    expect(checkFocusable('<<not a selector')).toBe('missing')
  })

  it('ships as self-contained source text, like the other helpers', () => {
    for (const source of [checkFocusableSource('#x'), checkElementSource]) {
      expect(source).not.toMatch(/\b(require|import|exports)\b/)
    }
    expect(checkFocusableSource('#x')).toContain('("#x")')
  })
})
