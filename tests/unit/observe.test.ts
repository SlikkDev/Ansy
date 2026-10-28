// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { observePage, observeSource } from '../../src/main/observe'

describe('observePage', () => {
  it('counts media, missing captions, autoplay and embedded players', () => {
    document.body.innerHTML = `
      <video autoplay muted></video>
      <video><track kind="captions" srclang="en"></video>
      <audio><track kind="subtitles"></audio>
      <audio></audio>
      <iframe src="https://www.youtube-nocookie.com/embed/abc" title="Promo"></iframe>
      <iframe src="https://player.vimeo.com/video/1" title="Tour"></iframe>
      <iframe src="https://maps.example.com/embed" title="Map"></iframe>
      <iframe data-src="https://www.youtube.com/embed/lazy" title="Lazy"></iframe>
    `
    expect(observePage()).toEqual({
      animations: 0,
      autoplay: 1,
      media: 4,
      mediaWithoutCaptions: 2,
      embeddedPlayers: 3,
    })
  })

  it('reports an empty page as calm', () => {
    document.body.innerHTML = '<p>Hello</p>'
    expect(observePage()).toEqual({
      animations: 0,
      autoplay: 0,
      media: 0,
      mediaWithoutCaptions: 0,
      embeddedPlayers: 0,
    })
  })

  it('ships as self-contained source text', () => {
    expect(observeSource.startsWith('(function observePage()')).toBe(true)
    // Nothing from outside the function body: the page has no module scope to resolve against.
    expect(observeSource).not.toMatch(/\b(require|import|exports)\b/)
  })
})
