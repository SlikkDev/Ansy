import { describe, expect, it } from 'vitest'
import { cleanUserAgent } from '../../src/main/user-agent'

describe('cleanUserAgent', () => {
  it('removes the Ansy and Electron markers and nothing else', () => {
    const ua =
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ansy/0.1.0 Chrome/156.0.0.0 Electron/45.1.0 Safari/537.36'
    expect(cleanUserAgent(ua)).toBe(
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36',
    )
  })
})
