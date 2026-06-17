import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import AIOrb, { type OrbState } from '../../components/AIOrb'
import Waveform from '../../components/Waveform'
import GlassCard from '../../components/GlassCard'
import { MicIcon, MicOffIcon, VolumeIcon, VolumeOffIcon, StopIcon, ChatBubbleIcon, RefreshIcon } from '../../components/icons'
import { useAuthStore } from '../../store/authStore'
import { useVoiceSettingsStore } from '../../store/voiceSettingsStore'
import { usePersonalityStore } from '../../store/personalityStore'
import { api } from '../../lib/api'
import {
  speak,
  stopSpeaking,
  createRecognition,
  isSTTSupported,
  initVoiceLoading,
} from '../../lib/voice'
import type { SpeechRecognition } from '../../types/speech'

interface Transcript {
  id: number
  role: 'user' | 'assistant'
  text: string
}

type ErrorKind = 'stt-unsupported' | 'mic-denied' | 'no-speech' | 'network' | 'generic' | null

const ERROR_MESSAGES: Record<Exclude<ErrorKind, null>, string> = {
  'stt-unsupported': 'Voice recognition is not supported in this browser. Try Chrome or Edge.',
  'mic-denied': 'Microphone access denied. Please grant mic permission in your browser settings.',
  'no-speech': "I didn't hear anything. Try speaking again.",
  network: 'Network issue. Please check your connection and try again.',
  generic: 'Something went wrong. Please try again.',
}

const THINKING_TIMEOUT = 30_000 // 30s safety timeout

export default function VoiceChat() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const voiceSettings = useVoiceSettingsStore((s) => s.settings)
  const personality = usePersonalityStore((s) => s.personality)

  const [orbState, setOrbState] = useState<OrbState>('idle')
  const [transcript, setTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isMicOn, setIsMicOn] = useState(true) // mic enabled (muting blocks STT)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [autoListen, setAutoListen] = useState(true) // continuous conversation
  const [messages, setMessages] = useState<Transcript[]>([])
  const [chatId, setChatId] = useState<string | null>(null)
  const [aiText, setAiText] = useState('')
  const [error, setError] = useState<ErrorKind>(null)

  // Refs for state that callbacks need to read without going stale
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const chatIdRef = useRef<string | null>(null)
  const isListeningRef = useRef(false)
  const isSpeakerOnRef = useRef(true)
  const voiceSettingsRef = useRef(voiceSettings)
  const autoListenRef = useRef(autoListen)
  const startingRef = useRef(false) // guard against double-tap
  const shouldRestartRef = useRef(false) // manual stop vs auto
  const scrollRef = useRef<HTMLDivElement>(null)
  const msgIdRef = useRef(0)
  const mountedRef = useRef(true)

  // Keep refs in sync with state
  useEffect(() => { chatIdRef.current = chatId }, [chatId])
  useEffect(() => { isListeningRef.current = isListening }, [isListening])
  useEffect(() => { isSpeakerOnRef.current = isSpeakerOn }, [isSpeakerOn])
  useEffect(() => { voiceSettingsRef.current = voiceSettings }, [voiceSettings])
  useEffect(() => { autoListenRef.current = autoListen }, [autoListen])

  // Initialize voice loading + chat on mount
  useEffect(() => {
    mountedRef.current = true
    initVoiceLoading()
    if (!user?.id) return
    let cancelled = false
    api.createChat('Voice chat', personality).then(({ chat }) => {
      if (!cancelled && mountedRef.current) setChatId(chat.id)
    })
    return () => {
      mountedRef.current = false
      cancelled = true
      // Cleanup STT + TTS on unmount
      if (recognitionRef.current) {
        try { recognitionRef.current.abort() } catch {}
        recognitionRef.current = null
      }
      stopSpeaking()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  // ---- STT lifecycle ----

  const startListening = useCallback(() => {
    // Guard: double-tap, unsupported, mic off, or already listening
    if (startingRef.current || isListeningRef.current) return
    if (!isSTTSupported()) {
      setError('stt-unsupported')
      return
    }
    if (!isMicOn) return // mic is muted

    setError(null)
    stopSpeaking()
    const rec = createRecognition()
    if (!rec) {
      setError('stt-unsupported')
      return
    }

    startingRef.current = true
    shouldRestartRef.current = false
    recognitionRef.current = rec

    let finalTranscript = ''

    rec.onstart = () => {
      startingRef.current = false
      setIsListening(true)
      setOrbState('listening')
    }

    rec.onresult = (e: any) => {
      // Accumulate all results for robustness (fixes #14)
      let interim = ''
      let final = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) final += r[0].transcript
        else interim += r[0].transcript
      }
      if (final) {
        finalTranscript = final
        setTranscript(finalTranscript)
      } else {
        setTranscript(interim || finalTranscript)
      }
      if (final) {
        // Stop recognition before sending (prevents double-fire)
        shouldRestartRef.current = false
        try { rec.stop() } catch {}
        handleUserMessage(final.trim())
      }
    }

    rec.onerror = (e: any) => {
      startingRef.current = false
      setIsListening(false)
      const errKind = e.error as string
      if (errKind === 'not-allowed' || errKind === 'service-not-allowed') {
        setError('mic-denied')
      } else if (errKind === 'no-speech') {
        // Silent — don't bother user for silence timeout
      } else if (errKind === 'network') {
        setError('network')
      }
      // onend will fire after onerror and reset orb to idle
    }

    rec.onend = () => {
      startingRef.current = false
      setIsListening(false)
      // Only set idle if we're not transitioning to thinking or speaking
      // (handleUserMessage sets thinking before this fires for final results)
      // If shouldRestart is false (manual stop or final result), go idle
      setOrbState((prev) => {
        if (prev === 'listening') return 'idle'
        return prev // keep thinking/speaking states
      })
    }

    try {
      rec.start()
    } catch {
      startingRef.current = false
      // Recognition may already be started — ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMicOn])

  const stopListening = useCallback(() => {
    shouldRestartRef.current = false
    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch {}
      recognitionRef.current = null
    }
    setIsListening(false)
    setOrbState('idle')
  }, [])

  // ---- Message handling (reads from refs, not stale state) ----

  const handleUserMessage = useCallback(async (text: string) => {
    const cid = chatIdRef.current
    if (!cid) {
      setError('generic')
      setOrbState('idle')
      return
    }
    if (!text) {
      setOrbState('idle')
      return
    }

    setTranscript('')
    setAiText('')
    setOrbState('thinking')
    msgIdRef.current++
    setMessages((prev) => [...prev, { id: msgIdRef.current, role: 'user', text }])

    // Safety timeout: if thinking takes >30s, bail out
    const timeout = setTimeout(() => {
      if (mountedRef.current) {
        setOrbState('idle')
        setError('network')
        msgIdRef.current++
        setMessages((prev) => [...prev, { id: msgIdRef.current, role: 'assistant', text: 'Sorry, I timed out. Please try again.' }])
      }
    }, THINKING_TIMEOUT)

    try {
      const fullText = await api.streamChat(cid, text, {
        onDelta: (chunk) => {
          if (mountedRef.current) setAiText((prev) => prev + chunk)
        },
        onDone: (final) => {
          clearTimeout(timeout)
          if (!mountedRef.current) return
          msgIdRef.current++
          setMessages((prev) => [...prev, { id: msgIdRef.current, role: 'assistant', text: final }])
          setAiText('')

          if (isSpeakerOnRef.current) {
            setOrbState('speaking')
            speak(final, voiceSettingsRef.current, {
              onStart: () => { if (mountedRef.current) setOrbState('speaking') },
              onEnd: () => {
                if (!mountedRef.current) return
                setOrbState('idle')
                // Auto-listen: restart listening for continuous conversation
                if (autoListenRef.current) {
                  setTimeout(() => {
                    if (mountedRef.current && autoListenRef.current) {
                      startListening()
                    }
                  }, 400)
                }
              },
              onError: () => {
                if (!mountedRef.current) return
                setOrbState('idle')
                if (autoListenRef.current) {
                  setTimeout(() => startListening(), 400)
                }
              },
            })
          } else {
            setOrbState('idle')
            if (autoListenRef.current) {
              setTimeout(() => startListening(), 400)
            }
          }
        },
      })
    } catch {
      clearTimeout(timeout)
      if (!mountedRef.current) return
      setOrbState('idle')
      setError('network')
      msgIdRef.current++
      setMessages((prev) => [...prev, { id: msgIdRef.current, role: 'assistant', text: 'Sorry, I had trouble responding. Please try again.' }])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Scroll to bottom on new messages / AI text
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, aiText])

  // Auto-dismiss error after 5s
  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => setError(null), 5000)
    return () => clearTimeout(t)
  }, [error])

  // Handlers for control buttons
  const handleMicToggle = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  const handleMuteToggle = () => {
    const newMuted = isMicOn
    setIsMicOn(!newMuted)
    if (newMuted) {
      // Was on, turning off → stop listening
      stopListening()
    }
  }

  const handleSpeakerToggle = () => {
    const newOn = !isSpeakerOn
    setIsSpeakerOn(newOn)
    if (!newOn) stopSpeaking()
  }

  const handleReplay = (text: string) => {
    if (!isSpeakerOn) return
    setOrbState('speaking')
    speak(text, voiceSettingsRef.current, {
      onEnd: () => setOrbState('idle'),
    })
  }

  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-160px)] relative">
      {/* Top bar */}
      <div className="w-full flex items-center justify-between mb-4">
        <button
          onClick={() => navigate('/app/home')}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10"
        >
          <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <h2 className="text-white/80 font-medium text-sm">Voice Chat</h2>
        <button
          onClick={() => chatId && navigate(`/app/text/${chatId}`)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10"
        >
          <ChatBubbleIcon className="w-4 h-4 text-white/60" />
        </button>
      </div>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full max-w-md mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm text-center"
          >
            {ERROR_MESSAGES[error]}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Orb area */}
      <div className="flex-1 flex items-center justify-center w-full">
        <AIOrb
          state={orbState}
          size={200}
          onClick={isListening ? stopListening : (isMicOn ? startListening : undefined)}
        />
      </div>

      {/* Waveform */}
      <div className="my-4">
        <Waveform active={isListening} bars={28} height={40} />
      </div>

      {/* Live transcript */}
      <AnimatePresence>
        {(transcript || aiText) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="w-full max-w-md mb-4"
          >
            {transcript && (
              <GlassCard className="p-4 mb-2">
                <p className="text-sm text-cyan-neon">{transcript}</p>
              </GlassCard>
            )}
            {aiText && (
              <GlassCard className="p-4" strong glow>
                <p className="text-sm text-white/90 leading-relaxed">{aiText}</p>
              </GlassCard>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex items-center gap-4 pb-4">
        {/* Mic on/off (mutes STT entirely) */}
        <button
          onClick={handleMuteToggle}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            !isMicOn ? 'bg-red-500/20 border border-red-500/30' : 'bg-white/5 border border-white/10'
          }`}
          title={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
        >
          {isMicOn ? <MicIcon className="w-5 h-5 text-white/60" /> : <MicOffIcon className="w-5 h-5 text-red-400" />}
        </button>

        {/* Main mic button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleMicToggle}
          disabled={!isMicOn}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-xl ${
            isListening
              ? 'bg-ai-gradient shadow-glow'
              : isMicOn
              ? 'bg-white/10 border-2 border-ai-500/50 hover:border-ai-400'
              : 'bg-white/5 border-2 border-white/10 opacity-40'
          }`}
        >
          {isListening ? <StopIcon className="w-6 h-6 text-white" /> : <MicIcon className="w-6 h-6 text-ai-400" />}
        </motion.button>

        {/* Speaker on/off (mutes TTS) */}
        <button
          onClick={handleSpeakerToggle}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            !isSpeakerOn ? 'bg-red-500/20 border border-red-500/30' : 'bg-white/5 border border-white/10'
          }`}
          title={isSpeakerOn ? 'Mute speaker' : 'Unmute speaker'}
        >
          {isSpeakerOn ? (
            <VolumeIcon className="w-5 h-5 text-white/60" />
          ) : (
            <VolumeOffIcon className="w-5 h-5 text-red-400" />
          )}
        </button>
      </div>

      {/* Auto-listen toggle */}
      <button
        onClick={() => setAutoListen(!autoListen)}
        className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all mb-2 ${
          autoListen ? 'bg-ai-500/20 text-ai-300 border border-ai-500/30' : 'bg-white/5 text-white/40 border border-white/10'
        }`}
      >
        <span className={`w-2 h-2 rounded-full ${autoListen ? 'bg-ai-400 animate-pulse' : 'bg-white/30'}`} />
        {autoListen ? 'Auto-listen ON' : 'Auto-listen OFF'}
      </button>

      {/* Conversation log (compact) */}
      {messages.length > 0 && (
        <div ref={scrollRef} className="w-full max-w-md max-h-40 overflow-y-auto space-y-2 px-1">
          <AnimatePresence>
            {messages.slice(-6).map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`text-sm px-3 py-2 rounded-xl group ${
                  m.role === 'user'
                    ? 'bg-ai-500/10 border border-ai-500/20 text-ai-100 ml-auto text-right'
                    : 'bg-white/5 border border-white/10 text-white/70 flex items-start gap-2'
                }`}
              >
                <span className="flex-1">{m.text}</span>
                {m.role === 'assistant' && isSpeakerOn && (
                  <button
                    onClick={() => handleReplay(m.text)}
                    className="opacity-0 group-hover:opacity-100 transition flex-shrink-0 mt-0.5"
                    title="Replay"
                  >
                    <RefreshIcon className="w-3.5 h-3.5 text-white/40 hover:text-white/70" />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
