import { describe, expect, it } from 'vitest'
import {
  defaultExperienceState,
  experiences,
  sanitizeExperiencePatch,
  switchesFor,
  TEXT_SPACING_CSS,
  type ExperienceState,
} from '../../src/shared/experiences'
import { en } from '../../src/shared/i18n/en'

const on = (patch: Partial<ExperienceState>): ExperienceState => ({
  ...defaultExperienceState,
  ...patch,
})

describe('switchesFor', () => {
  it('turns everything off when no experience runs', () => {
    expect(switchesFor(defaultExperienceState)).toEqual({
      visionDeficiency: 'none',
      mediaFeatures: [],
      fontSize: 16,
      textSpacingCss: false,
      zoomFactor: 1,
      narrow: false,
      muted: false,
      observe: null,
    })
  })

  it('maps colour blindness and blur to the vision-deficiency emulation', () => {
    expect(
      switchesFor(on({ active: 'colorBlindness', vision: 'tritanopia' })).visionDeficiency,
    ).toBe('tritanopia')
    expect(
      switchesFor(on({ active: 'blurLowContrast', blur: 'reducedContrast' })).visionDeficiency,
    ).toBe('reducedContrast')
  })

  it('zooms, or narrows instead of zooming', () => {
    expect(switchesFor(on({ active: 'zoom', zoom: 4 }))).toMatchObject({
      zoomFactor: 4,
      narrow: false,
    })
    expect(switchesFor(on({ active: 'zoom', zoom: 4, narrow: true }))).toMatchObject({
      zoomFactor: 1,
      narrow: true,
    })
  })

  it('doubles the font size and injects the spacing override', () => {
    expect(switchesFor(on({ active: 'largeText' }))).toMatchObject({
      fontSize: 32,
      textSpacingCss: true,
    })
    expect(
      switchesFor(on({ active: 'largeText', textSize: false, textSpacing: false })),
    ).toMatchObject({
      fontSize: 16,
      textSpacingCss: false,
    })
    expect(TEXT_SPACING_CSS).toContain('letter-spacing: 0.12em')
    expect(TEXT_SPACING_CSS).toContain('word-spacing: 0.16em')
    expect(TEXT_SPACING_CSS).toContain('line-height: 1.5')
  })

  it('emulates media features for high contrast and reduced motion', () => {
    expect(switchesFor(on({ active: 'highContrast' })).mediaFeatures).toEqual([
      { name: 'forced-colors', value: 'active' },
      { name: 'prefers-contrast', value: 'more' },
    ])
    expect(switchesFor(on({ active: 'motion' }))).toMatchObject({
      mediaFeatures: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
      observe: 'motion',
    })
  })

  it('mutes and watches for captions', () => {
    expect(switchesFor(on({ active: 'noSound' }))).toMatchObject({ muted: true, observe: 'sound' })
  })
})

describe('sanitizeExperiencePatch', () => {
  it('keeps only known values', () => {
    const next = sanitizeExperiencePatch(defaultExperienceState, {
      active: 'zoom',
      zoom: 3,
      vision: 'nope',
      narrow: 'yes',
      textSize: false,
      extra: 1,
    })
    expect(next).toEqual({ ...defaultExperienceState, active: 'zoom', textSize: false })
  })

  it('refuses experiences that are not available yet', () => {
    expect(sanitizeExperiencePatch(defaultExperienceState, { active: 'reader' }).active).toBeNull()
    expect(sanitizeExperiencePatch(on({ active: 'zoom' }), { active: null }).active).toBeNull()
  })

  it('ignores junk', () => {
    expect(sanitizeExperiencePatch(defaultExperienceState, null)).toEqual(defaultExperienceState)
    expect(sanitizeExperiencePatch(defaultExperienceState, 'zoom')).toEqual(defaultExperienceState)
  })
})

describe('experience strings', () => {
  it('has a name, a description and a fidelity note for every experience', () => {
    for (const { id, available } of experiences) {
      expect(en).toHaveProperty(`exp.${id}`)
      expect(en).toHaveProperty(`exp.${id}.what`)
      if (available) {
        expect(en).toHaveProperty(`exp.${id}.look`)
        expect(en).toHaveProperty(`exp.${id}.fidelity`)
      }
    }
  })
})
