/**
 * The experiences: what Ansy can switch on over the site, and the state those
 * switches hold. Shared by the main process (which applies them to the site
 * view) and Ansy's screens (which show them as task cards).
 */

export type ExperienceId =
  | 'colorBlindness'
  | 'blurLowContrast'
  | 'reader'
  | 'zoom'
  | 'largeText'
  | 'highContrast'
  | 'keyboard'
  | 'noSound'
  | 'motion'
  | 'scan'

/** How close the experience is to what that person really gets. Explained on each card. */
export type Fidelity = 'high' | 'medium'

export interface ExperienceInfo {
  id: ExperienceId
  fidelity: Fidelity
  /** The seven switch-based experiences work now; the rest arrive in later steps. */
  available: boolean
}

/** In the order the plan lists them, which is the order of the panel. */
export const experiences: readonly ExperienceInfo[] = [
  { id: 'colorBlindness', fidelity: 'high', available: true },
  { id: 'blurLowContrast', fidelity: 'medium', available: true },
  { id: 'reader', fidelity: 'medium', available: false },
  { id: 'zoom', fidelity: 'high', available: true },
  { id: 'largeText', fidelity: 'high', available: true },
  { id: 'highContrast', fidelity: 'high', available: true },
  { id: 'keyboard', fidelity: 'high', available: false },
  { id: 'noSound', fidelity: 'medium', available: true },
  { id: 'motion', fidelity: 'high', available: true },
  { id: 'scan', fidelity: 'high', available: false },
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

export const zoomLevels = [2, 4] as const
export type ZoomLevel = (typeof zoomLevels)[number]

/**
 * Everything the switches remember. `active` is the one experience running;
 * the rest are each experience's options, kept so coming back finds them as
 * they were.
 */
export interface ExperienceState {
  active: ExperienceId | null
  vision: VisionMode
  blur: BlurMode
  zoom: ZoomLevel
  /** A 320 CSS-pixel-wide view, the narrowest WCAG asks a page to reflow to. */
  narrow: boolean
  /** The browser's default font size doubled, as a user sets it in their browser. */
  textSize: boolean
  /** The WCAG 1.4.12 text-spacing override. */
  textSpacing: boolean
}

export const defaultExperienceState: ExperienceState = {
  active: null,
  vision: 'deuteranopia',
  blur: 'blurredVision',
  zoom: 2,
  narrow: false,
  textSize: true,
  textSpacing: true,
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
}

/** The state plus whatever the helper found on the current page, pushed to Ansy's screens. */
export interface ExperienceReport {
  state: ExperienceState
  observations: Observations | null
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
  observe: 'motion' | 'sound' | null
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
  }
  switch (state.active) {
    case 'colorBlindness':
      return { ...off, visionDeficiency: state.vision }
    case 'blurLowContrast':
      return { ...off, visionDeficiency: state.blur }
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
    case 'motion':
      return {
        ...off,
        mediaFeatures: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
        observe: 'motion',
      }
    case 'noSound':
      return { ...off, muted: true, observe: 'sound' }
    default:
      return off
  }
}

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
  if (r.zoom === 2 || r.zoom === 4) next.zoom = r.zoom
  if (typeof r.narrow === 'boolean') next.narrow = r.narrow
  if (typeof r.textSize === 'boolean') next.textSize = r.textSize
  if (typeof r.textSpacing === 'boolean') next.textSpacing = r.textSpacing
  return next
}

export function isAvailableExperience(value: string): value is ExperienceId {
  return experiences.some((e) => e.id === value && e.available)
}
