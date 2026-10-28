import type { KeyboardFinding, KeyboardReport } from '../shared/keyboard'

/**
 * The keyboard-only helper. It runs inside the site, in an isolated world the
 * site's scripts cannot see, and draws its ring and trail into the page's DOM
 * (the way an extension would). It is shipped as source text, so it must stay
 * self-contained: no imports, nothing from outside its own body.
 *
 * It installs once per page and leaves an API on the isolated window:
 *   __ansyKeyboard.report() → KeyboardReport, .reset(), .uninstall()
 */
export function keyboardHelper(): KeyboardReport {
  type Api = { report(): KeyboardReport; reset(): void; uninstall(): void }
  const g = globalThis as unknown as { __ansyKeyboard?: Api }
  if (g.__ansyKeyboard) return g.__ansyKeyboard.report()

  const ACCENT = '#ff2d6b'
  const MAX_FINDINGS = 25
  const FOCUSABLE =
    'a[href], button, input, select, textarea, summary, iframe, audio[controls], video[controls], [tabindex], [contenteditable]'

  // ---- Describing elements --------------------------------------------
  const text = (s: string | null | undefined) => (s || '').replace(/\s+/g, ' ').trim()
  const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s)

  const describe = (el: Element): string => {
    const tag = el.tagName.toLowerCase()
    const name =
      text(el.getAttribute('aria-label')) ||
      text((el as HTMLImageElement).alt) ||
      text(el.getAttribute('title')) ||
      text((el as HTMLInputElement).placeholder) ||
      text(
        (el as HTMLInputElement).value && tag === 'input' ? (el as HTMLInputElement).value : '',
      ) ||
      text(el.textContent)
    const role = el.getAttribute('role')
    const what = role ? `${tag} (${role})` : tag
    return name ? `${what} “${clip(name, 40)}”` : what
  }

  const selectorFor = (el: Element): string => {
    const parts: string[] = []
    let node: Element | null = el
    while (node && node !== document.documentElement && parts.length < 5) {
      const tag = node.tagName.toLowerCase()
      if (node.id && /^[A-Za-z][\w-]*$/.test(node.id)) {
        parts.unshift(`#${node.id}`)
        break
      }
      const parent: Element | null = node.parentElement
      if (!parent) {
        parts.unshift(tag)
        break
      }
      const siblings = Array.from(parent.children).filter((c) => c.tagName === node!.tagName)
      parts.unshift(siblings.length > 1 ? `${tag}:nth-of-type(${siblings.indexOf(node) + 1})` : tag)
      node = parent
    }
    return parts.join(' > ')
  }

  const finding = (el: Element): KeyboardFinding => ({
    label: describe(el),
    target: selectorFor(el),
  })

  // ---- The overlay: a ring on the focused element, a numbered trail --------
  const overlay = document.createElement('div')
  overlay.setAttribute('data-ansy-overlay', '')
  overlay.setAttribute('aria-hidden', 'true')
  overlay.style.cssText =
    'position:fixed;inset:0;pointer-events:none;z-index:2147483647;font:600 12px/1 system-ui,sans-serif'
  const ring = document.createElement('div')
  ring.style.cssText = `position:fixed;display:none;box-sizing:border-box;border:3px solid ${ACCENT};border-radius:4px;box-shadow:0 0 0 3px #fff,0 0 0 6px ${ACCENT}66`
  overlay.appendChild(ring)
  document.documentElement.appendChild(overlay)

  const trail: { el: Element; marker: HTMLElement }[] = []
  let current: Element | null = null

  const place = () => {
    if (current && current.isConnected) {
      const r = current.getBoundingClientRect()
      ring.style.display = 'block'
      ring.style.left = `${r.left - 4}px`
      ring.style.top = `${r.top - 4}px`
      ring.style.width = `${r.width + 8}px`
      ring.style.height = `${r.height + 8}px`
    } else {
      ring.style.display = 'none'
    }
    for (const { el, marker } of trail) {
      if (!el.isConnected) {
        marker.style.display = 'none'
        continue
      }
      const r = el.getBoundingClientRect()
      marker.style.display = 'block'
      marker.style.left = `${Math.max(0, r.left - 10)}px`
      marker.style.top = `${Math.max(0, r.top - 10)}px`
    }
  }

  const addMarker = (el: Element, n: number) => {
    const marker = document.createElement('div')
    marker.textContent = String(n)
    marker.style.cssText = `position:fixed;min-width:20px;height:20px;padding:0 5px;box-sizing:border-box;border-radius:10px;background:${ACCENT};color:#fff;text-align:center;line-height:20px;box-shadow:0 0 0 2px #fff`
    overlay.appendChild(marker)
    trail.push({ el, marker })
  }

  // ---- Findings -----------------------------------------------------------
  let stops = 0
  const traps: KeyboardFinding[] = []
  const invisible: KeyboardFinding[] = []
  const seenInvisible = new Set<Element>()
  const seenTrap = new Set<Element>()

  const add = (list: KeyboardFinding[], seen: Set<Element>, el: Element) => {
    if (seen.has(el) || list.length >= MAX_FINDINGS) return
    seen.add(el)
    list.push(finding(el))
  }

  // Focus reached by key: only those stops count, and only those are judged for visibility.
  let lastKeyAt = 0
  let lastKey = ''
  const byKey = () => performance.now() - lastKeyAt < 300

  type Look = {
    outline: string
    shadow: string
    bg: string
    border: string
    color: string
    deco: string
  }
  const look = (el: Element): Look => {
    const cs = getComputedStyle(el)
    const outlineHidden =
      cs.outlineStyle === 'none' ||
      parseFloat(cs.outlineWidth) === 0 ||
      cs.outlineColor === 'transparent' ||
      /rgba\([^)]*,\s*0\)$/.test(cs.outlineColor)
    return {
      outline: outlineHidden ? 'none' : `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`,
      shadow: cs.boxShadow,
      bg: cs.backgroundColor,
      border: cs.borderColor,
      color: cs.color,
      deco: cs.textDecorationLine,
    }
  }
  const sameLook = (a: Look, b: Look) =>
    a.outline === b.outline &&
    a.shadow === b.shadow &&
    a.bg === b.bg &&
    a.border === b.border &&
    a.color === b.color &&
    a.deco === b.deco

  let focusedLook: { el: Element; look: Look } | null = null

  const onFocusIn = (event: FocusEvent) => {
    const el = event.target as Element | null
    if (!el || !(el instanceof Element) || overlay.contains(el)) return
    if (el !== current) {
      if (byKey()) {
        stops += 1
        addMarker(el, stops)
      }
      current = el
    }
    focusedLook = byKey() ? { el, look: look(el) } : null
    place()
  }

  const onFocusOut = (event: FocusEvent) => {
    const el = event.target as Element | null
    if (!el || !(el instanceof Element)) return
    const was = focusedLook
    focusedLook = null
    // Compare how it looked with focus against how it looks without, once the blur has applied.
    if (was && was.el === el) {
      setTimeout(() => {
        if (!el.isConnected) return
        const now = look(el)
        if (was.look.outline === 'none' && sameLook(was.look, now))
          add(invisible, seenInvisible, el)
      }, 0)
    }
  }

  const consumesTab = (el: Element | null) =>
    !!el &&
    (el.tagName === 'TEXTAREA' ||
      (el as HTMLElement).isContentEditable ||
      el.getAttribute('role') === 'textbox' ||
      el.tagName === 'IFRAME')

  let misses = 0
  const onKeyDown = (event: KeyboardEvent) => {
    lastKeyAt = performance.now()
    lastKey = event.key
    if (event.key !== 'Tab') return
    const before = document.activeElement
    setTimeout(() => {
      const after = document.activeElement
      if (before && after === before && before !== document.body && !consumesTab(before)) {
        misses += 1
        if (misses >= 2) add(traps, seenTrap, before)
      } else {
        misses = 0
      }
    }, 60)
  }

  // Things that react to a click but the keyboard cannot reach.
  const unreachable = (): KeyboardFinding[] => {
    const found: KeyboardFinding[] = []
    const all = document.body ? document.body.querySelectorAll('*') : []
    for (const el of Array.from(all)) {
      if (found.length >= MAX_FINDINGS) break
      if (overlay.contains(el)) continue
      if (el.matches(FOCUSABLE) || el.closest(FOCUSABLE)) continue
      const role = el.getAttribute('role')
      const clickable =
        el.hasAttribute('onclick') ||
        role === 'button' ||
        role === 'link' ||
        (getComputedStyle(el).cursor === 'pointer' &&
          !el.querySelector(FOCUSABLE) &&
          getComputedStyle(el.parentElement || el).cursor !== 'pointer')
      if (!clickable) continue
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      found.push(finding(el))
    }
    return found
  }

  let unreachableCache: { at: number; list: KeyboardFinding[] } | null = null

  document.addEventListener('focusin', onFocusIn, true)
  document.addEventListener('focusout', onFocusOut, true)
  document.addEventListener('keydown', onKeyDown, true)
  window.addEventListener('scroll', place, { capture: true, passive: true })
  window.addEventListener('resize', place)

  const api: Api = {
    report() {
      if (!unreachableCache || performance.now() - unreachableCache.at > 3000) {
        unreachableCache = { at: performance.now(), list: unreachable() }
      }
      return {
        stops,
        traps: traps.slice(),
        invisibleFocus: invisible.slice(),
        unreachable: unreachableCache.list,
      }
    },
    reset() {
      stops = 0
      traps.length = 0
      invisible.length = 0
      seenInvisible.clear()
      seenTrap.clear()
      for (const { marker } of trail) marker.remove()
      trail.length = 0
      misses = 0
      place()
    },
    uninstall() {
      document.removeEventListener('focusin', onFocusIn, true)
      document.removeEventListener('focusout', onFocusOut, true)
      document.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
      overlay.remove()
      delete g.__ansyKeyboard
    },
  }
  g.__ansyKeyboard = api
  void lastKey
  return api.report()
}

/** The helper as source text, ready for executeJavaScriptInIsolatedWorld. */
export const keyboardHelperSource = `(${keyboardHelper.toString()})()`

export const keyboardReportSource =
  'globalThis.__ansyKeyboard ? globalThis.__ansyKeyboard.report() : null'
export const keyboardResetSource =
  'globalThis.__ansyKeyboard ? globalThis.__ansyKeyboard.reset() : null'
export const keyboardUninstallSource =
  'globalThis.__ansyKeyboard ? globalThis.__ansyKeyboard.uninstall() : null'

/** Mouse off: no pointer, no hover, no clicks. Scrolling by wheel still works. */
export const MOUSE_OFF_CSS = `
html, body, * { cursor: none !important; }
body * { pointer-events: none !important; }
`
