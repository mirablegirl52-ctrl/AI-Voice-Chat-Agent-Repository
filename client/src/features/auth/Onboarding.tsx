import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Background from '../../components/Background'
import AIOrb from '../../components/AIOrb'
import { MicIcon, VolumeIcon, SparkleIcon, ChatBubbleIcon } from '../../components/icons'

const slides = [
  {
    icon: <SparkleIcon className="w-10 h-10 text-cyan-neon" />,
    title: 'Meet Aria',
    subtitle: 'Your intelligent AI voice assistant',
    description: 'Aria listens, understands, and responds with natural conversation. Powered by advanced AI.',
  },
  {
    icon: <MicIcon className="w-10 h-10 text-ai-400" />,
    title: 'Just Speak',
    subtitle: 'Voice-first interaction',
    description: 'Tap the orb and speak naturally. Aria transcribes your words and responds instantly — hands-free.',
  },
  {
    icon: <ChatBubbleIcon className="w-10 h-10 text-purple-neon" />,
    title: 'Smart Conversations',
    subtitle: 'Memory, personality & context',
    description: 'Aria remembers your chats, adapts to your style, and can be tuned to 5 different personalities.',
  },
  {
    icon: <VolumeIcon className="w-10 h-10 text-cyan-neon" />,
    title: 'Natural Voice',
    subtitle: 'Multiple voices & accents',
    description: 'Choose from a range of natural voices, accents, and adjustable speed, pitch, and volume.',
  },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [requestedPermission, setRequestedPermission] = useState(false)

  const isLast = step === slides.length - 1

  const handleNext = async () => {
    if (isLast) {
      // Request mic permission on the last slide
      if (!requestedPermission) {
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true })
          setRequestedPermission(true)
        } catch {
          // user denied — proceed anyway
        }
      }
      navigate('/login')
      return
    }
    setStep((s) => s + 1)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative">
      <Background count={3} />

      {/* Skip button */}
      <button
        onClick={() => navigate('/login')}
        className="absolute top-6 right-6 text-white/40 hover:text-white/80 text-sm transition-colors z-10"
      >
        Skip
      </button>

      <div className="max-w-md w-full">
        {/* Orb */}
        <div className="flex justify-center mb-10">
          <AIOrb state="idle" size={160} showLabel={false} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.4 }}
            className="text-center"
          >
            <div className="flex justify-center mb-6">{slides[step].icon}</div>
            <h2 className="text-3xl font-bold text-white mb-2">{slides[step].title}</h2>
            <p className="text-lg text-gradient font-semibold mb-4">{slides[step].subtitle}</p>
            <p className="text-white/60 leading-relaxed">{slides[step].description}</p>
          </motion.div>
        </AnimatePresence>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-10 mb-8">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step ? 'w-8 bg-ai-gradient' : 'w-2 bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleNext}
            className="btn-glow py-4 text-base"
          >
            {isLast ? 'Start Talking' : 'Continue'}
          </button>
          {!isLast && (
            <button
              onClick={() => navigate('/login')}
              className="py-3 text-white/50 hover:text-white/80 text-sm transition-colors"
            >
              Already have an account? Sign in
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
