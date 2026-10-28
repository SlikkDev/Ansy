import type { Finding, RetestOutcome } from '../shared/findings'
import { isAvailableExperience } from '../shared/experiences'
import type { SiteView } from './site-view'

/** How long after the page loads before it is checked, so the experience is back on it. */
const SETTLE = 1000

/**
 * "Check again": opens the finding's page with the experience it was made in,
 * then asks the engine whether the problem is still there. What Ansy cannot
 * decide comes back unknown, and the owner, looking at the reopened page, says.
 */
export async function retestFinding(site: SiteView, finding: Finding): Promise<RetestOutcome> {
  // A reader finding needs the reader to look again, whatever was on when it was saved.
  const active =
    finding.kind === 'reader'
      ? 'reader'
      : finding.experience && isAvailableExperience(finding.experience)
        ? finding.experience
        : null
  await site.experiences.set({ active })
  const loaded = await site.loadAndWait(finding.url)
  if (!loaded) return 'unknown'
  await new Promise((resolve) => setTimeout(resolve, SETTLE))
  return site.experiences.checkFinding(finding)
}

/**
 * Runs inside the page: can the keyboard reach this element now? Shipped as
 * source text, so it must stay self-contained.
 */
export function checkFocusable(selector: string): 'focusable' | 'unfocusable' | 'missing' {
  let element: Element | null = null
  try {
    element = document.querySelector(selector)
  } catch {
    return 'missing'
  }
  if (!element) return 'missing'
  const html = element as HTMLElement & { disabled?: boolean }
  if (html.tabIndex >= 0 && !html.disabled) return 'focusable'
  // A real control put inside it counts too.
  if (element.querySelector('a[href], button, input, select, textarea, [tabindex]')) {
    return 'focusable'
  }
  return 'unfocusable'
}

export const checkFocusableSource = (selector: string): string =>
  `(${checkFocusable.toString()})(${JSON.stringify(selector)})`
