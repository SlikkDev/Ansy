import type { Observations } from '../shared/experiences'

/**
 * The in-page helper's first job: notice what an experience asks the owner to
 * look for. It runs inside the site, in an isolated world the site's own
 * scripts cannot see, and only reads the page. Keep it self-contained: it is
 * sent to the page as source text (`observePage.toString()`), so it must not
 * reach for anything outside its own body.
 */
export function observePage(): Observations {
  const playerHosts = [
    'youtube.com',
    'youtube-nocookie.com',
    'youtu.be',
    'vimeo.com',
    'wistia.com',
    'wistia.net',
    'dailymotion.com',
    'loom.com',
    'facebook.com',
    'tiktok.com',
  ]

  const isPlayer = (src: string): boolean => {
    try {
      const host = new URL(src, location.href).hostname.replace(/^www\./, '')
      return playerHosts.some((h) => host === h || host.endsWith('.' + h))
    } catch {
      return false
    }
  }

  const hasCaptions = (media: HTMLMediaElement): boolean => {
    for (const track of Array.from(media.querySelectorAll('track'))) {
      const kind = (track.getAttribute('kind') || 'subtitles').toLowerCase()
      if (kind === 'captions' || kind === 'subtitles') return true
    }
    return false
  }

  const mediaElements = Array.from(document.querySelectorAll('video, audio')) as HTMLMediaElement[]
  let autoplay = 0
  let mediaWithoutCaptions = 0
  for (const media of mediaElements) {
    const playing = !media.paused && !media.ended && media.readyState > 2
    if (media.autoplay || playing) autoplay += 1
    if (!hasCaptions(media)) mediaWithoutCaptions += 1
  }

  let embeddedPlayers = 0
  for (const frame of Array.from(document.querySelectorAll('iframe'))) {
    const src = frame.getAttribute('src') || frame.getAttribute('data-src') || ''
    if (src && isPlayer(src)) embeddedPlayers += 1
  }

  let animations = 0
  if (typeof document.getAnimations === 'function') {
    for (const animation of document.getAnimations()) {
      if (animation.playState === 'running') animations += 1
    }
  }

  return {
    animations,
    autoplay,
    media: mediaElements.length,
    mediaWithoutCaptions,
    embeddedPlayers,
  }
}

/** The helper as source text, ready for executeJavaScriptInIsolatedWorld. */
export const observeSource = `(${observePage.toString()})()`
