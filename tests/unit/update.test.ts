import { describe, expect, it } from 'vitest'
import { translate, type MessageKey, type Vars } from '../../src/shared/i18n'
import { describeUpdate } from '../../src/shared/update'

const en = (key: MessageKey, vars?: Vars) => translate('en', key, vars)
const he = (key: MessageKey, vars?: Vars) => translate('he', key, vars)

describe('describeUpdate', () => {
  it('says nothing while idle', () => {
    expect(describeUpdate({ phase: 'idle' }, en)).toBe('')
  })

  it('names the version wherever there is one', () => {
    expect(describeUpdate({ phase: 'none', version: '1.0.0' }, en)).toBe(
      'Ansy 1.0.0 is up to date.',
    )
    expect(describeUpdate({ phase: 'downloading', version: '1.1.0', percent: 42 }, en)).toBe(
      'Downloading Ansy 1.1.0… 42%',
    )
    expect(describeUpdate({ phase: 'ready', version: '1.1.0' }, en)).toBe(
      'Ansy 1.1.0 is ready. Restart to update.',
    )
  })

  it('explains a build that cannot update itself, and a failed check', () => {
    expect(describeUpdate({ phase: 'unsupported' }, en)).toBe(
      'This build is updated by the store or package it came from.',
    )
    expect(describeUpdate({ phase: 'checking' }, en)).toBe('Checking…')
    expect(describeUpdate({ phase: 'error' }, en)).toMatch(/Could not check/)
  })

  it('speaks Hebrew, with the name pointed', () => {
    expect(describeUpdate({ phase: 'ready', version: '1.1.0' }, he)).toBe(
      'אָנְסִי 1.1.0 מוכן. הפעילו מחדש כדי לעדכן.',
    )
    expect(describeUpdate({ phase: 'none', version: '1.0.0' }, he)).toContain('אָנְסִי 1.0.0')
  })
})
