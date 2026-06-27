/**
 * Prosody Analysis — analyzes text to determine optimal speech parameters.
 *
 * Makes the AI voice sound more human-like by:
 * - Detecting questions (rising intonation → higher pitch at end)
 * - Detecting exclamations (excitement → faster rate, higher energy)
 * - Detecting emphasis (important info → slower, clearer)
 * - Inserting strategic pauses
 * - Mapping personality to voice characteristics
 */

export interface ProsodyResult {
  /** Base rate multiplier (1.0 = normal) */
  rate: number
  /** Base pitch multiplier (1.0 = normal) */
  pitch: number
  /** Base volume (0-1) */
  volume: number
  /** Pause duration before this sentence in ms */
  pauseBefore: number
  /** Pause duration after this sentence in ms */
  pauseAfter: number
  /** Emotional tag for visual indicators */
  emotion: 'neutral' | 'question' | 'excited' | 'thoughtful' | 'empathetic' | 'playful'
}

export type ProsodyProfile = 'warm' | 'steady' | 'expressive' | 'precise' | 'patient'

/** Base parameters per personality profile */
const PROFILE_BASE: Record<ProsodyProfile, { rate: number; pitch: number; volume: number }> = {
  warm:      { rate: 0.95, pitch: 1.08, volume: 1.0 },
  steady:    { rate: 1.0,  pitch: 1.0,  volume: 1.0 },
  expressive:{ rate: 1.05, pitch: 1.12, volume: 1.0 },
  precise:   { rate: 0.92, pitch: 0.97, volume: 1.0 },
  patient:   { rate: 0.88, pitch: 1.04, volume: 1.0 },
}

/** Filler words / cues that suggest pacing */
const THOUGHTFUL_CUES = ['however', 'actually', 'well', 'hmm', 'let me think', 'interesting', 'on the other hand']
const EMPATHY_CUES = ['sorry', 'understand', 'feel', 'difficult', 'challenge', 'struggle', 'worry', 'afraid']
const PLAYFUL_CUES = ['amazing', 'awesome', 'love', 'exciting', 'wonderful', 'fantastic', 'great', 'fun']

/**
 * Analyze a sentence and produce prosody parameters.
 * @param sentence The sentence text (already cleaned of markdown)
 * @param profile Personality prosody profile
 * @param sentenceIndex 0-based index in the response (affects pacing)
 * @param totalSentences Total sentences expected (for pacing)
 */
export function analyzeProsody(
  sentence: string,
  profile: ProsodyProfile = 'warm',
  sentenceIndex = 0,
  totalSentences = 1
): ProsodyResult {
  const base = PROFILE_BASE[profile] || PROFILE_BASE.warm
  const lower = sentence.toLowerCase().trim()
  const trimmed = sentence.trim()

  let rate = base.rate
  let pitch = base.pitch
  let volume = base.volume
  let pauseBefore = sentenceIndex === 0 ? 0 : 180 // natural pause between sentences
  let pauseAfter = 80
  let emotion: ProsodyResult['emotion'] = 'neutral'

  // Detect question
  const isQuestion = trimmed.endsWith('?')
  if (isQuestion) {
    emotion = 'question'
    pitch *= 1.12 // rising intonation
    rate *= 0.97  // slightly slower for clarity
    pauseAfter = 200 // longer pause after questions (expecting listener to think)
  }

  // Detect exclamation
  const isExclamation = trimmed.endsWith('!')
  if (isExclamation) {
    emotion = 'excited'
    rate *= 1.08
    pitch *= 1.08
    volume = Math.min(1, volume * 1.05)
    pauseAfter = 150
  }

  // Detect thoughtful cues
  if (THOUGHTFUL_CUES.some(c => lower.includes(c))) {
    emotion = 'thoughtful'
    rate *= 0.9 // slow down for thoughtful parts
    pauseBefore = Math.max(pauseBefore, 300) // longer pause for emphasis
  }

  // Detect empathy
  if (EMPATHY_CUES.some(c => lower.includes(c))) {
    emotion = emotion === 'neutral' ? 'empathetic' : emotion
    rate *= 0.92 // slower, gentler
    pitch *= 0.95 // lower, softer
    pauseAfter = 200
  }

  // Detect playful excitement
  if (PLAYFUL_CUES.some(c => lower.includes(c))) {
    emotion = emotion === 'neutral' ? 'playful' : emotion
    rate *= 1.03
    pitch *= 1.06
  }

  // Long sentences — slow down for clarity
  const wordCount = trimmed.split(/\s+/).length
  if (wordCount > 20) {
    rate *= 0.93
  }

  // First sentence — slightly more energy to grab attention
  if (sentenceIndex === 0 && !isQuestion) {
    volume = Math.min(1, volume * 1.03)
  }

  // Last sentence — slight slowdown for closure
  if (sentenceIndex === totalSentences - 1 && totalSentences > 1) {
    rate *= 0.95
    pauseAfter = 300 // longer pause before listening again
  }

  // Clamp values to reasonable ranges
  rate = Math.max(0.5, Math.min(1.8, rate))
  pitch = Math.max(0.5, Math.min(2.0, pitch))
  volume = Math.max(0, Math.min(1, volume))

  return { rate, pitch, volume, pauseBefore, pauseAfter, emotion }
}

/**
 * Clean text for speech — strip markdown, code blocks, etc.
 * More aggressive cleaning for voice (no URLs, no symbols).
 */
export function cleanTextForSpeech(text: string): string {
  return text
    // Remove code blocks entirely (they don't make sense in speech)
    .replace(/```[\s\S]*?```/g, ' code block ')
    // Inline code
    .replace(/`([^`]+)`/g, '$1')
    // Headers
    .replace(/^#{1,6}\s+/gm, '')
    // Bold/italic
    .replace(/[*_~]{1,3}([^*_~]+)[*_~]{1,3}/g, '$1')
    // Links — keep text, drop URL
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Bullet points / dashes
    .replace(/^[\s]*[-*+]\s+/gm, '')
    // Numbered lists
    .replace(/^\d+\.\s+/gm, '')
    // Blockquotes
    .replace(/^>\s+/gm, '')
    // URLs
    .replace(/https?:\/\/[^\s]+/g, ' a link ')
    // Multiple newlines
    .replace(/\n{2,}/g, '. ')
    // Single newlines → space
    .replace(/\n/g, ' ')
    // Multiple spaces
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/**
 * Split text into sentences for streaming TTS.
 * Handles common abbreviations to avoid false breaks.
 */
export function splitIntoSentences(text: string): string[] {
  const cleaned = cleanTextForSpeech(text)
  if (!cleaned) return []

  // Protect common abbreviations
  const protected_text = cleaned
    .replace(/\b(Mr|Mrs|Ms|Dr|Prof|Sr|Jr|Inc|Ltd|Co|vs|etc|e\.g|i\.e)\./gi, (m) => m.replace('.', '\x00'))

  // Split on sentence-ending punctuation followed by space/newline
  const parts = protected_text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.replace(/\x00/g, '.').trim())
    .filter(s => s.length > 0)

  return parts
}
