import axeSource from 'axe-core/axe.min.js?raw'
import heLocale from 'axe-core/locales/he.json?raw'
import type { WebContents } from 'electron'
import type { Locale } from '../shared/i18n'
import type { RawAxeResult } from '../shared/scan'

/**
 * The automatic scan. axe-core is inlined at build time and run inside the
 * site, in the helper's isolated world, so the site's own scripts never see it
 * and nothing is fetched. What comes back is trimmed inside the page, then
 * mapped to WCAG in src/shared/scan.ts.
 */

/** axe's own translations for the languages Ansy speaks. English is its default. */
const axeLocales: Partial<Record<Locale, string>> = { he: heLocale }

/** Elements kept per rule. A template bug can fail on hundreds; the first few show the pattern. */
const MAX_NODES = 30

export interface RawScan {
  violations: RawAxeResult[]
  incomplete: RawAxeResult[]
  /** How many rules passed outright. */
  passes: number
}

/**
 * Runs inside the page, where `axe` is already loaded. Shipped as source text
 * (`scanPage.toString()`), so it must not reach for anything outside its body.
 */
export function scanPage(localeJson: string | null, maxNodes: number): Promise<RawScan> {
  type AxeNode = { target: unknown[]; html: string; failureSummary?: string }
  type AxeResult = {
    id: string
    impact: string | null
    help: string
    description: string
    helpUrl: string
    tags: string[]
    nodes: AxeNode[]
  }
  type Axe = {
    configure(spec: { locale: unknown }): void
    reset(): void
    run(
      context: Document,
      options: Record<string, unknown>,
    ): Promise<{ violations: AxeResult[]; incomplete: AxeResult[]; passes: AxeResult[] }>
  }
  const axe = (globalThis as unknown as { axe?: Axe }).axe
  if (!axe) return Promise.reject(new Error('axe is not loaded'))

  // A ring left by "Show on page" must not be scanned.
  for (const old of Array.from(document.querySelectorAll('[data-ansy-highlight]'))) old.remove()

  // The language sticks to the page's axe, so English has to reset it.
  try {
    if (localeJson) axe.configure({ locale: JSON.parse(localeJson) })
    else axe.reset()
  } catch {
    axe.reset()
  }

  // Shadow DOM targets come as nested arrays: host, then the part inside it.
  const selector = (target: unknown[]): string[] =>
    target.map((part) => (Array.isArray(part) ? part.join(' ') : String(part)))
  const trim = (result: AxeResult): RawAxeResult => ({
    id: result.id,
    impact: result.impact,
    help: result.help,
    description: result.description,
    helpUrl: result.helpUrl,
    tags: result.tags,
    nodeCount: result.nodes.length,
    nodes: result.nodes.slice(0, maxNodes).map((node) => ({
      target: selector(node.target),
      html: node.html.length > 300 ? node.html.slice(0, 299) + '…' : node.html,
      ...(node.failureSummary ? { failureSummary: node.failureSummary } : {}),
    })),
  })

  return axe
    .run(document, {
      iframes: false,
      resultTypes: ['violations', 'incomplete'],
      elementRef: false,
    })
    .then((results) => ({
      violations: results.violations.map(trim),
      incomplete: results.incomplete.map(trim),
      passes: results.passes.length,
    }))
}

/** The in-page half as source text, for the self-containment test. */
export const scanPageSource = scanPage.toString()

/**
 * Loads axe into the world if the page does not have it yet, then scans. One
 * script per call: given several, Electron hands back the first one's result.
 */
export async function runAxe(
  contents: WebContents,
  world: number,
  locale: Locale,
): Promise<RawScan> {
  const run = (code: string) => contents.executeJavaScriptInIsolatedWorld(world, [{ code }])
  const loaded = (await run('typeof axe === "object"')) as boolean
  if (!loaded) await run(axeSource)
  const call = `(${scanPageSource})(${JSON.stringify(axeLocales[locale] ?? null)}, ${MAX_NODES})`
  return (await run(call)) as RawScan
}

export function isRawScan(value: unknown): value is RawScan {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return Array.isArray(v.violations) && Array.isArray(v.incomplete) && typeof v.passes === 'number'
}
