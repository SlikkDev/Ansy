import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { ExperienceReport } from '../../../shared/experiences'
import type { Locale } from '../../../shared/i18n'
import { readerSpeech, type ReaderCommand, type ReaderEvent } from '../../../shared/reader'
import { ansy } from './ansy'
import { useT } from './i18n'
import { listVoices, onVoices, pickVoice, speak, stopSpeaking } from './speech'

/** One line of the transcript. */
export interface TranscriptLine {
  id: number
  text: string
  event: ReaderEvent
}

export interface ReaderController {
  transcript: TranscriptLine[]
  /** The voice chosen for the language, or an empty name when there is none. */
  voice: string
  /** "Read on from here" is running. */
  reading: boolean
  run: (command: ReaderCommand) => void
  readAll: () => void
  stop: () => void
  clear: () => void
}

const ReaderContext = createContext<ReaderController | null>(null)

/** Lines kept; older ones scroll away. */
const MAX_LINES = 200

/** With no voice, "read on" moves at reading pace instead of waiting for speech to end. */
const SILENT_PACE = 900

/**
 * Turns what the main process says into words and speech, and keeps the
 * transcript. Lives above the panel so the card can be unmounted and remounted
 * without losing what was said.
 */
export function ReaderProvider({
  report,
  locale,
  children,
}: {
  report: ExperienceReport | null
  locale: Locale
  children: ReactNode
}) {
  const t = useT()
  const [transcript, setTranscript] = useState<TranscriptLine[]>([])
  const [voices, setVoices] = useState(listVoices)
  const [reading, setReading] = useState(false)
  const readingRef = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const next = useRef(0)
  const active = report?.state.active === 'reader'
  const voiceOn = report?.state.readerVoice ?? true
  const rate = report?.state.readerRate ?? 'normal'
  const choice = useMemo(() => pickVoice(locale, voices), [locale, voices])

  useEffect(() => onVoices(() => setVoices(listVoices())), [])

  const stop = useCallback(() => {
    readingRef.current = false
    setReading(false)
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    stopSpeaking()
  }, [])

  const run = useCallback((command: ReaderCommand) => {
    void ansy.reader.command(command)
  }, [])

  const advance = useCallback(() => {
    if (readingRef.current) run({ kind: 'move', target: null, dir: 1 })
  }, [run])

  useEffect(
    () =>
      ansy.reader.onEvent((event) => {
        if (event.type === 'stop') {
          stop()
          return
        }
        const text = readerSpeech(event, t)
        if (!text) return
        setTranscript((lines) => {
          next.current += 1
          const line = { id: next.current, text, event }
          return lines.length >= MAX_LINES ? [...lines.slice(1), line] : [...lines, line]
        })
        // Reading on stops at the bottom, and when the page or the mode changes under it.
        const keepReading = readingRef.current && event.type === 'item' && !event.focus
        if (readingRef.current && !keepReading) stop()
        const spoken = voiceOn && speak(text, { locale, rate, voice: choice.voice, onEnd: advance })
        if (keepReading && !spoken) timer.current = setTimeout(advance, SILENT_PACE)
      }),
    [t, locale, rate, voiceOn, choice.voice, advance, stop],
  )

  // Switching the reader off starts a fresh transcript next time, and silences it now.
  const [wasActive, setWasActive] = useState(active)
  if (active !== wasActive) {
    setWasActive(active)
    if (!active) {
      setTranscript([])
      setReading(false)
    }
  }
  useEffect(() => {
    if (active) return
    readingRef.current = false
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    stopSpeaking()
  }, [active])

  const readAll = useCallback(() => {
    readingRef.current = true
    setReading(true)
    run({ kind: 'move', target: null, dir: 1 })
  }, [run])

  const clear = useCallback(() => setTranscript([]), [])

  const value = useMemo<ReaderController>(
    () => ({ transcript, voice: choice.name, reading, run, readAll, stop, clear }),
    [transcript, choice.name, reading, run, readAll, stop, clear],
  )
  return <ReaderContext.Provider value={value}>{children}</ReaderContext.Provider>
}

export function useReader(): ReaderController {
  const value = useContext(ReaderContext)
  if (!value) throw new Error('useReader needs a ReaderProvider')
  return value
}
