import { describe, expect, it } from 'vitest'
import {
  defaultExperienceState,
  experienceAreas,
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
      autoDark: false,
      overlay: null,
      keyboard: false,
      mouseOff: false,
      scan: false,
      reader: false,
      cover: false,
      scanRules: null,
      switchAccess: null,
      tremor: false,
      voice: false,
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

  it('paints an overlay for the field and haze impressions, and nothing else', () => {
    expect(switchesFor(on({ active: 'tunnelVision' }))).toEqual({
      ...switchesFor(defaultExperienceState),
      overlay: 'tunnel',
    })
    expect(switchesFor(on({ active: 'tunnelVision', field: 'central' })).overlay).toBe('central')
    expect(switchesFor(on({ active: 'haze', haze: 'glare' })).overlay).toBe('glare')
    expect(switchesFor(on({ active: 'zoom', field: 'central' })).overlay).toBeNull()
  })

  it('asks for dark mode, and darkens sites without one only when asked', () => {
    expect(switchesFor(on({ active: 'darkMode' }))).toMatchObject({
      mediaFeatures: [{ name: 'prefers-color-scheme', value: 'dark' }],
      autoDark: false,
      observe: 'dark',
    })
    expect(switchesFor(on({ active: 'darkMode', darkForce: true })).autoDark).toBe(true)
    expect(switchesFor(on({ active: 'zoom', darkForce: true })).autoDark).toBe(false)
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

  it('installs the keyboard helper, with or without the mouse', () => {
    expect(switchesFor(on({ active: 'keyboard' }))).toMatchObject({
      keyboard: true,
      mouseOff: true,
    })
    expect(switchesFor(on({ active: 'keyboard', mouseOff: false }))).toMatchObject({
      keyboard: true,
      mouseOff: false,
    })
    expect(switchesFor(on({ active: 'zoom', mouseOff: true })).mouseOff).toBe(false)
  })

  it('shakes the pointer and checks target size for tremor', () => {
    expect(switchesFor(on({ active: 'tremor' }))).toMatchObject({
      tremor: true,
      scan: true,
      scanRules: ['target-size'],
    })
    expect(switchesFor(on({ active: 'scan' })).scanRules).toBeNull()
  })

  it('scans at the chosen switch speed', () => {
    expect(switchesFor(on({ active: 'switchAccess' })).switchAccess).toBe('normal')
    expect(switchesFor(on({ active: 'switchAccess', switchSpeed: 'slow' })).switchAccess).toBe(
      'slow',
    )
    expect(switchesFor(on({ active: 'zoom', switchSpeed: 'fast' })).switchAccess).toBeNull()
  })

  it('takes voice commands and checks label in name', () => {
    expect(switchesFor(on({ active: 'voiceControl' }))).toMatchObject({
      voice: true,
      scan: true,
      scanRules: ['label-content-name-mismatch'],
    })
  })

  it('turns the scan on by itself', () => {
    expect(switchesFor(on({ active: 'scan' }))).toMatchObject({ scan: true, observe: null })
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
      mouseOff: 'no',
      extra: 1,
    })
    expect(next).toEqual({ ...defaultExperienceState, active: 'zoom', textSize: false })
    expect(sanitizeExperiencePatch(defaultExperienceState, { mouseOff: false }).mouseOff).toBe(
      false,
    )
  })

  it('keeps the new options only when valid', () => {
    const next = sanitizeExperiencePatch(defaultExperienceState, {
      field: 'central',
      haze: 'glare',
      darkForce: true,
      switchSpeed: 'fast',
    })
    expect(next).toMatchObject({
      field: 'central',
      haze: 'glare',
      darkForce: true,
      switchSpeed: 'fast',
    })
    expect(
      sanitizeExperiencePatch(next, {
        field: 'peripheral',
        haze: 'fog',
        darkForce: 'yes',
        switchSpeed: 'warp',
      }),
    ).toEqual(next)
  })

  it('refuses experiences that are not available yet', () => {
    expect(
      sanitizeExperiencePatch(defaultExperienceState, { active: 'telepathy' }).active,
    ).toBeNull()
    expect(sanitizeExperiencePatch(on({ active: 'zoom' }), { active: null }).active).toBeNull()
  })

  it('ignores junk', () => {
    expect(sanitizeExperiencePatch(defaultExperienceState, null)).toEqual(defaultExperienceState)
    expect(sanitizeExperiencePatch(defaultExperienceState, 'zoom')).toEqual(defaultExperienceState)
  })
})

describe('the panel table', () => {
  it('puts every experience in an area, and every Low one says it is an impression', () => {
    const lows = experiences.filter((e) => e.fidelity === 'low').map((e) => e.id)
    expect(lows).toEqual(['tunnelVision', 'haze', 'tremor'])
    expect(en['fidelity.low']).toBe('A rough impression')
    for (const area of experienceAreas) {
      expect(experiences.some((e) => e.area === area)).toBe(true)
      expect(en).toHaveProperty(`area.${area}`)
    }
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
