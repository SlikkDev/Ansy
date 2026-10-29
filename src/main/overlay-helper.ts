import type { OverlayKind } from '../shared/experiences'

/**
 * The overlay helper paints an impression over the site: a narrowed field of
 * view that follows the mouse and the keyboard focus, a veil over the whole
 * page, or a reading ruler that follows the line being read. It runs inside the site, in an isolated world the site's scripts cannot
 * see, draws one element that takes no clicks, and changes nothing else. It is
 * shipped as source text, so it must stay self-contained: no imports, nothing
 * from outside its own body.
 *
 * It installs once per page and leaves an API on the isolated window:
 *   __ansyOverlay.set(kind), .hide(hidden), .uninstall()
 */
export function overlayHelper(kind: OverlayKind): OverlayKind {
  type Api = { set(kind: OverlayKind): void; hide(hidden: boolean): void; uninstall(): void }
  const g = globalThis as unknown as { __ansyOverlay?: Api }
  if (g.__ansyOverlay) {
    g.__ansyOverlay.set(kind)
    return kind
  }

  const layer = document.createElement('div')
  layer.setAttribute('aria-hidden', 'true')
  layer.setAttribute('data-ansy-overlay', '')
  const base = 'position:fixed;inset:0;pointer-events:none;z-index:2147483646;margin:0;'
  document.documentElement.appendChild(layer)

  let current = kind
  let x = innerWidth / 2
  let y = innerHeight / 2
  let frame = 0

  // The clear (or lost) circle scales with the window, like a share of the field of view.
  const radius = () => Math.max(60, Math.round(Math.min(innerWidth, innerHeight) * 0.13))

  const paint = () => {
    frame = 0
    const r = radius()
    const at = `circle at ${Math.round(x)}px ${Math.round(y)}px`
    let style = ''
    if (current === 'tunnel') {
      style = `background:radial-gradient(${at},transparent 0,transparent ${r}px,rgba(0,0,0,.97) ${Math.round(r * 1.7)}px);`
    } else if (current === 'central') {
      style = `background:radial-gradient(${at},rgba(96,96,96,.97) 0,rgba(96,96,96,.9) ${r}px,transparent ${Math.round(r * 1.8)}px);`
    } else if (current === 'ruler') {
      // A reading ruler: a clear band two lines high, the rest of the page dimmed.
      const top = Math.round(y - 24)
      const bottom = Math.round(y + 24)
      style = `background:linear-gradient(to bottom,rgba(0,0,0,.55) 0,rgba(0,0,0,.55) ${top}px,transparent ${top}px,transparent ${bottom}px,rgba(0,0,0,.55) ${bottom}px);`
    } else if (current === 'cataract') {
      style =
        'background:rgba(255,244,214,.22);-webkit-backdrop-filter:blur(2px) contrast(.65) brightness(1.08) sepia(.35);backdrop-filter:blur(2px) contrast(.65) brightness(1.08) sepia(.35);'
    } else {
      style =
        'background:radial-gradient(circle at 72% 18%,rgba(255,255,255,.8),rgba(255,255,255,.3) 45%,rgba(255,255,255,.14));-webkit-backdrop-filter:brightness(1.4) contrast(.55) saturate(.7);backdrop-filter:brightness(1.4) contrast(.55) saturate(.7);'
    }
    const display = layer.hasAttribute('data-hidden') ? 'display:none;' : ''
    layer.setAttribute('style', base + style + display)
  }

  const follows = () => current === 'tunnel' || current === 'central' || current === 'ruler'
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(paint)
  }

  const onMove = (event: MouseEvent) => {
    if (!follows()) return
    x = event.clientX
    y = event.clientY
    schedule()
  }

  // Keyboard users move the eye with focus, so the field follows it too.
  const onFocus = (event: FocusEvent) => {
    if (!follows() || !(event.target instanceof Element)) return
    const box = event.target.getBoundingClientRect()
    if (!box.width && !box.height) return
    x = box.left + box.width / 2
    y = box.top + box.height / 2
    schedule()
  }

  document.addEventListener('mousemove', onMove, true)
  document.addEventListener('focusin', onFocus, true)
  window.addEventListener('resize', schedule)

  const api: Api = {
    set(next) {
      current = next
      paint()
    },
    hide(hidden) {
      if (hidden) layer.setAttribute('data-hidden', '')
      else layer.removeAttribute('data-hidden')
      paint()
    },
    uninstall() {
      if (frame) cancelAnimationFrame(frame)
      document.removeEventListener('mousemove', onMove, true)
      document.removeEventListener('focusin', onFocus, true)
      window.removeEventListener('resize', schedule)
      layer.remove()
      delete g.__ansyOverlay
    },
  }
  g.__ansyOverlay = api
  paint()
  return kind
}

/** Installs the helper, or switches what it paints, as source text. */
export const overlaySource = (kind: OverlayKind): string =>
  `(${overlayHelper.toString()})(${JSON.stringify(kind)})`

/** Hides the overlay for a moment (a screenshot) or brings it back. */
export const overlayHideSource = (hidden: boolean): string =>
  `globalThis.__ansyOverlay ? globalThis.__ansyOverlay.hide(${hidden}) : null`

export const overlayUninstallSource =
  'globalThis.__ansyOverlay ? globalThis.__ansyOverlay.uninstall() : null'
