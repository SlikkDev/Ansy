import type { SwitchReport, TremorReport } from '../shared/motor'

/**
 * The switch access helper. It runs inside the site, in an isolated world the
 * site's scripts cannot see, and scans the page the way a single-switch user's
 * device does: a highlight rests on each control in turn, and one key (Space,
 * the switch) picks the control it is on. It is shipped as source text, so it
 * must stay self-contained: no imports, nothing from outside its own body.
 *
 * It installs once per page and leaves an API on the isolated window:
 *   __ansySwitch.report() → SwitchReport, .speed(ms), .reset(), .uninstall()
 */
export function switchHelper(interval: number): SwitchReport {
  type Api = { report(): SwitchReport; speed(ms: number): void; reset(): void; uninstall(): void }
  const g = globalThis as unknown as { __ansySwitch?: Api }
  if (g.__ansySwitch) {
    g.__ansySwitch.speed(interval)
    return g.__ansySwitch.report()
  }

  const ACCENT = '#ff2d6b'
  const MAX_SKIPPED = 25
  const FOCUSABLE =
    'a[href], button, input, select, textarea, summary, iframe, audio[controls], video[controls], [tabindex], [contenteditable]'

  const text = (s: string | null | undefined) => (s || '').replace(/\s+/g, ' ').trim()
  const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s)
  const describe = (el: Element): string => {
    const tag = el.tagName.toLowerCase()
    const name =
      text(el.getAttribute('aria-label')) ||
      text((el as HTMLImageElement).alt) ||
      text(el.getAttribute('title')) ||
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

  const overlay = document.createElement('div')
  overlay.setAttribute('data-ansy-switch', '')
  overlay.setAttribute('aria-hidden', 'true')
  overlay.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483647'
  const ring = document.createElement('div')
  ring.style.cssText = `position:fixed;display:none;box-sizing:border-box;border:4px solid ${ACCENT};border-radius:6px;background:${ACCENT}22;box-shadow:0 0 0 3px #fff`
  overlay.appendChild(ring)
  document.documentElement.appendChild(overlay)

  const visible = (el: Element) => {
    const r = el.getBoundingClientRect()
    if (!r.width || !r.height) return false
    const cs = getComputedStyle(el)
    return cs.visibility !== 'hidden' && cs.display !== 'none'
  }

  // What scanning lands on: the controls a switch device finds, in page order.
  const controls = (): Element[] =>
    Array.from(document.querySelectorAll(FOCUSABLE)).filter(
      (el) =>
        !overlay.contains(el) &&
        el.getAttribute('tabindex') !== '-1' &&
        !(el as HTMLButtonElement).disabled &&
        visible(el),
    )

  const editable = (el: Element | null) =>
    !!el &&
    ((el.tagName === 'INPUT' &&
      !['button', 'submit', 'reset', 'checkbox', 'radio', 'image', 'file'].includes(
        (el as HTMLInputElement).type,
      )) ||
      el.tagName === 'TEXTAREA' ||
      el.tagName === 'SELECT' ||
      (el as HTMLElement).isContentEditable)

  let current: Element | null = null
  let index = -1
  let steps = 0
  let picks = 0
  let stepsAtPick = 0
  let lastPickSteps: number | null = null

  const place = () => {
    if (current && current.isConnected) {
      const r = current.getBoundingClientRect()
      ring.style.display = 'block'
      ring.style.left = `${r.left - 5}px`
      ring.style.top = `${r.top - 5}px`
      ring.style.width = `${r.width + 10}px`
      ring.style.height = `${r.height + 10}px`
    } else {
      ring.style.display = 'none'
    }
  }

  const advance = () => {
    // Typing into a field: the scan waits until Escape hands control back.
    if (editable(document.activeElement)) return
    const list = controls()
    if (!list.length) {
      current = null
      place()
      return
    }
    index = (index + 1) % list.length
    current = list[index] ?? null
    steps += 1
    if (current) current.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    place()
  }

  let timer = setInterval(advance, interval)

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && editable(document.activeElement)) {
      ;(document.activeElement as HTMLElement).blur()
      return
    }
    if (event.key !== ' ' || editable(document.activeElement)) return
    event.preventDefault()
    event.stopImmediatePropagation()
    const el = current
    if (!el || !el.isConnected) return
    picks += 1
    lastPickSteps = steps - stepsAtPick
    stepsAtPick = steps
    ;(el as HTMLElement).focus()
    if (!editable(el)) (el as HTMLElement).click()
    // Like a real scanning device, the next round starts from the top.
    index = -1
  }

  const skipped = (): SwitchReport['skipped'] => {
    const found: SwitchReport['skipped'] = []
    const all = document.body ? document.body.querySelectorAll('*') : []
    for (const el of Array.from(all)) {
      if (found.length >= MAX_SKIPPED) break
      if (overlay.contains(el) || el.matches(FOCUSABLE) || el.closest(FOCUSABLE)) continue
      const role = el.getAttribute('role')
      const clickable =
        el.hasAttribute('onclick') ||
        role === 'button' ||
        role === 'link' ||
        (getComputedStyle(el).cursor === 'pointer' &&
          !el.querySelector(FOCUSABLE) &&
          getComputedStyle(el.parentElement || el).cursor !== 'pointer')
      if (clickable && visible(el)) found.push({ label: describe(el), target: selectorFor(el) })
    }
    return found
  }
  let skippedCache: { at: number; list: SwitchReport['skipped'] } | null = null

  window.addEventListener('keydown', onKeyDown, true)
  window.addEventListener('scroll', place, { capture: true, passive: true })
  window.addEventListener('resize', place)

  const api: Api = {
    report() {
      if (!skippedCache || performance.now() - skippedCache.at > 3000) {
        skippedCache = { at: performance.now(), list: skipped() }
      }
      return { steps, picks, lastPickSteps, skipped: skippedCache.list }
    },
    speed(ms) {
      clearInterval(timer)
      timer = setInterval(advance, ms)
    },
    reset() {
      steps = 0
      picks = 0
      stepsAtPick = 0
      lastPickSteps = null
      index = -1
    },
    uninstall() {
      clearInterval(timer)
      window.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
      overlay.remove()
      delete g.__ansySwitch
    },
  }
  g.__ansySwitch = api
  return api.report()
}

export const switchHelperSource = (interval: number): string =>
  `(${switchHelper.toString()})(${Math.round(interval)})`
export const switchReportSource =
  'globalThis.__ansySwitch ? globalThis.__ansySwitch.report() : null'
export const switchResetSource = 'globalThis.__ansySwitch ? globalThis.__ansySwitch.reset() : null'
export const switchUninstallSource =
  'globalThis.__ansySwitch ? globalThis.__ansySwitch.uninstall() : null'

/**
 * The tremor helper: an impression of a hand that shakes. The real pointer is
 * hidden and a shaking one is drawn instead; a click lands where the shaking
 * pointer is, which may not be what the hand meant. Same rules as above: it
 * runs in the isolated world and ships as self-contained source text.
 *
 *   __ansyTremor.report() → TremorReport, .uninstall()
 */
export function tremorHelper(): TremorReport {
  type Api = { report(): TremorReport; uninstall(): void }
  const g = globalThis as unknown as { __ansyTremor?: Api }
  if (g.__ansyTremor) return g.__ansyTremor.report()

  const AMPLITUDE = 14
  const ACTIONABLE =
    'a[href], button, input, select, textarea, summary, label, [role="button"], [role="link"], [onclick], [tabindex]'

  const pointer = document.createElement('div')
  pointer.setAttribute('data-ansy-tremor', '')
  pointer.setAttribute('aria-hidden', 'true')
  pointer.style.cssText =
    'position:fixed;left:0;top:0;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;border:2px solid #fff;background:#111;box-shadow:0 0 0 1px #111;pointer-events:none;z-index:2147483647;display:none'
  document.documentElement.appendChild(pointer)

  let x = 0
  let y = 0
  let dx = 0
  let dy = 0
  let clicks = 0
  let misses = 0

  const draw = () => {
    pointer.style.transform = `translate(${Math.round(x + dx)}px, ${Math.round(y + dy)}px)`
  }
  // A new offset a few times a second, eased toward, reads as a shake rather than noise.
  let goalX = 0
  let goalY = 0
  const shake = setInterval(() => {
    goalX = (Math.random() * 2 - 1) * AMPLITUDE
    goalY = (Math.random() * 2 - 1) * AMPLITUDE
  }, 120)
  const ease = setInterval(() => {
    dx += (goalX - dx) * 0.5
    dy += (goalY - dy) * 0.5
    draw()
  }, 30)

  const onMove = (event: MouseEvent) => {
    x = event.clientX
    y = event.clientY
    pointer.style.display = 'block'
    draw()
  }

  const actionable = (el: Element | null) => (el ? el.closest(ACTIONABLE) || el : null)

  const onClick = (event: MouseEvent) => {
    if (!event.isTrusted) return
    const meant = actionable(event.target instanceof Element ? event.target : null)
    const landed = actionable(document.elementFromPoint(x + dx, y + dy))
    clicks += 1
    if (landed === meant) return
    // The shake carried the click elsewhere: what the hand meant does not get it.
    event.preventDefault()
    event.stopImmediatePropagation()
    misses += 1
    if (landed instanceof HTMLElement) {
      landed.focus()
      landed.click()
    }
  }

  document.addEventListener('mousemove', onMove, true)
  window.addEventListener('click', onClick, true)

  const api: Api = {
    report: () => ({ clicks, misses }),
    uninstall() {
      clearInterval(shake)
      clearInterval(ease)
      document.removeEventListener('mousemove', onMove, true)
      window.removeEventListener('click', onClick, true)
      pointer.remove()
      delete g.__ansyTremor
    },
  }
  g.__ansyTremor = api
  return api.report()
}

export const tremorHelperSource = `(${tremorHelper.toString()})()`
export const tremorReportSource =
  'globalThis.__ansyTremor ? globalThis.__ansyTremor.report() : null'
export const tremorUninstallSource =
  'globalThis.__ansyTremor ? globalThis.__ansyTremor.uninstall() : null'

/** The real pointer hidden while the shaking one stands in for it. */
export const NO_CURSOR_CSS = `
html, body, * { cursor: none !important; }
`
