/**
 * Voice Engine — wraps the Web Speech API for STT (SpeechRecognition) and
 * TTS (SpeechSynthesis). Provides hooks for the UI to drive the AI orb states.
 *
 * Key design decisions:
 * - TTS uses a generation counter so stale onEnd callbacks from a cancelled
 *   utterance can't clobber newer state (fixes TTS/STT race).
 * - A single shared mic analyser avoids opening duplicate getUserMedia streams
 *   when both STT and waveform need mic access.
 * - Voices are loaded eagerly and cached after the `voiceschanged` event.
 */
import type { VoiceSettings } from '../store/voiceSettingsStore'
import type { SpeechRecognition, SpeechRecognitionStatic } from '../types/speech'

// ---------- Text-to-Speech ----------

let cachedVoices: SpeechSynthesisVoice[] = []

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (cachedVoices.length > 0) return cachedVoices
  if (!window.speechSynthesis) return []
  cachedVoices = window.speechSynthesis.getVoices()
  return cachedVoices
}

/** Eagerly load + cache voices. The `voiceschanged` event fires async. */
export function initVoiceLoading(): void {
  if (!window.speechSynthesis) return
  const load = () => {
    cachedVoices = window.speechSynthesis.getVoices()
  }
  load()
  // Chrome / Safari fire `voiceschanged` async
  window.speechSynthesis.onvoiceschanged = load
}

/** Map a logical voice id from the catalog to a real SpeechSynthesisVoice */
export function pickSynthesisVoice(voiceId: string): SpeechSynthesisVoice | null {
  const voices = getAvailableVoices()
  if (voices.length === 0) return null
  const lower = voiceId.toLowerCase()

  if (voiceId === 'default' || voiceId === '') return voices[0]

  let gender: 'male' | 'female' | null = null
  let lang = 'en-US'
  if (lower.includes('female')) gender = 'female'
  if (lower.includes('male')) gender = 'male'
  if (lower.includes('-uk-') || lower.includes('british')) lang = 'en-GB'
  if (lower.includes('-au-') || lower.includes('australian')) lang = 'en-AU'

  const femaleNames = ['samantha', 'victoria', 'karen', 'aria', 'luna', 'chloe', 'zira', 'female', 'google uk english female']
  const maleNames = ['daniel', 'alex', 'oliver', 'liam', 'atlas', 'male', 'google uk english male']

  const score = (v: SpeechSynthesisVoice): number => {
    let s = 0
    const vn = v.name.toLowerCase()
    if (v.lang === lang) s += 10
    else if (v.lang.startsWith(lang.slice(0, 2))) s += 5
    if (gender === 'female' && femaleNames.some((n) => vn.includes(n))) s += 8
    if (gender === 'male' && maleNames.some((n) => vn.includes(n))) s += 8
    return s
  }

  return voices.slice().sort((a, b) => score(b) - score(a))[0]
}

/** Generation counter — increments on each cancel. Stale callbacks compare and bail. */
let ttsGeneration = 0

export function speak(
  text: string,
  settings: VoiceSettings,
  callbacks?: { onStart?: () => void; onEnd?: () => void; onError?: (err: string) => void }
): number {
  if (!window.speechSynthesis) return -1

  // Cancel any ongoing speech + invalidate its callbacks
  ttsGeneration++
  const myGen = ttsGeneration
  window.speechSynthesis.cancel()

  // Strip markdown for cleaner speech
  const clean = text
    .replace(/```[\s\S]*?```/g, ' code block ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[#*_>~]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n{2,}/g, '. ')
    .trim()

  // Guard: empty text after cleaning
  if (!clean) {
    callbacks?.onEnd?.()
    return myGen
  }

  const utter = new SpeechSynthesisUtterance(clean)
  const voice = pickSynthesisVoice(settings.voiceId)
  if (voice) utter.voice = voice
  utter.rate = settings.rate
  utter.pitch = settings.pitch
  utter.volume = settings.volume

  if (callbacks?.onStart) {
    utter.onstart = () => {
      if (myGen === ttsGeneration) callbacks.onStart!()
    }
  }
  if (callbacks?.onEnd) {
    utter.onend = () => {
      // Only fire if this generation is still current
      if (myGen === ttsGeneration) callbacks.onEnd!()
    }
  }
  if (callbacks?.onError) {
    utter.onerror = (e) => {
      if (myGen === ttsGeneration) callbacks.onError!(e.error)
    }
  }

  // Small delay — some browsers need cancel() to settle before speak()
  setTimeout(() => {
    if (myGen === ttsGeneration) {
      window.speechSynthesis.speak(utter)
    }
  }, 50)

  return myGen
}

export function stopSpeaking(): void {
  ttsGeneration++
  window.speechSynthesis?.cancel()
}

export function isSpeaking(): boolean {
  return !!window.speechSynthesis?.speaking
}

// ---------- Speech-to-Text ----------

export function isSTTSupported(): boolean {
  return typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition)
}

export function createRecognition(lang = 'en-US'): SpeechRecognition | null {
  const SR: SpeechRecognitionStatic | undefined = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SR) return null
  const rec = new SR()
  rec.lang = lang
  rec.continuous = false
  rec.interimResults = true
  rec.maxAlternatives = 1
  return rec
}

// ---------- Shared mic analyser (avoids duplicate getUserMedia) ----------

let sharedAnalyser: AnalyserNode | null = null
let sharedStream: MediaStream | null = null
let sharedCtx: AudioContext | null = null
let analyserRefCount = 0

/**
 * Acquire a reference to the shared mic analyser.
 * Multiple consumers (Waveform, etc.) share the same stream.
 * Call releaseMicAnalyser() when done.
 */
export async function acquireMicAnalyser(): Promise<AnalyserNode | null> {
  analyserRefCount++
  if (sharedAnalyser) return sharedAnalyser

  try {
    sharedStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    sharedCtx = new AudioContext()
    const source = sharedCtx.createMediaStreamSource(sharedStream)
    sharedAnalyser = sharedCtx.createAnalyser()
    sharedAnalyser.fftSize = 128
    source.connect(sharedAnalyser)
    return sharedAnalyser
  } catch {
    analyserRefCount--
    return null
  }
}

export function releaseMicAnalyser(): void {
  analyserRefCount = Math.max(0, analyserRefCount - 1)
  if (analyserRefCount === 0) {
    if (sharedStream) {
      sharedStream.getTracks().forEach((t) => t.stop())
      sharedStream = null
    }
    if (sharedCtx) {
      sharedCtx.close()
      sharedCtx = null
    }
    sharedAnalyser = null
  }
}
