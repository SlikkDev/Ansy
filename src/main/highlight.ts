/**
 * "Show on page": scrolls the site to an element and rings it for a few
 * seconds. Runs in the helper's world and is shipped as source text, so it
 * stays self-contained.
 */
export function highlightElement(selector: string): boolean {
  const ATTR = 'data-ansy-highlight'
  for (const old of Array.from(document.querySelectorAll(`[${ATTR}]`))) old.remove()

  let element: Element | null = null
  try {
    element = document.querySelector(selector)
  } catch {
    return false
  }
  if (!element) return false

  element.scrollIntoView({ block: 'center', inline: 'nearest' })
  const rect = element.getBoundingClientRect()
  const pad = 4
  const box = document.createElement('div')
  box.setAttribute(ATTR, '')
  box.setAttribute('aria-hidden', 'true')
  box.style.cssText = [
    'position:absolute',
    `left:${rect.left + window.scrollX - pad}px`,
    `top:${rect.top + window.scrollY - pad}px`,
    `width:${Math.max(rect.width, 8) + pad * 2}px`,
    `height:${Math.max(rect.height, 8) + pad * 2}px`,
    'box-sizing:border-box',
    'border:3px solid #ff2d6b',
    'border-radius:4px',
    'box-shadow:0 0 0 3px #fff, 0 0 0 6px rgba(255,45,107,0.4), 0 0 0 100vmax rgba(0,0,0,0.25)',
    'pointer-events:none',
    'z-index:2147483646',
  ].join(';')
  document.documentElement.appendChild(box)
  setTimeout(() => box.remove(), 4000)
  return true
}

/** The helper as source text, with the selector baked in. */
export const highlightSource = (selector: string): string =>
  `(${highlightElement.toString()})(${JSON.stringify(selector)})`
