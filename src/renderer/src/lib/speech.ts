import type { ReaderRate } from '../../../shared/experiences'
import type { Locale } from '../../../shared/i18n'

/**
 * The voice: the operating system's own, through the Web Speech API in
 * Ansy's window. Windows and macOS ship voices in English and Hebrew; a bare
 * Linux needs speech-dispatcher. With no voice for the language, the
 * transcript carries the reader alone.
 */

const LANG: Record<Locale, string> = { en: 'en-US', he: 'he-IL' }

const RATES: Record<ReaderRate, number> = { slow: 0.8, normal: 1.1, fast: 1.6 }

export interface VoiceChoice {
  /** The voice's own name, for the card. */
  name: string
  voice: SpeechSynthesisVoice | null
}

const synth = (): SpeechSynthesis | null =>
  typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null

/** Hebrew voices may still carry the old code. */
const speaks = (voice: SpeechSynthesisVoice, locale: Locale): boolean => {
  const tag = voice.lang.toLowerCase().replace('_', '-')
  const codes = locale === 'he' ? ['he', 'iw'] : ['en']
  return codes.some((code) => tag === code || tag.startsWith(`${code}-`))
}

/** The best voice for a language: the default one, else the first that speaks it. Null when none does. */
export function pickVoice(locale: Locale, voices: readonly SpeechSynthesisVoice[]): VoiceChoice {
  const candidates = voices.filter((voice) => speaks(voice, locale))
  const voice = candidates.find((v) => v.default) ?? candidates[0] ?? null
  return { name: voice?.name ?? '', voice }
}

export function listVoices(): SpeechSynthesisVoice[] {
  return synth()?.getVoices() ?? []
}

/** Calls back when the voice list is in, which can be after the page loads. */
export function onVoices(callback: () => void): () => void {
  const s = synth()
  if (!s) return () => {}
  s.addEventListener('voiceschanged', callback)
  return () => s.removeEventListener('voiceschanged', callback)
}

export interface SpeakOptions {
  locale: Locale
  rate: ReaderRate
  voice: SpeechSynthesisVoice | null
  onEnd?: () => void
}

/** Says one line, cutting off whatever was being said, as a screen reader does on every key. */
export function speak(text: string, options: SpeakOptions): boolean {
  const s = synth()
  if (!s || !options.voice) return false
  s.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.voice = options.voice
  utterance.lang = LANG[options.locale]
  utterance.rate = RATES[options.rate]
  if (options.onEnd) utterance.onend = options.onEnd
  s.speak(utterance)
  return true
}

export function stopSpeaking(): void {
  synth()?.cancel()
}
