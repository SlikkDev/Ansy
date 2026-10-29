/**
 * The experiences: what Ansy can switch on over the site, and the state those
 * switches hold. Shared by the main process (which applies them to the site
 * view) and Ansy's screens (which show them as task cards).
 */

import type { FlashReport, PlainLanguageReport, ReadingReport } from './cognitive'
import type { KeyboardReport } from './keyboard'
import { switchSpeeds, type SwitchReport, type SwitchSpeed, type TremorReport } from './motor'
import type { ReaderReport } from './reader'
import type { ScanResult } from './scan'
import type { VoiceReport } from './voice'

export type ExperienceId =
  | 'colorBlindness'
  | 'blurLowContrast'
  | 'tunnelVision'
  | 'haze'
  | 'reader'
  | 'zoom'
  | 'largeText'
  | 'highContrast'
  | 'darkMode'
  | 'keyboard'
  | 'tremor'
  | 'switchAccess'
  | 'voiceControl'
  | 'noSound'
  | 'motion'
  | 'readingAids'
  | 'plainLanguage'
  | 'flashing'
  | 'scan'

/**
 * How close the experience is to what that person really gets. Explained on each card.
 * Low is an impression only: its card says so and points to the tool that person uses.
 */
export type Fidelity = 'high' | 'medium' | 'low'

/** The panel's groups, in the order it shows them. */
export const experienceAreas = [
  'vision',
  'lowVision',
  'motor',
  'hearing',
  'cognitive',
  'check',
] as const
export type ExperienceArea = (typeof experienceAreas)[number]

export interface ExperienceInfo {
  id: ExperienceId
  area: ExperienceArea
  fidelity: Fidelity
  /** Switched on from the panel. All are; the flag stays for the next experience in the making. */
  available: boolean
}

/** Grouped by area, in the order of the panel. */
export const experiences: readonly ExperienceInfo[] = [
  { id: 'colorBlindness', area: 'vision', fidelity: 'high', available: true },
  { id: 'blurLowContrast', area: 'vision', fidelity: 'medium', available: true },
  { id: 'tunnelVision', area: 'vision', fidelity: 'low', available: true },
  { id: 'haze', area: 'vision', fidelity: 'low', available: true },
  { id: 'reader', area: 'vision', fidelity: 'medium', available: true },
  { id: 'zoom', area: 'lowVision', fidelity: 'high', available: true },
  { id: 'largeText', area: 'lowVision', fidelity: 'high', available: true },
  { id: 'highContrast', area: 'lowVision', fidelity: 'high', available: true },
  { id: 'darkMode', area: 'lowVision', fidelity: 'high', available: true },
  { id: 'keyboard', area: 'motor', fidelity: 'high', available: true },
  { id: 'tremor', area: 'motor', fidelity: 'low', available: true },
  { id: 'switchAccess', area: 'motor', fidelity: 'medium', available: true },
  { id: 'voiceControl', area: 'motor', fidelity: 'medium', available: true },
  { id: 'noSound', area: 'hearing', fidelity: 'medium', available: true },
  { id: 'motion', area: 'cognitive', fidelity: 'high', available: true },
  { id: 'readingAids', area: 'cognitive', fidelity: 'medium', available: true },
  { id: 'plainLanguage', area: 'cognitive', fidelity: 'medium', available: true },
  { id: 'flashing', area: 'cognitive', fidelity: 'low', available: true },
  { id: 'scan', area: 'check', fidelity: 'high', available: true },
]

export const experienceIds: readonly ExperienceId[] = experiences.map((e) => e.id)

export function experienceInfo(id: ExperienceId): ExperienceInfo {
  const info = experiences.find((e) => e.id === id)
  if (!info) throw new Error(`Unknown experience: ${id}`)
  return info
}

/** Chromium's vision-deficiency emulation types, as DevTools names them. */
export const visionModes = ['deuteranopia', 'protanopia', 'tritanopia', 'achromatopsia'] as const
export type VisionMode = (typeof visionModes)[number]

export const blurModes = ['blurredVision', 'reducedContrast'] as const
export type BlurMode = (typeof blurModes)[number]

/** Loss of the visual field: only the middle left (tunnel), or the middle gone (central). */
export const fieldModes = ['tunnel', 'central'] as const
export type FieldMode = (typeof fieldModes)[number]

/** A veil over the whole view: clouded lenses, or light flooding the screen. */
export const hazeModes = ['cataract', 'glare'] as const
export type HazeMode = (typeof hazeModes)[number]

/** What the overlay helper paints over the site. */
export type OverlayKind = FieldMode | HazeMode | 'ruler'

export const zoomLevels = [2, 4] as const
export type ZoomLevel = (typeof zoomLevels)[number]

/** How fast Ansy Reader speaks. Experienced screen reader users go much faster still. */
export const readerRates = ['slow', 'normal', 'fast'] as const
export type ReaderRate = (typeof readerRates)[number]

/**
 * Everything the switches remember. `active` is the one experience running;
 * the rest are each experience's options, kept so coming back finds them as
 * they were.
 */
export interface ExperienceState {
  active: ExperienceId | null
  vision: VisionMode
  blur: BlurMode
  field: FieldMode
  haze: HazeMode
  zoom: ZoomLevel
  /** A 320 CSS-pixel-wide view, the narrowest WCAG asks a page to reflow to. */
  narrow: boolean
  /** The browser's default font size doubled, as a user sets it in their browser. */
  textSize: boolean
  /** The WCAG 1.4.12 text-spacing override. */
  textSpacing: boolean
  /** Dark mode: darken sites that have no dark theme of their own, as Chrome's auto dark mode does. */
  darkForce: boolean
  /** Keyboard only: take the mouse away as well as drawing the trail. */
  mouseOff: boolean
  /** Switch access: how long the highlight rests on each control. */
  switchSpeed: SwitchSpeed
  /** Ansy Reader: say it aloud, not only in the transcript. */
  readerVoice: boolean
  readerRate: ReaderRate
  /** Ansy Reader: black out the site, so the ears are all there is. */
  readerCover: boolean
  /** Reading aids: a readable font, wider spacing, a line-focus ruler. */
  readingFont: boolean
  readingSpacing: boolean
  readingRuler: boolean
}

export const defaultExperienceState: ExperienceState = {
  active: null,
  vision: 'deuteranopia',
  blur: 'blurredVision',
  field: 'tunnel',
  haze: 'cataract',
  zoom: 2,
  narrow: false,
  textSize: true,
  textSpacing: true,
  darkForce: false,
  mouseOff: true,
  switchSpeed: 'normal',
  readerVoice: true,
  readerRate: 'normal',
  readerCover: false,
  readingFont: true,
  readingSpacing: true,
  readingRuler: true,
}

/** What the in-page helper noticed, for the experiences that look for something. */
export interface Observations {
  /** Animations still running after the page was asked to reduce motion. */
  animations: number
  /** Video or audio that started by itself. */
  autoplay: number
  /** Video and audio elements with their own media. */
  media: number
  /** Of those, the ones without a captions or subtitles track. */
  mediaWithoutCaptions: number
  /** Players from YouTube, Vimeo and the like, whose captions must be checked by hand. */
  embeddedPlayers: number
  /** The page's own background is dark, so it answers the dark preference. */
  darkBackground: boolean
}

/** The state plus whatever the helpers found on the current page, pushed to Ansy's screens. */
export interface ExperienceReport {
  state: ExperienceState
  observations: Observations | null
  /** What the keyboard helper has seen so far, while keyboard only runs. */
  keyboard: KeyboardReport | null
  /** Switch access: where scanning has got to and what it skips, while it runs. */
  switchAccess: SwitchReport | null
  /** Tremor: clicks made and those the shake carried elsewhere, while it runs. */
  tremor: TremorReport | null
  /** Voice control: commands that missed because a name differs from what shows, while it runs. */
  voice: VoiceReport | null
  /** Reading aids: text the new font or spacing cut off, while they run. */
  reading: ReadingReport | null
  /** Plain language: the page's reading score once worked out, null inside when the page has too little text. */
  plainLanguage: { score: PlainLanguageReport | null } | null
  /** Flashing: what the frame watcher has counted, while it runs. */
  flashing: FlashReport | null
  /** The last automatic scan of the current page, while the scan runs. */
  scan: ScanResult | null
  /** A scan is due or under way. */
  scanning: boolean
  /** Where Ansy Reader is on the page, while it runs. */
  reader: ReaderReport | null
}

const PIXEL_FONT_DEFAULT = 16
const PIXEL_FONT_LARGE = 32

/**
 * The browser-level switches a state asks for. Pure, so it can be tested without
 * Electron; the engine turns each field into the matching DevTools command.
 */
export interface SiteSwitches {
  visionDeficiency: VisionMode | BlurMode | 'none'
  mediaFeatures: { name: string; value: string }[]
  fontSize: number
  textSpacingCss: boolean
  zoomFactor: number
  narrow: boolean
  muted: boolean
  observe: 'motion' | 'sound' | 'dark' | null
  /** Chromium's automatic dark mode, which darkens pages that have no dark theme. */
  autoDark: boolean
  /** An impression painted over the site: a narrowed field, or a veil. */
  overlay: OverlayKind | null
  /** The keyboard helper: focus ring, trail and findings. */
  keyboard: boolean
  /** No pointer, no hover, no clicks. */
  mouseOff: boolean
  /** The automatic scan, run on each page. */
  scan: boolean
  /** Only these axe rules, or every rule when null. */
  scanRules: string[] | null
  /** Switch access: step scanning, picked with Space. */
  switchAccess: SwitchSpeed | null
  /** A shaking pointer in place of the real one. */
  tremor: boolean
  /** Voice control: the command box's helper, and numbers on request. */
  voice: boolean
  /** Reading aids: a readable font over the page's own. */
  readableFont: boolean
  /** Reading aids: look for text the font or spacing cut off. */
  readingCheck: boolean
  /** Plain language: score the page's text and ring the hardest blocks. */
  plainLanguage: boolean
  /** Flashing: watch the frames and count flashes. */
  flashes: boolean
  /** Ansy Reader: the accessibility tree read aloud, keys taken from the site. */
  reader: boolean
  /** The site painted black. */
  cover: boolean
}

export function switchesFor(state: ExperienceState): SiteSwitches {
  const off: SiteSwitches = {
    visionDeficiency: 'none',
    mediaFeatures: [],
    fontSize: PIXEL_FONT_DEFAULT,
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
    scanRules: null,
    switchAccess: null,
    tremor: false,
    voice: false,
    readableFont: false,
    readingCheck: false,
    plainLanguage: false,
    flashes: false,
    reader: false,
    cover: false,
  }
  switch (state.active) {
    case 'colorBlindness':
      return { ...off, visionDeficiency: state.vision }
    case 'blurLowContrast':
      return { ...off, visionDeficiency: state.blur }
    case 'tunnelVision':
      return { ...off, overlay: state.field }
    case 'haze':
      return { ...off, overlay: state.haze }
    case 'zoom':
      return { ...off, zoomFactor: state.narrow ? 1 : state.zoom, narrow: state.narrow }
    case 'largeText':
      return {
        ...off,
        fontSize: state.textSize ? PIXEL_FONT_LARGE : PIXEL_FONT_DEFAULT,
        textSpacingCss: state.textSpacing,
      }
    case 'highContrast':
      return {
        ...off,
        mediaFeatures: [
          { name: 'forced-colors', value: 'active' },
          { name: 'prefers-contrast', value: 'more' },
        ],
      }
    case 'darkMode':
      return {
        ...off,
        mediaFeatures: [{ name: 'prefers-color-scheme', value: 'dark' }],
        autoDark: state.darkForce,
        observe: 'dark',
      }
    case 'keyboard':
      return { ...off, keyboard: true, mouseOff: state.mouseOff }
    case 'tremor':
      // The shake is an impression; the 24-pixel check beside it is exact.
      return { ...off, tremor: true, scan: true, scanRules: ['target-size'] }
    case 'switchAccess':
      return { ...off, switchAccess: state.switchSpeed }
    case 'voiceControl':
      // What a command misses by name, the label-in-name rule finds on the whole page.
      return { ...off, voice: true, scan: true, scanRules: ['label-content-name-mismatch'] }
    case 'motion':
      return {
        ...off,
        mediaFeatures: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
        observe: 'motion',
      }
    case 'readingAids':
      return {
        ...off,
        readableFont: state.readingFont,
        textSpacingCss: state.readingSpacing,
        overlay: state.readingRuler ? 'ruler' : null,
        readingCheck: state.readingFont || state.readingSpacing,
      }
    case 'plainLanguage':
      return { ...off, plainLanguage: true }
    case 'flashing':
      return { ...off, flashes: true }
    case 'noSound':
      return { ...off, muted: true, observe: 'sound' }
    case 'scan':
      return { ...off, scan: true }
    case 'reader':
      return { ...off, reader: true, cover: state.readerCover }
    default:
      return off
  }
}

/**
 * The screen cover: the site goes black and stays interactive underneath, so a
 * sighted owner is left with what Ansy Reader says. A pseudo-element on the
 * root sits above everything but the top layer, and it costs the page nothing.
 */
export const COVER_CSS = `
html::after {
  content: '';
  position: fixed;
  inset: 0;
  background: #000;
  z-index: 2147483647;
}
`

/**
 * WCAG 1.4.12: a page must survive these spacing values without losing content
 * or function. This is the override people with dyslexia or low vision apply.
 */
export const TEXT_SPACING_CSS = `
* {
  line-height: 1.5 !important;
  letter-spacing: 0.12em !important;
  word-spacing: 0.16em !important;
}
p {
  margin-bottom: 2em !important;
}
`

/** Keeps only valid values; anything odd falls back to what was there. */
export function sanitizeExperiencePatch(current: ExperienceState, raw: unknown): ExperienceState {
  const next = { ...current }
  if (!raw || typeof raw !== 'object') return next
  const r = raw as Record<string, unknown>
  if (r.active === null) next.active = null
  else if (typeof r.active === 'string' && isAvailableExperience(r.active)) next.active = r.active
  if (typeof r.vision === 'string' && (visionModes as readonly string[]).includes(r.vision)) {
    next.vision = r.vision as VisionMode
  }
  if (typeof r.blur === 'string' && (blurModes as readonly string[]).includes(r.blur)) {
    next.blur = r.blur as BlurMode
  }
  if (typeof r.field === 'string' && (fieldModes as readonly string[]).includes(r.field)) {
    next.field = r.field as FieldMode
  }
  if (typeof r.haze === 'string' && (hazeModes as readonly string[]).includes(r.haze)) {
    next.haze = r.haze as HazeMode
  }
  if (r.zoom === 2 || r.zoom === 4) next.zoom = r.zoom
  if (typeof r.narrow === 'boolean') next.narrow = r.narrow
  if (typeof r.textSize === 'boolean') next.textSize = r.textSize
  if (typeof r.textSpacing === 'boolean') next.textSpacing = r.textSpacing
  if (typeof r.darkForce === 'boolean') next.darkForce = r.darkForce
  if (typeof r.mouseOff === 'boolean') next.mouseOff = r.mouseOff
  if (
    typeof r.switchSpeed === 'string' &&
    (switchSpeeds as readonly string[]).includes(r.switchSpeed)
  ) {
    next.switchSpeed = r.switchSpeed as SwitchSpeed
  }
  if (typeof r.readerVoice === 'boolean') next.readerVoice = r.readerVoice
  if (
    typeof r.readerRate === 'string' &&
    (readerRates as readonly string[]).includes(r.readerRate)
  ) {
    next.readerRate = r.readerRate as ReaderRate
  }
  if (typeof r.readerCover === 'boolean') next.readerCover = r.readerCover
  if (typeof r.readingFont === 'boolean') next.readingFont = r.readingFont
  if (typeof r.readingSpacing === 'boolean') next.readingSpacing = r.readingSpacing
  if (typeof r.readingRuler === 'boolean') next.readingRuler = r.readingRuler
  return next
}

export function isAvailableExperience(value: string): value is ExperienceId {
  return experiences.some((e) => e.id === value && e.available)
}
