import type { VoiceCommand, VoiceMismatch, VoiceResult } from '../shared/voice'

/**
 * The voice control helper. It runs inside the site, in an isolated world the
 * site's scripts cannot see, and carries out a command the way voice control
 * on a Mac, on Windows or in Dragon does: "click" finds a control by its
 * accessible name, "show numbers" puts a number on everything clickable. It
 * is shipped as source text, so it must stay self-contained: no imports,
 * nothing from outside its own body.
 *
 * It installs once per page and leaves an API on the isolated window:
 *   __ansyVoice.run(command) → VoiceResult, .hide(hidden), .uninstall()
 */
export function voiceHelper(): boolean {
  type Api = {
    run(command: VoiceCommand): VoiceResult
    hide(hidden: boolean): void
    uninstall(): void
  }
  const g = globalThis as unknown as { __ansyVoice?: Api }
  if (g.__ansyVoice) return true

  const ACCENT = '#ff2d6b'
  const CLICKABLE =
    'a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [role="link"], [role="checkbox"], [role="radio"], [role="tab"], [role="menuitem"], [role="switch"], [onclick], [tabindex]:not([tabindex="-1"]), [contenteditable=""], [contenteditable="true"]'

  // The same comparison as normalizeSpoken in src/shared/voice.ts.
  const norm = (s: string) =>
    s
      .normalize('NFKC')
      .toLowerCase()
      .replace(/[֑-ׇ]/g, '')
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim()
  const squash = (s: string | null | undefined) => (s || '').replace(/\s+/g, ' ').trim()
  const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s)
  const has = (haystack: string, needle: string) =>
    !!needle && (haystack === needle || ` ${haystack} `.includes(` ${needle} `))

  const layer = document.createElement('div')
  layer.setAttribute('data-ansy-voice', '')
  layer.setAttribute('aria-hidden', 'true')
  layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483647'
  document.documentElement.appendChild(layer)

  const visible = (el: Element) => {
    const r = el.getBoundingClientRect()
    if (!r.width || !r.height) return false
    const cs = getComputedStyle(el)
    return cs.visibility !== 'hidden' && cs.display !== 'none'
  }

  /** The text a control shows, with the alt text of its images. */
  const shownText = (el: Element): string => {
    if (el instanceof HTMLInputElement) {
      return ['button', 'submit', 'reset'].includes(el.type) ? squash(el.value) : ''
    }
    let text = ''
    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) text += node.textContent
      else if (node instanceof HTMLImageElement) text += ` ${node.alt} `
      else if (node instanceof Element && node.getAttribute('aria-hidden') !== 'true') {
        node.childNodes.forEach(walk)
      }
    }
    walk(el)
    return squash(text)
  }

  /**
   * The accessible name, as voice control hears it: aria-labelledby, then
   * aria-label, then a field's label, then what the control shows, then its title.
   */
  const nameOf = (el: Element): string => {
    const labelledBy = squash(el.getAttribute('aria-labelledby'))
    if (labelledBy) {
      const text = labelledBy
        .split(' ')
        .map((id) => document.getElementById(id))
        .map((ref) => (ref ? shownText(ref) : ''))
        .join(' ')
      if (squash(text)) return squash(text)
    }
    const label = squash(el.getAttribute('aria-label'))
    if (label) return label
    const labels = (el as HTMLInputElement).labels
    if (labels && labels.length) {
      const text = squash(Array.from(labels, (l) => shownText(l)).join(' '))
      if (text) return text
    }
    return (
      shownText(el) ||
      squash(el.getAttribute('title')) ||
      squash(el.getAttribute('placeholder')) ||
      squash((el as HTMLImageElement).alt)
    )
  }

  /** A name set apart from what shows, so the two can disagree. */
  const namedApart = (el: Element) =>
    !!squash(el.getAttribute('aria-label')) || !!squash(el.getAttribute('aria-labelledby'))

  const editable = (el: Element | null) =>
    !!el &&
    ((el.tagName === 'INPUT' &&
      !['button', 'submit', 'reset', 'checkbox', 'radio', 'image', 'file'].includes(
        (el as HTMLInputElement).type,
      )) ||
      el.tagName === 'TEXTAREA' ||
      el.tagName === 'SELECT' ||
      (el as HTMLElement).isContentEditable)

  const describe = (el: Element) => {
    const role = el.getAttribute('role')
    const tag = el.tagName.toLowerCase()
    const what = role ? `${tag} (${role})` : tag
    const shown = shownText(el)
    return shown ? `${what} “${clip(shown, 40)}”` : what
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

  const controls = (): Element[] =>
    Array.from(document.querySelectorAll(CLICKABLE)).filter(
      (el) => !layer.contains(el) && !(el as HTMLButtonElement).disabled && visible(el),
    )

  // The numbers on screen, and what each one stands for.
  let numbered: Element[] = []
  let frame = 0

  const place = () => {
    frame = 0
    const badges = Array.from(layer.children) as HTMLElement[]
    numbered.forEach((el, i) => {
      const badge = badges[i]
      if (!badge) return
      const r = el.getBoundingClientRect()
      badge.style.display = r.width && r.height ? 'block' : 'none'
      badge.style.left = `${Math.max(0, r.left - 4)}px`
      badge.style.top = `${Math.max(0, r.top - 10)}px`
    })
  }
  const schedule = () => {
    if (numbered.length && !frame) frame = requestAnimationFrame(place)
  }

  const showNumbers = (list: Element[]) => {
    numbered = list
    layer.replaceChildren(
      ...list.map((_, i) => {
        const badge = document.createElement('div')
        badge.textContent = String(i + 1)
        badge.style.cssText = `position:fixed;min-width:16px;padding:1px 4px;border-radius:8px;background:${ACCENT};color:#fff;font:700 11px/14px system-ui,sans-serif;text-align:center;box-shadow:0 0 0 2px #fff`
        return badge
      }),
    )
    place()
  }
  const hideNumbers = () => {
    numbered = []
    layer.replaceChildren()
  }

  /** Clicks or focuses a control, after the answer goes back, so a page change can't swallow it. */
  const act = (el: Element): VoiceResult => {
    hideNumbers()
    el.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    const name = clip(nameOf(el), 60)
    ;(el as HTMLElement).focus()
    if (editable(el)) return { outcome: 'focused', name }
    setTimeout(() => (el as HTMLElement).click(), 0)
    return { outcome: 'clicked', name }
  }

  const typeInto = (text: string): VoiceResult => {
    const el = document.activeElement
    if (!editable(el) || el?.tagName === 'SELECT') return { outcome: 'noField' }
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      try {
        const start = el.selectionStart ?? el.value.length
        const end = el.selectionEnd ?? el.value.length
        el.setRangeText(text, start, end, 'end')
      } catch {
        // Email and number fields have no selection to type into; add to the end.
        el.value += text
      }
      el.dispatchEvent(
        new InputEvent('input', { bubbles: true, data: text, inputType: 'insertText' }),
      )
    } else {
      document.execCommand('insertText', false, text)
    }
    return { outcome: 'typed' }
  }

  const clickByName = (spoken: string): VoiceResult => {
    const said = norm(spoken)
    const list = controls()
    const named = list.map((el) => ({ el, name: norm(nameOf(el)) }))
    let matches = named.filter((c) => c.name === said)
    if (!matches.length) matches = named.filter((c) => has(c.name, said))
    if (matches.length === 1) return act(matches[0]!.el)
    if (matches.length > 1) {
      showNumbers(matches.map((c) => c.el))
      return { outcome: 'choose', count: matches.length }
    }
    // Nothing answers to that name. Does something show those words under another name?
    const shown = list.find((el) => namedApart(el) && has(norm(shownText(el)), said))
    if (shown) {
      const html = shown.outerHTML
      const mismatch: VoiceMismatch = {
        label: describe(shown),
        target: selectorFor(shown),
        visible: clip(shownText(shown), 80),
        name: clip(nameOf(shown), 80),
        html: html.length > 300 ? html.slice(0, 299) + '…' : html,
      }
      return { outcome: 'mismatch', mismatch }
    }
    return { outcome: 'notFound' }
  }

  window.addEventListener('scroll', schedule, { capture: true, passive: true })
  window.addEventListener('resize', schedule)

  const api: Api = {
    run(command) {
      switch (command.kind) {
        case 'showNumbers': {
          const list = controls()
          showNumbers(list)
          return { outcome: 'numbers', count: list.length }
        }
        case 'hideNumbers':
          hideNumbers()
          return { outcome: 'hidden' }
        case 'scroll':
          window.scrollBy({ top: (command.direction === 'up' ? -0.8 : 0.8) * innerHeight })
          return { outcome: 'scrolled' }
        case 'type':
          return typeInto(command.text)
        case 'clickNumber': {
          const el = numbered[command.number - 1]
          return el && el.isConnected ? act(el) : { outcome: 'notFound' }
        }
        case 'click':
          return clickByName(command.name)
        default:
          return { outcome: 'unknown' }
      }
    },
    hide(hidden) {
      layer.style.display = hidden ? 'none' : ''
    },
    uninstall() {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule, true)
      window.removeEventListener('resize', schedule)
      layer.remove()
      delete g.__ansyVoice
    },
  }
  g.__ansyVoice = api
  return true
}

export const voiceHelperSource = `(${voiceHelper.toString()})()`

/** Runs a command, installing the helper first if the page has none yet. */
export const voiceRunSource = (command: VoiceCommand): string =>
  `(${voiceHelper.toString()})(), globalThis.__ansyVoice.run(${JSON.stringify(command)})`

export const voiceHideSource = (hidden: boolean): string =>
  `globalThis.__ansyVoice ? globalThis.__ansyVoice.hide(${hidden}) : null`

export const voiceUninstallSource =
  'globalThis.__ansyVoice ? globalThis.__ansyVoice.uninstall() : null'
