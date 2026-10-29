// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import {
  ringsHelper,
  ringsSource,
  ringsUninstallSource,
  textBlocks,
  textBlocksSource,
} from '../../src/main/reading-helper'

describe('textBlocks', () => {
  it('takes the innermost blocks of running text, once each', () => {
    document.body.innerHTML = '<p id="a">One two three.</p><ul><li><p>Four five.</p></li></ul>'
    // jsdom lays nothing out, so each element needs a box to count as shown.
    HTMLElement.prototype.getClientRects = () => [{}] as unknown as DOMRectList
    Object.defineProperty(HTMLElement.prototype, 'innerText', {
      configurable: true,
      get(this: HTMLElement) {
        return this.textContent
      },
    })
    expect(textBlocks()).toEqual([
      { text: 'One two three.', target: '#a', label: 'p “One two three.”' },
      { text: 'Four five.', target: 'body > ul > li > p', label: 'p “Four five.”' },
    ])
    expect(textBlocksSource).not.toMatch(/\b(require|import|exports)\b/)
  })
})

describe('ringsHelper', () => {
  it('rings what it is given, replaces the rings when called again, and uninstalls', () => {
    document.body.innerHTML = '<p id="a">A</p><p id="b">B</p>'
    expect(ringsHelper(['#a', '#b', '#missing'])).toBe(2)
    expect(document.querySelectorAll('[data-ansy-rings] > div')).toHaveLength(2)
    expect(ringsHelper(['#b'])).toBe(1)
    expect(document.querySelectorAll('[data-ansy-rings]')).toHaveLength(1)
    expect(document.querySelector('[data-ansy-rings]')?.getAttribute('aria-hidden')).toBe('true')
    ;(0, eval)(ringsUninstallSource)
    expect(document.querySelector('[data-ansy-rings]')).toBeNull()
    expect(ringsSource(['#a'])).toContain('(["#a"])')
  })
})
