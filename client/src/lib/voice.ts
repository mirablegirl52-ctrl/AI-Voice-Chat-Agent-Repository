/**
 * Voice Engine — wraps the Web Speech API for STT (SpeechRecognition) and
 * TTS (SpeechSynthesis). Provides hooks for the UI to drive the AI orb states.
 */
import type { VoiceSettings } from '../store/voiceSettingsStore'
import type { SpeechRecognition, SpeechRecognitionStatic } from '../types/speech'

// ---------- Text-to-Speech ----------

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  return window.speechSynthesis?.getVoices() || []
}

/** Map a logical voice id from the catalog to a real SpeechSynthesisVoice */
export function pickSynthesisVoice(voiceId: string): SpeechSynthesisVoice | null {
  const voices = getAvailableVoices()
  if (voices.length === 0) return null
  const lower = voiceId.toLowerCase()

  // Heuristic mapping
  if (voiceId === 'default' || voiceId === '') return voices[0]

  let gender: 'male' | 'female' | null = null
  let lang = 'en-US'
  if (lower.includes('female')) gender = 'female'
  if (lower.includes('male')) gender = 'male'
  if (lower.includes('-uk-') || lower.includes('british')) lang = 'en-GB'
  if (lower.includes('-au-') || lower.includes('australian')) lang = 'en-AU'

  // Try gender hint via common voice name patterns
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

export function speak(
  text: string,
  settings: VoiceSettings,
  callbacks?: { onStart?: () => void; onEnd?: () => void; onBoundary?: () => void }
) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  // Strip markdown for cleaner speech
  const clean = text
    .replace(/```[\s\S]*?```/g, ' code block ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[#*_>~]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n{2,}/g, '. ')
    .trim()

  const utter = new SpeechSynthesisUtterance(clean)
  const voice = pickSynthesisVoice(settings.voiceId)
  if (voice) utter.voice = voice
  utter.rate = settings.rate
  utter.pitch = settings.pitch
  utter.volume = settings.volume
  if (callbacks?.onStart) utter.onstart = callbacks.onStart
  if (callbacks?.onEnd) utter.onend = callbacks.onEnd
  window.speechSynthesis.speak(utter)
}

export function stopSpeaking() {
  window.speechSynthesis?.cancel()
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

// ---------- Mic level visualization ----------

export async function createMicAnalyser(): Promise<{ analyser: AnalyserNode; stream: MediaStream; ctx: AudioContext } | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const ctx = new AudioContext()
    const source = ctx.createMediaStreamSource(stream)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    source.connect(analyser)
    return { analyser, stream, ctx }
  } catch {
    return null
  }
}
