/**
 * The only addresses Ansy opens in the system browser. Everything the owner
 * types goes to the site view instead, so this list stays short and fixed.
 */
export const ALLOWED_EXTERNAL = {
  slikk: 'https://slikk.dev/',
  website: 'https://slikkdev.github.io/Ansy/',
  github: 'https://github.com/SlikkDev/Ansy',
} as const

export function isAllowedExternal(url: string): boolean {
  return Object.values(ALLOWED_EXTERNAL).some(
    (allowed) =>
      url === allowed ||
      url.startsWith(`${allowed}/`) ||
      url.startsWith(`${allowed}#`) ||
      url.startsWith(`${allowed}?`),
  )
}
