/**
 * useAdvancedVoice — Unified voice orchestrator hook.
 *
 * Replaces the scattered STT/TTS logic from VoiceChat with a clean,
 * unified hook that handles:
 * - Speech-to-text (browser SpeechRecognition)
 * - Streaming TTS (sentence-by-sentence with prosody)
 * - Voice Activity Detection (VAD) for always-on mode
 * - Barge-in (interrupt AI speech when user starts talking)
 * - Conversation flow management
 *
 * Usage:
 *   const voice = useAdvancedVoice({ chatId, ... })
 *   voice.startConversation()
 *   voice.state // 'idle' | 'listening' | 'thinking' | 'speaking'
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import type { OrbState } from '../components/AIOrb'
import type { VoiceSettings } from '../store/voiceSettingsStore'
import type { ProsodyProfile } from '../lib/prosody'
import { api } from '../lib/api'
import { isSTTSupported, createRecognition } from '../lib/voice'
import {
  configureTTS,
  setCallbacks as setTTSCallbacks,
  queueSentence,
  speakFull,
  cancelSpeech,
  getIsSpeaking,
} from '../lib/advancedTTS'
import { splitIntoSentences } from '../lib/prosody'
import { VoiceActivityDetector } from '../lib/vad'
import type { SpeechRecognition } from '../types/speech'

export interface VoiceMessage {
  id: number
  role: 'user' | 'assistant'
  text: string
}

export interface AdvancedVoiceOptions {
  chatId: string | null
  voiceSettings: VoiceSettings
  personalityProfile: ProsodyProfile
  autoListen: boolean
  alwaysOn: boolean
  bargeIn: boolean
  enhancedProsody: boolean
  enabled: boolean // master switch
}

export interface AdvancedVoiceController {
  state: OrbState
  isListening: boolean
  isSpeaking: boolean
  liveTranscript: string
  aiText: string
  messages: VoiceMessage[]
  emotion: string
  volume: number // current mic volume 0-255
  error: string | null
  startListening: () => void
  stopListening: () => void
  startConversation: () => void
  stopAll: () => void
  interrupt: () => void
  replay: (text: string) => void
}

const THINKING_TIMEOUT = 30_000

export function useAdvancedVoice(opts: AdvancedVoiceOptions): AdvancedVoiceController {
  const [state, setState] = useState<OrbState>('idle')
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [liveTranscript, setLiveTranscript] = useState('')
  const [aiText, setAiText] = useState('')
  const [messages, setMessages] = useState<VoiceMessage[]>([])
  const [emotion, setEmotion] = useState('neutral')
  const [volume, setVolume] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Refs for async callbacks
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const bargeInVadRef = useRef<VoiceActivityDetector | null>(null)
  const alwaysOnVadRef = useRef<VoiceActivityDetector | null>(null)
  const optsRef = useRef(opts)
  const stateRef = useRef<OrbState>('idle')
  const msgIdRef = useRef(0)
  const mountedRef = useRef(true)
  const sentenceIndexRef = useRef(0)
  const sentenceCountRef = useRef(0)
  const startingRef = useRef(false)
  const bargeInActiveRef = useRef(false)
  const thinkingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Keep opts ref updated
  useEffect(() => {
    optsRef.current = opts
  })

  // Keep state ref updated
  useEffect(() => {
    stateRef.current = state
  }, [state])

  // Configure TTS engine on settings change
  useEffect(() => {
    configureTTS(opts.voiceSettings, opts.personalityProfile, opts.enhancedProsody)
  }, [opts.voiceSettings, opts.personalityProfile, opts.enhancedProsody])

  // Set TTS callbacks
  useEffect(() => {
    setTTSCallbacks({
      onStart: () => {
        if (!mountedRef.current) return
        setIsSpeaking(true)
        setState('speaking')
      },
      onSentence: (text, emo) => {
        if (!mountedRef.current) return
        setEmotion(emo)
      },
      onProsody: (data) => {
        if (!mountedRef.current) return
        setEmotion(data.emotion)
      },
      onEnd: () => {
        if (!mountedRef.current) return
        setIsSpeaking(false)
        setEmotion('neutral')
        // Don't go idle if barge-in already switched to listening
        if (stateRef.current === 'speaking' && !bargeInActiveRef.current) {
          setState('idle')
          // Auto-listen after natural pause
          if (optsRef.current.autoListen) {
            setTimeout(() => {
              if (mountedRef.current && optsRef.current.autoListen && !optsRef.current.alwaysOn) {
                startListening()
              }
            }, 300)
          }
        }
      },
      onBargeIn: () => {
        if (!mountedRef.current) return
        setIsSpeaking(false)
      },
      onError: () => {
        if (!mountedRef.current) return
        setIsSpeaking(false)
        setState('idle')
      },
    })
  }, [])

  // ---- Barge-in VAD ----
  // During TTS playback, listen for user speech to interrupt
  useEffect(() => {
    if (!opts.bargeIn || !opts.enabled) return
    if (state !== 'speaking') return

    // Start lightweight VAD during speech for barge-in
    const vad = new VoiceActivityDetector({
      minVolumeFloor: 25,
      speechStartFrames: 4,
      silenceDuration: 800,
      sampleInterval: 60,
    })

    bargeInVadRef.current = vad
    vad.start(
      () => {
        // User started speaking during AI speech → BARGE IN
        if (stateRef.current !== 'speaking') return
        bargeInActiveRef.current = true
        cancelSpeech()
        setIsSpeaking(false)
        setState('listening')
        setIsListening(true)

        // Start actual STT
        setTimeout(() => {
          bargeInActiveRef.current = false
          startListening()
        }, 200)
      },
      () => {}, // speech end handled by STT
      (vol) => setVolume(vol)
    ).catch(() => {})

    return () => {
      vad.stop()
      bargeInVadRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, opts.bargeIn, opts.enabled])

  // ---- Always-On VAD ----
  useEffect(() => {
    if (!opts.alwaysOn || !opts.enabled) return

    const vad = new VoiceActivityDetector({
      minVolumeFloor: 15,
      speechStartFrames: 3,
      silenceDuration: 1500,
      sampleInterval: 50,
    })

    alwaysOnVadRef.current = vad

    vad.start(
      () => {
        // Speech detected — start STT if idle
        if (stateRef.current === 'idle' && !startingRef.current) {
          startListening()
        }
      },
      () => {
        // Silence — STT handles the actual end
      },
      (vol) => setVolume(vol)
    ).catch(() => {
      setError('Microphone access needed for always-on mode')
    })

    return () => {
      vad.stop()
      alwaysOnVadRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.alwaysOn, opts.enabled])

  // ---- STT lifecycle ----
  const startListening = useCallback(() => {
    const o = optsRef.current
    if (startingRef.current || stateRef.current === 'listening') return
    if (!isSTTSupported()) {
      setError('Voice recognition is not supported in this browser. Try Chrome or Edge.')
      return
    }
    if (!o.enabled) return

    setError(null)
    cancelSpeech() // Stop any TTS

    const rec = createRecognition()
    if (!rec) {
      setError('Voice recognition is not supported in this browser.')
      return
    }

    startingRef.current = true
    recognitionRef.current = rec

    let finalTranscript = ''

    rec.onstart = () => {
      startingRef.current = false
      setIsListening(true)
      setState('listening')
    }

    rec.onresult = (e: any) => {
      let interim = ''
      let final = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) final += r[0].transcript
        else interim += r[0].transcript
      }
      if (final) {
        finalTranscript = final
        setLiveTranscript(finalTranscript)
      } else {
        setLiveTranscript(interim || finalTranscript)
      }
      if (final) {
        try { rec.stop() } catch {}
        handleUserMessage(final.trim())
      }
    }

    rec.onerror = (e: any) => {
      startingRef.current = false
      setIsListening(false)
      const errKind = e.error as string
      if (errKind === 'not-allowed' || errKind === 'service-not-allowed') {
        setError('Microphone access denied. Please grant mic permission.')
      } else if (errKind === 'network') {
        setError('Network issue. Please check your connection.')
      }
    }

    rec.onend = () => {
      startingRef.current = false
      setIsListening(false)
      setState(prev => (prev === 'listening' ? 'idle' : prev))
    }

    try {
      rec.start()
    } catch {
      startingRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stopListening = useCallback(() => {
    startingRef.current = false
    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch {}
      recognitionRef.current = null
    }
    setIsListening(false)
    setState('idle')
  }, [])

  // ---- Message handling with streaming TTS ----
  const handleUserMessage = useCallback(async (text: string) => {
    const cid = optsRef.current.chatId
    if (!cid || !text) {
      setState('idle')
      return
    }

    setLiveTranscript('')
    setAiText('')
    setState('thinking')
    msgIdRef.current++
    const userMsg = { id: msgIdRef.current, role: 'user' as const, text }
    setMessages(prev => [...prev, userMsg])

    // Reset sentence tracking
    sentenceIndexRef.current = 0
    sentenceCountRef.current = 0

    // Safety timeout
    thinkingTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setState('idle')
        setError('Response timed out. Please try again.')
        msgIdRef.current++
        setMessages(prev => [...prev, {
          id: msgIdRef.current,
          role: 'assistant',
          text: 'Sorry, I timed out. Please try again.',
        }])
      }
    }, THINKING_TIMEOUT)

    try {
      const fullText = await api.streamChat(cid, text, {
        onDelta: (chunk) => {
          if (mountedRef.current) setAiText(prev => prev + chunk)
        },
        onSentence: (sentence) => {
          if (!mountedRef.current) return
          if (optsRef.current.voiceSettings) {
            sentenceIndexRef.current++
            sentenceCountRef.current = sentenceIndexRef.current
            // Stream TTS — speak each sentence as it arrives
            queueSentence(sentence, sentenceIndexRef.current - 1, 0)
          }
        },
        onDone: (final) => {
          if (thinkingTimeoutRef.current) clearTimeout(thinkingTimeoutRef.current)
          if (!mountedRef.current) return
          msgIdRef.current++
          setMessages(prev => [...prev, {
            id: msgIdRef.current,
            role: 'assistant',
            text: final,
          }])
          setAiText('')

          // If no sentences were streamed (e.g., short response), speak full text
          if (sentenceCountRef.current === 0) {
            speakFull(final)
          }
        },
      })
      return fullText
    } catch {
      if (thinkingTimeoutRef.current) clearTimeout(thinkingTimeoutRef.current)
      if (!mountedRef.current) return
      setState('idle')
      setError('Network issue. Please try again.')
      msgIdRef.current++
      setMessages(prev => [...prev, {
        id: msgIdRef.current,
        role: 'assistant',
        text: 'Sorry, I had trouble responding. Please try again.',
      }])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- Public API ----
  const startConversation = useCallback(() => {
    if (optsRef.current.alwaysOn) {
      // Always-on mode — VAD handles starting
      return
    }
    startListening()
  }, [startListening])

  const stopAll = useCallback(() => {
    stopListening()
    cancelSpeech()
    setState('idle')
    setIsSpeaking(false)
    setLiveTranscript('')
    setAiText('')
  }, [stopListening])

  const interrupt = useCallback(() => {
    cancelSpeech()
    setIsSpeaking(false)
    setState('idle')
  }, [])

  const replay = useCallback((text: string) => {
    cancelSpeech()
    setState('speaking')
    speakFull(text)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (recognitionRef.current) {
        try { recognitionRef.current.abort() } catch {}
      }
      cancelSpeech()
      if (bargeInVadRef.current) {
        bargeInVadRef.current.stop()
      }
      if (alwaysOnVadRef.current) {
        alwaysOnVadRef.current.stop()
      }
      if (thinkingTimeoutRef.current) {
        clearTimeout(thinkingTimeoutRef.current)
      }
    }
  }, [])

  return {
    state,
    isListening,
    isSpeaking,
    liveTranscript,
    aiText,
    messages,
    emotion,
    volume,
    error,
    startListening,
    stopListening,
    startConversation,
    stopAll,
    interrupt,
    replay,
  }
}
