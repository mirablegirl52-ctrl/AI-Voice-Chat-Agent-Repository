/**
 * Advanced TTS Engine — streaming, sentence-by-sentence speech synthesis
 * with prosody modulation and barge-in support.
 *
 * Key improvements over the basic speak() function:
 * 1. Sentence Queue: Speak sentences as they arrive from the LLM stream
 * 2. Per-sentence prosody: Questions, exclamations, etc. get appropriate pitch/rate
 * 3. Barge-in: External callback can interrupt all speech
 * 4. Natural pauses: Strategic pauses between sentences based on prosody analysis
 * 5. Speech events: onStart, onSentence, onEnd, onBargeIn callbacks
 * 6. Chrome TTS bug workaround: Resume synthesis if it pauses (Chrome 15s bug)
 */

import type { VoiceSettings } from '../store/voiceSettingsStore'
import type { ProsodyProfile, ProsodyResult } from './prosody'
import { analyzeProsody, cleanTextForSpeech, splitIntoSentences } from './prosody'
import { pickSynthesisVoice, initVoiceLoading } from './voice'

export interface SpeechCallbacks {
  /** Called when the first sentence starts speaking */
  onStart?: () => void
  /** Called when each sentence starts (for waveform/orb animation) */
  onSentence?: (text: string, emotion: ProsodyResult['emotion']) => void
  /** Called when all queued sentences are done */
  onEnd?: () => void
  /** Called when speech is interrupted by barge-in */
  onBargeIn?: () => void
  /** Called on error */
  onError?: (err: string) => void
  /** Called for each sentence with prosody data (for waveform animation) */
  onProsody?: (data: { rate: number; pitch: number; volume: number; emotion: string }) => void
}

interface QueuedSentence {
  text: string
  prosody: ProsodyResult
}

/** Singleton state */
let _queue: QueuedSentence[] = []
let _isSpeaking = false
let _generation = 0
let _callbacks: SpeechCallbacks | null = null
let _voiceSettings: VoiceSettings | null = null
let _profile: ProsodyProfile = 'warm'
let _enhancedProsody = true
let _keepAliveInterval: number | null = null
let _currentEmotion: ProsodyResult['emotion'] = 'neutral'

// --- Public API ---

/**
 * Configure the engine with base voice settings and personality profile.
 * Call this once on mount or when settings change.
 */
export function configureTTS(settings: VoiceSettings, profile: ProsodyProfile, enhancedProsody = true): void {
  _voiceSettings = settings
  _profile = profile
  _enhancedProsody = enhancedProsody
  initVoiceLoading()
}

/**
 * Start speaking a single sentence immediately.
 * Cancels any current speech first.
 */
export function speakSentence(
  text: string,
  prosody: ProsodyResult,
  gen: number
): void {
  if (!window.speechSynthesis) return
  if (gen !== _generation) return // stale generation

  const clean = cleanTextForSpeech(text)
  if (!clean) return

  const utter = new SpeechSynthesisUtterance(clean)
  const voice = _voiceSettings ? pickSynthesisVoice(_voiceSettings.voiceId) : null
  if (voice) utter.voice = voice

  // Apply prosody modulation, combined with user's base settings
  const baseRate = _voiceSettings?.rate || 1
  const basePitch = _voiceSettings?.pitch || 1
  const baseVolume = _voiceSettings?.volume || 1

  utter.rate = Math.max(0.1, Math.min(10, baseRate * prosody.rate))
  utter.pitch = Math.max(0, Math.min(2, basePitch * prosody.pitch))
  utter.volume = Math.max(0, Math.min(1, baseVolume * prosody.volume))

  _currentEmotion = prosody.emotion

  utter.onstart = () => {
    if (gen !== _generation) return
    _callbacks?.onSentence?.(clean, prosody.emotion)
    _callbacks?.onProsody?.({
      rate: utter.rate,
      pitch: utter.pitch,
      volume: utter.volume,
      emotion: prosody.emotion,
    })
  }

  utter.onend = () => {
    if (gen !== _generation) return
    processQueue(gen)
  }

  utter.onerror = (e) => {
    if (gen !== _generation) return
    // 'interrupted' and 'canceled' are expected during barge-in
    if (e.error === 'interrupted' || e.error === 'canceled') return
    processQueue(gen)
  }

  window.speechSynthesis.speak(utter)
}

/**
 * Process the next sentence in the queue.
 */
function processQueue(gen: number): void {
  if (gen !== _generation) return

  if (_queue.length === 0) {
    _isSpeaking = false
    stopKeepAlive()
    _callbacks?.onEnd?.()
    return
  }

  const next = _queue.shift()!

  // Apply pause before the sentence
  if (next.prosody.pauseBefore > 0) {
    setTimeout(() => {
      if (gen === _generation) speakSentence(next.text, next.prosody, gen)
    }, next.prosody.pauseBefore)
  } else {
    speakSentence(next.text, next.prosody, gen)
  }
}

/**
 * Queue a sentence for speaking. If nothing is currently playing,
 * starts immediately. Otherwise adds to the queue.
 *
 * @param text The sentence text
 * @param sentenceIndex Index in the overall response (for prosody context)
 * @param totalSentences Total expected sentences (for last-sentence pacing)
 */
export function queueSentence(
  text: string,
  sentenceIndex: number = 0,
  totalSentences: number = 0
): void {
  const clean = cleanTextForSpeech(text)
  if (!clean) return

  const total = totalSentences || _queue.length + 1
  // When enhanced prosody is off, use neutral prosody (base rate/pitch/volume only)
  const prosody = _enhancedProsody
    ? analyzeProsody(clean, _profile, sentenceIndex, total)
    : { rate: 1, pitch: 1, volume: 1, pauseBefore: sentenceIndex === 0 ? 0 : 120, pauseAfter: 60, emotion: 'neutral' as const }

  _queue.push({ text: clean, prosody })

  if (!_isSpeaking) {
    _isSpeaking = true
    _generation++
    const gen = _generation
    startKeepAlive()
    _callbacks?.onStart?.()
    processQueue(gen)
  }
}

/**
 * Speak a full text response immediately (non-streaming fallback).
 * Splits into sentences and queues them all.
 */
export function speakFull(text: string): void {
  const sentences = splitIntoSentences(text)
  if (sentences.length === 0) return

  // Reset queue for a fresh start
  cancelSpeech()

  sentences.forEach((s, i) => {
    const prosody = _enhancedProsody
      ? analyzeProsody(s, _profile, i, sentences.length)
      : { rate: 1, pitch: 1, volume: 1, pauseBefore: i === 0 ? 0 : 120, pauseAfter: 60, emotion: 'neutral' as const }
    _queue.push({ text: s, prosody })
  })

  if (_queue.length > 0) {
    _isSpeaking = true
    _generation++
    const gen = _generation
    startKeepAlive()
    _callbacks?.onStart?.()
    processQueue(gen)
  }
}

/**
 * Set callbacks for the TTS engine.
 */
export function setCallbacks(callbacks: SpeechCallbacks): void {
  _callbacks = callbacks
}

/**
 * Cancel all speech (barge-in or manual stop).
 */
export function cancelSpeech(): void {
  _generation++
  _queue = []
  _isSpeaking = false
  _currentEmotion = 'neutral'
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
  stopKeepAlive()
  _callbacks?.onBargeIn?.()
}

/**
 * Check if speech is active.
 */
export function getIsSpeaking(): boolean {
  return _isSpeaking || (window.speechSynthesis?.speaking ?? false)
}

/**
 * Get the current emotion of the sentence being spoken.
 */
export function getCurrentEmotion(): ProsodyResult['emotion'] {
  return _currentEmotion
}

/**
 * Get the current queue length.
 */
export function getQueueLength(): number {
  return _queue.length
}

// --- Chrome TTS bug workaround ---
// Chrome stops speechSynthesis after ~15 seconds. This keep-alive
// periodically calls resume() to prevent the bug.
function startKeepAlive(): void {
  stopKeepAlive()
  _keepAliveInterval = window.setInterval(() => {
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      // Chrome bug: paused flag gets stuck. Resume it.
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume()
      } else {
        // Trick: pause + resume keeps the timer alive
        window.speechSynthesis.pause()
        window.speechSynthesis.resume()
      }
    } else {
      stopKeepAlive()
    }
  }, 10000)
}

function stopKeepAlive(): void {
  if (_keepAliveInterval !== null) {
    clearInterval(_keepAliveInterval)
    _keepAliveInterval = null
  }
}
