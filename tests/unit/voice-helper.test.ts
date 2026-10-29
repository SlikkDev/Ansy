// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { voiceHelper, voiceRunSource, voiceUninstallSource } from '../../src/main/voice-helper'
import type { VoiceCommand, VoiceResult } from '../../src/shared/voice'

// jsdom lays nothing out, so every element gets a box for the helper to see.
const box = { width: 40, height: 20, top: 0, left: 0, right: 40, bottom: 20, x: 0, y: 0 }
const run = (command: VoiceCommand): VoiceResult =>
  (globalThis as unknown as { __ansyVoice: { run(c: VoiceCommand): VoiceResult } }).__ansyVoice.run(
    command,
  )

describe('voiceHelper', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(box as DOMRect)
    Element.prototype.scrollIntoView = () => {}
    document.body.innerHTML = `
      <button id="buy">Buy now</button>
      <button id="basket" aria-label="Purchase item">Add to basket</button>
      <a href="#a">Read more</a><a href="#b">Read more</a>
      <label>Email <input id="email" type="email" /></label>`
    voiceHelper()
  })
  afterEach(() => {
    ;(0, eval)(voiceUninstallSource)
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('clicks a control by the name it shows', () => {
    const clicked = vi.fn()
    document.getElementById('buy')?.addEventListener('click', clicked)
    expect(run({ kind: 'click', name: 'buy now' })).toEqual({ outcome: 'clicked', name: 'Buy now' })
    vi.runAllTimers()
    expect(clicked).toHaveBeenCalledOnce()
  })

  it('misses a control named apart from what it shows, and says what it is called', () => {
    const result = run({ kind: 'click', name: 'add to basket' })
    expect(result.outcome).toBe('mismatch')
    expect(result.mismatch).toMatchObject({
      target: '#basket',
      visible: 'Add to basket',
      name: 'Purchase item',
    })
    expect(run({ kind: 'click', name: 'purchase item' }).outcome).toBe('clicked')
  })

  it('numbers controls that share a name, and clicks by number', () => {
    expect(run({ kind: 'click', name: 'read more' })).toEqual({ outcome: 'choose', count: 2 })
    expect(document.querySelectorAll('[data-ansy-voice] > div')).toHaveLength(2)
    expect(run({ kind: 'clickNumber', number: 2 })).toMatchObject({ outcome: 'clicked' })
    expect(document.querySelectorAll('[data-ansy-voice] > div')).toHaveLength(0)
  })

  it('numbers everything clickable on request', () => {
    expect(run({ kind: 'showNumbers' })).toEqual({ outcome: 'numbers', count: 5 })
    expect(run({ kind: 'hideNumbers' })).toEqual({ outcome: 'hidden' })
    expect(run({ kind: 'clickNumber', number: 1 })).toEqual({ outcome: 'notFound' })
  })

  it('focuses a field by its label and types into it', () => {
    expect(run({ kind: 'type', text: 'x' })).toEqual({ outcome: 'noField' })
    expect(run({ kind: 'click', name: 'email' })).toEqual({ outcome: 'focused', name: 'Email' })
    expect(run({ kind: 'type', text: 'dana@example.com' })).toEqual({ outcome: 'typed' })
    expect((document.getElementById('email') as HTMLInputElement).value).toBe('dana@example.com')
  })

  it('says when nothing answers', () => {
    expect(run({ kind: 'click', name: 'checkout' })).toEqual({ outcome: 'notFound' })
  })

  it('ships as self-contained source text', () => {
    const source = voiceRunSource({ kind: 'click', name: 'buy now' })
    expect(source).toMatch(/^\(function voiceHelper\(/)
    expect(source).toContain('{"kind":"click","name":"buy now"}')
    expect(source).not.toMatch(/\b(require|import|exports)\b/)
  })
})
