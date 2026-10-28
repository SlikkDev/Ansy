/**
 * Address handling shared by the address bar and the main process.
 * Ansy opens web pages only: http and https. Everything else is refused.
 */

const WEB_SCHEMES = new Set(['http:', 'https:'])

/** True for an absolute http(s) URL. */
export function isWebUrl(value: string): boolean {
  try {
    return WEB_SCHEMES.has(new URL(value).protocol)
  } catch {
    return false
  }
}

const HOST_LIKE = /^[a-z0-9֐-׿؀-ۿ.-]+(:\d{1,5})?(\/.*)?$/i

/**
 * Turns what the owner typed into a URL Ansy will open, or null.
 * "example.com", "example.com/shop", "localhost:3000" and "https://example.com"
 * all work. Spaces, bare words without a dot (except localhost) and non-web
 * schemes return null, so the address bar can explain instead of guessing.
 */
export function normalizeAddress(input: string): string | null {
  const raw = input.trim()
  if (!raw || /\s/.test(raw)) return null

  // A scheme, unless the colon introduces a port ("localhost:3000").
  if (/^[a-z][a-z0-9+.-]*:(?!\d{1,5}([/?#]|$))/i.test(raw)) {
    return isWebUrl(raw) ? new URL(raw).href : null
  }

  const host = raw.split(/[/?#]/, 1)[0] ?? raw
  const hostname = host.replace(/:\d{1,5}$/, '')
  const looksLikeHost =
    HOST_LIKE.test(raw) &&
    (hostname === 'localhost' || hostname.includes('.') || /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname))
  if (!looksLikeHost) return null

  try {
    return new URL(`https://${raw}`).href
  } catch {
    return null
  }
}

/** Shortens a URL for display: no scheme, no trailing slash on the root. */
export function displayAddress(url: string): string {
  try {
    const u = new URL(url)
    const path = u.pathname === '/' && !u.search && !u.hash ? '' : u.pathname + u.search + u.hash
    return u.host + path
  } catch {
    return url
  }
}
