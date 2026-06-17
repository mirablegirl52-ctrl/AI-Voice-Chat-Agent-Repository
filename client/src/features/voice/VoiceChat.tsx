import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import AIOrb, { type OrbState } from '../../components/AIOrb'
import Waveform from '../../components/Waveform'
import GlassCard from '../../components/GlassCard'
import { MicIcon, MicOffIcon, VolumeIcon, VolumeOffIcon, StopIcon, ChatBubbleIcon } from '../../components/icons'
import { useAuthStore } from '../../store/authStore'
import { useVoiceSettingsStore } from '../../store/voiceSettingsStore'
import { usePersonalityStore } from '../../store/personalityStore'
import { api } from '../../lib/api'
import { speak, stopSpeaking, createRecognition, isSTTSupported } from '../../lib/voice'
import type { SpeechRecognition } from '../../types/speech'

interface Transcript {
  role: 'user' | 'assistant'
  text: string
}

export default function VoiceChat() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const voiceSettings = useVoiceSettingsStore((s) => s.settings)
  const personality = usePersonalityStore((s) => s.personality)
  const [orbState, setOrbState] = useState<OrbState>('idle')
  const [transcript, setTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [messages, setMessages] = useState<Transcript[]>([])
  const [chatId, setChatId] = useState<string | null>(null)
  const [aiText, setAiText] = useState('')
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Initialize a chat on mount (only once)
  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    api.createChat('Voice chat', personality).then(({ chat }) => {
      if (!cancelled) setChatId(chat.id)
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const startListening = useCallback(() => {
    if (!isSTTSupported() || isListening) return
    stopSpeaking()
    const rec = createRecognition()
    if (!rec) return
    recognitionRef.current = rec

    rec.onresult = (e: any) => {
      const result = e.results[e.resultIndex]
      const text = result[0].transcript
      setTranscript(text)
      if (result.isFinal) {
        handleUserMessage(text)
      }
    }
    rec.onend = () => {
      setIsListening(false)
      setOrbState('thinking')
    }
    rec.onerror = () => {
      setIsListening(false)
      setOrbState('idle')
    }
    rec.onstart = () => {
      setIsListening(true)
      setOrbState('listening')
    }
    rec.start()
  }, [isListening])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setIsListening(false)
  }, [])

  const handleUserMessage = useCallback(
    async (text: string) => {
      if (!chatId) return
      setMessages((prev) => [...prev, { role: 'user', text }])
      setTranscript('')
      setOrbState('thinking')
      setAiText('')

      try {
        const fullText = await api.streamChat(chatId, text, {
          onDelta: (chunk) => {
            setAiText((prev) => prev + chunk)
          },
          onDone: (final) => {
            setMessages((prev) => [...prev, { role: 'assistant', text: final }])
            setOrbState('speaking')
            if (isSpeakerOn && !isMuted) {
              speak(final, voiceSettings, {
                onStart: () => setOrbState('speaking'),
                onEnd: () => setOrbState('idle'),
              })
            } else {
              setOrbState('idle')
            }
          },
        })
      } catch {
        setOrbState('idle')
        setMessages((prev) => [...prev, { role: 'assistant', text: 'Sorry, I had trouble responding. Please try again.' }])
      }
    },
    [chatId, isSpeakerOn, isMuted, voiceSettings]
  )

  // Scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, aiText])

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

      {/* Orb area */}
      <div className="flex-1 flex items-center justify-center w-full">
        <AIOrb state={orbState} size={200} />
      </div>

      {/* Waveform */}
      <div className="my-4">
        <Waveform active={isListening} bars={28} height={40} />
      </div>

      {/* Live transcript */}
      {(transcript || aiText) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
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

      {/* Controls */}
      <div className="flex items-center gap-4 pb-4">
        {/* Mute */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            isMuted ? 'bg-red-500/20 border border-red-500/30' : 'bg-white/5 border border-white/10'
          }`}
        >
          {isMuted ? <MicOffIcon className="w-5 h-5 text-red-400" /> : <MicIcon className="w-5 h-5 text-white/60" />}
        </button>

        {/* Main mic button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={isListening ? stopListening : startListening}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-xl ${
            isListening
              ? 'bg-ai-gradient shadow-glow'
              : 'bg-white/10 border-2 border-ai-500/50 hover:border-ai-400'
          }`}
        >
          {isListening ? <StopIcon className="w-6 h-6 text-white" /> : <MicIcon className="w-6 h-6 text-ai-400" />}
        </motion.button>

        {/* Speaker */}
        <button
          onClick={() => {
            setIsSpeakerOn(!isSpeakerOn)
            if (isSpeakerOn) stopSpeaking()
          }}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            !isSpeakerOn ? 'bg-red-500/20 border border-red-500/30' : 'bg-white/5 border border-white/10'
          }`}
        >
          {isSpeakerOn ? (
            <VolumeIcon className="w-5 h-5 text-white/60" />
          ) : (
            <VolumeOffIcon className="w-5 h-5 text-red-400" />
          )}
        </button>
      </div>

      {/* Conversation log (compact) */}
      {messages.length > 0 && (
        <div ref={scrollRef} className="w-full max-w-md max-h-40 overflow-y-auto space-y-2 px-1">
          <AnimatePresence>
            {messages.slice(-6).map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-sm px-3 py-2 rounded-xl ${
                  m.role === 'user'
                    ? 'bg-ai-500/10 border border-ai-500/20 text-ai-100 ml-auto text-right'
                    : 'bg-white/5 border border-white/10 text-white/70'
                }`}
              >
                {m.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
