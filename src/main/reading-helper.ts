import type { TextBlock } from '../shared/cognitive'
import type { KeyboardFinding } from '../shared/keyboard'

/**
 * The cognitive experiences' in-page helpers. Like the others they run in the
 * isolated world and ship as self-contained source text: no imports, nothing
 * from outside their own bodies, which is why the small describe and selector
 * functions are repeated in each.
 */

/** Text cut off by its own box: hidden overflow, or an ellipsis, with more text than fits. */
export function clippedText(): KeyboardFinding[] {
  const MAX = 25
  const squash = (s: string | null | undefined) => (s || '').replace(/\s+/g, ' ').trim()
  const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s)
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
  const found: KeyboardFinding[] = []
  const all = document.body ? document.body.querySelectorAll('*') : []
  for (const el of Array.from(all)) {
    if (found.length >= MAX) break
    if (!(el instanceof HTMLElement) || el.closest('[data-ansy-overlay],[data-ansy-rings]'))
      continue
    const ownText = Array.from(el.childNodes).some(
      (n) => n.nodeType === Node.TEXT_NODE && squash(n.textContent).length > 0,
    )
    if (!ownText) continue
    const cs = getComputedStyle(el)
    if (cs.display === 'none' || cs.visibility === 'hidden' || !el.clientWidth) continue
    const hides = (v: string) => v === 'hidden' || v === 'clip'
    const cutY = hides(cs.overflowY) && el.scrollHeight > el.clientHeight + 2
    const cutX =
      (hides(cs.overflowX) || cs.textOverflow === 'ellipsis') && el.scrollWidth > el.clientWidth + 2
    if (cutY || cutX) {
      found.push({
        label: `${el.tagName.toLowerCase()} “${clip(squash(el.textContent), 40)}”`,
        target: selectorFor(el),
      })
    }
  }
  return found
}

export const clippedTextSource = `(${clippedText.toString()})()`

/** The page's running text, block by block, for the reading score. */
export function textBlocks(): TextBlock[] {
  const MAX = 400
  const squash = (s: string | null | undefined) => (s || '').replace(/\s+/g, ' ').trim()
  const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s)
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
  const BLOCKS = 'p, li, dd, td, blockquote, figcaption'
  const blocks: TextBlock[] = []
  for (const el of Array.from(document.querySelectorAll<HTMLElement>(BLOCKS))) {
    if (blocks.length >= MAX) break
    // The innermost block only, so no text counts twice.
    if (el.querySelector(BLOCKS)) continue
    if (!el.getClientRects().length || getComputedStyle(el).visibility === 'hidden') continue
    const text = squash(el.innerText)
    if (text.length < 2) continue
    blocks.push({
      text,
      target: selectorFor(el),
      label: `${el.tagName.toLowerCase()} “${clip(text, 40)}”`,
    })
  }
  return blocks
}

export const textBlocksSource = `(${textBlocks.toString()})()`

/**
 * Rings elements with a dashed outline that takes no clicks, and keeps the
 * rings on them as the page scrolls. Called again, it replaces the rings.
 *   __ansyRings.hide(hidden), .uninstall()
 */
export function ringsHelper(targets: string[]): number {
  type Api = { set(targets: string[]): number; hide(hidden: boolean): void; uninstall(): void }
  const g = globalThis as unknown as { __ansyRings?: Api }
  if (g.__ansyRings) return g.__ansyRings.set(targets)

  const layer = document.createElement('div')
  layer.setAttribute('data-ansy-rings', '')
  layer.setAttribute('aria-hidden', 'true')
  layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483646'
  document.documentElement.appendChild(layer)

  let elements: Element[] = []
  let frame = 0
  const place = () => {
    frame = 0
    const rings = Array.from(layer.children) as HTMLElement[]
    elements.forEach((el, i) => {
      const ring = rings[i]
      if (!ring) return
      const r = el.getBoundingClientRect()
      ring.style.display = r.width && r.height ? 'block' : 'none'
      ring.style.left = `${r.left - 6}px`
      ring.style.top = `${r.top - 6}px`
      ring.style.width = `${r.width + 12}px`
      ring.style.height = `${r.height + 12}px`
    })
  }
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(place)
  }
  const api: Api = {
    set(next) {
      elements = next
        .map((t) => {
          try {
            return document.querySelector(t)
          } catch {
            return null
          }
        })
        .filter((el): el is Element => !!el)
      layer.replaceChildren(
        ...elements.map((_, i) => {
          const ring = document.createElement('div')
          ring.style.cssText =
            'position:fixed;box-sizing:border-box;border:3px dashed #ff2d6b;border-radius:6px'
          const tag = document.createElement('span')
          tag.textContent = String(i + 1)
          tag.style.cssText =
            'position:absolute;top:-11px;inset-inline-start:-11px;min-width:18px;padding:0 4px;border-radius:9px;background:#ff2d6b;color:#fff;font:700 12px/18px system-ui,sans-serif;text-align:center'
          ring.appendChild(tag)
          return ring
        }),
      )
      place()
      return elements.length
    },
    hide(hidden) {
      layer.style.display = hidden ? 'none' : ''
    },
    uninstall() {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule, true)
      window.removeEventListener('resize', schedule)
      layer.remove()
      delete g.__ansyRings
    },
  }
  window.addEventListener('scroll', schedule, { capture: true, passive: true })
  window.addEventListener('resize', schedule)
  g.__ansyRings = api
  return api.set(targets)
}

export const ringsSource = (targets: string[]): string =>
  `(${ringsHelper.toString()})(${JSON.stringify(targets)})`
export const ringsHideSource = (hidden: boolean): string =>
  `globalThis.__ansyRings ? globalThis.__ansyRings.hide(${hidden}) : null`
export const ringsUninstallSource =
  'globalThis.__ansyRings ? globalThis.__ansyRings.uninstall() : null'

/** The text the owner selected in the site, for reading aloud. */
export const selectionSource =
  'String(getSelection() || "").replace(/\\s+/g, " ").trim().slice(0, 5000)'

/** The element at a point of the view, given as fractions, for naming where something flashes. */
export function elementAt(x: number, y: number): KeyboardFinding | null {
  const squash = (s: string | null | undefined) => (s || '').replace(/\s+/g, ' ').trim()
  const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s)
  const el = document.elementFromPoint(x * innerWidth, y * innerHeight)
  if (!el || el === document.documentElement || el === document.body) return null
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
  const text = squash(el.getAttribute('aria-label') || el.textContent)
  const tag = el.tagName.toLowerCase()
  return { label: text ? `${tag} “${clip(text, 40)}”` : tag, target: parts.join(' > ') }
}

export const elementAtSource = (x: number, y: number): string =>
  `(${elementAt.toString()})(${x}, ${y})`

/**
 * A readable font everywhere text is, the way a reader's own setting or a
 * dyslexia extension sets it. Icon fonts are left alone where they say so.
 */
export const READABLE_FONT_CSS = `
body, body *:not(i):not([class*="icon"]):not([aria-hidden="true"]) {
  font-family: Verdana, "Atkinson Hyperlegible", "Segoe UI", Arial, "Noto Sans Hebrew", sans-serif !important;
}
`
