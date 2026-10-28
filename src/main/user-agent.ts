/**
 * The default user agent names Electron and Ansy. Sites with bot checks treat
 * unfamiliar browsers with suspicion, and the owner's site should see the same
 * Chrome their customers use, so both markers are removed.
 */
export function cleanUserAgent(userAgent: string): string {
  return userAgent
    .replace(/\s?Ansy\/\S+/i, '')
    .replace(/\s?Electron\/\S+/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}
