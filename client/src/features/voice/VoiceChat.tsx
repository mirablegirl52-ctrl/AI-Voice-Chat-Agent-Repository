import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import AIOrb from '../../components/AIOrb'
import Waveform from '../../components/Waveform'
import GlassCard from '../../components/GlassCard'
import { MicIcon, MicOffIcon, VolumeIcon, VolumeOffIcon, StopIcon, ChatBubbleIcon, RefreshIcon } from '../../components/icons'
import { useAuthStore } from '../../store/authStore'
import { useVoiceSettingsStore } from '../../store/voiceSettingsStore'
import { usePersonalityStore } from '../../store/personalityStore'
import { useAdvancedVoice } from '../../hooks/useAdvancedVoice'
import { api } from '../../lib/api'

const PERSONALITY_PROFILES: Record<string, 'warm' | 'steady' | 'expressive' | 'precise' | 'patient'> = {
  friendly: 'warm',
  professional: 'steady',
  creative: 'expressive',
  coding: 'precise',
  teacher: 'patient',
}

export default function VoiceChat() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const voiceSettings = useVoiceSettingsStore((s) => s.settings)
  const { alwaysOn, bargeIn, enhancedProsody, setAlwaysOn, setBargeIn } = useVoiceSettingsStore()
  const personality = usePersonalityStore((s) => s.personality)

  const [isMicOn, setIsMicOn] = useState(true)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [autoListen, setAutoListen] = useState(true)
  const [chatId, setChatId] = useState<string | null>(null)
  const [bargeInFlash, setBargeInFlash] = useState(false)
  const chatIdRef = useRef<string | null>(null)

  // Create chat on mount
  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    api.createChat('Voice chat', personality).then(({ chat }) => {
      if (!cancelled) {
        setChatId(chat.id)
        chatIdRef.current = chat.id
      }
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const prosodyProfile = PERSONALITY_PROFILES[personality] || 'warm'

  const voice = useAdvancedVoice({
    chatId,
    voiceSettings,
    personalityProfile: prosodyProfile,
    autoListen,
    alwaysOn,
    bargeIn: bargeIn && isSpeakerOn,
    enhancedProsody,
    enabled: isMicOn && isSpeakerOn,
  })

  // Waveform mode based on voice state
  const waveformMode = voice.state === 'listening' ? 'listening' as const
    : voice.state === 'speaking' ? 'speaking' as const
    : 'idle' as const

  // Auto-dismiss error
  useEffect(() => {
    if (!voice.error) return
    const t = setTimeout(() => {}, 5000)
    return () => clearTimeout(t)
  }, [voice.error])

  // Scroll
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [voice.messages, voice.aiText])

  // Handlers
  const handleMicToggle = () => {
    if (voice.isListening) {
      voice.stopListening()
    } else {
      voice.startListening()
    }
  }

  const handleMuteToggle = () => {
    const newMuted = isMicOn
    setIsMicOn(!newMuted)
    if (newMuted) voice.stopListening()
  }

  const handleSpeakerToggle = () => {
    const newOn = !isSpeakerOn
    setIsSpeakerOn(newOn)
    if (!newOn) voice.interrupt()
  }

  const handleReplay = (text: string) => {
    if (!isSpeakerOn) return
    voice.replay(text)
  }

  // Barge-in visual flash
  useEffect(() => {
    if (voice.state === 'listening' && voice.isSpeaking === false) {
      // Could trigger flash — kept subtle
    }
  }, [voice.state, voice.isSpeaking])

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
        <h2 className="text-white/80 font-medium text-sm">
          {alwaysOn ? 'Hands-Free Voice' : 'Voice Chat'}
        </h2>
        <button
          onClick={() => chatId && navigate(`/app/text/${chatId}`)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10"
        >
          <ChatBubbleIcon className="w-4 h-4 text-white/60" />
        </button>
      </div>

      {/* Error banner */}
      <AnimatePresence>
        {voice.error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full max-w-md mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm text-center"
          >
            {voice.error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Advanced features badges */}
      <div className="flex items-center gap-2 mb-2">
        {bargeIn && isSpeakerOn && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
            Barge-in
          </span>
        )}
        {alwaysOn && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-300 border border-green-500/20 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Always-on
          </span>
        )}
        {voice.emotion !== 'neutral' && voice.state === 'speaking' && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 capitalize">
            {voice.emotion}
          </span>
        )}
      </div>

      {/* Orb area */}
      <div className="flex-1 flex items-center justify-center w-full">
        <AIOrb
          state={voice.state}
          size={200}
          emotion={voice.emotion}
          bargeIn={bargeInFlash}
          onClick={voice.isListening ? voice.stopListening : (isMicOn ? voice.startListening : undefined)}
        />
      </div>

      {/* Waveform — reacts to both listening and speaking */}
      <div className="my-4">
        <Waveform
          mode={waveformMode}
          bars={28}
          height={40}
          emotion={voice.emotion}
          volume={voice.volume}
        />
      </div>

      {/* Live transcript / AI response */}
      <AnimatePresence>
        {(voice.liveTranscript || voice.aiText) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="w-full max-w-md mb-4"
          >
            {voice.liveTranscript && (
              <GlassCard className="p-4 mb-2">
                <p className="text-sm text-cyan-neon">{voice.liveTranscript}</p>
              </GlassCard>
            )}
            {voice.aiText && (
              <GlassCard className="p-4" strong glow>
                <p className="text-sm text-white/90 leading-relaxed">{voice.aiText}</p>
              </GlassCard>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex items-center gap-4 pb-4">
        {/* Mic on/off */}
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
            voice.isListening
              ? 'bg-ai-gradient shadow-glow'
              : isMicOn
              ? 'bg-white/10 border-2 border-ai-500/50 hover:border-ai-400'
              : 'bg-white/5 border-2 border-white/10 opacity-40'
          }`}
        >
          {voice.isListening ? <StopIcon className="w-6 h-6 text-white" /> : <MicIcon className="w-6 h-6 text-ai-400" />}
        </motion.button>

        {/* Speaker on/off */}
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

      {/* Mode toggles */}
      <div className="flex items-center gap-2 mb-2">
        {/* Auto-listen */}
        <button
          onClick={() => setAutoListen(!autoListen)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            autoListen ? 'bg-ai-500/20 text-ai-300 border border-ai-500/30' : 'bg-white/5 text-white/40 border border-white/10'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${autoListen ? 'bg-ai-400 animate-pulse' : 'bg-white/30'}`} />
          Auto-listen
        </button>

        {/* Always-on */}
        <button
          onClick={() => setAlwaysOn(!alwaysOn)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            alwaysOn ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-white/5 text-white/40 border border-white/10'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${alwaysOn ? 'bg-green-400 animate-pulse' : 'bg-white/30'}`} />
          Hands-free
        </button>

        {/* Barge-in */}
        <button
          onClick={() => setBargeIn(!bargeIn)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            bargeIn ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-white/5 text-white/40 border border-white/10'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${bargeIn ? 'bg-cyan-400 animate-pulse' : 'bg-white/30'}`} />
          Interrupt
        </button>
      </div>

      {/* Conversation log */}
      {voice.messages.length > 0 && (
        <div ref={scrollRef} className="w-full max-w-md max-h-40 overflow-y-auto space-y-2 px-1">
          <AnimatePresence>
            {voice.messages.slice(-6).map((m) => (
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
