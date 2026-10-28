/**
 * A CSS selector that finds an element again. Runs inside the site, so it is
 * shipped as source text and must stay self-contained. The keyboard helper
 * carries the same algorithm inside its own body.
 */
export function selectorFor(target: Node): string {
  const el = target.nodeType === 1 ? (target as Element) : target.parentElement
  if (!el) return ''
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

/** For Runtime.callFunctionOn, where `this` is the node. */
export const selectorFunction = `function () { return (${selectorFor.toString()})(this) }`
