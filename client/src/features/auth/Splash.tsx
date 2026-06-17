import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Particles from '../../components/Particles'
import { useAuthStore } from '../../store/authStore'

export default function Splash() {
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => Math.min(100, p + 4))
    }, 60)
    const timer = setTimeout(() => {
      navigate(token ? '/app/home' : '/onboarding')
    }, 2400)
    return () => {
      clearInterval(interval)
      clearTimeout(timer)
    }
  }, [navigate, token])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative">
      <Particles count={50} />

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative"
      >
        {/* Animated logo orb */}
        <div className="relative w-32 h-32 mb-8">
          <motion.div
            className="absolute inset-0 rounded-full bg-ai-gradient"
            animate={{ scale: [1, 1.1, 1], rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ boxShadow: '0 0 60px rgba(99,102,241,0.6)' }}
          />
          <motion.div
            className="absolute inset-2 rounded-full bg-deep/60 backdrop-blur-md flex items-center justify-center"
            animate={{ rotate: -360 }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          >
            <svg viewBox="0 0 48 48" className="w-12 h-12">
              <defs>
                <linearGradient id="splashG" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="50%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
              {/* Sound wave icon */}
              <g stroke="url(#splashG)" strokeWidth="2.5" strokeLinecap="round" fill="none">
                <line x1="10" y1="18" x2="10" y2="30" />
                <line x1="17" y1="13" x2="17" y2="35" />
                <line x1="24" y1="8" x2="24" y2="40" />
                <line x1="31" y1="13" x2="31" y2="35" />
                <line x1="38" y1="18" x2="38" y2="30" />
              </g>
            </svg>
          </motion.div>
        </div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="text-5xl font-black text-gradient tracking-tight mb-2"
      >
        Aria
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-white/50 text-sm tracking-widest uppercase mb-12"
      >
        AI Voice Assistant
      </motion.p>

      {/* Loading bar */}
      <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-ai-gradient"
          style={{ width: `${progress}%` }}
        />
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-white/30 text-xs mt-4"
      >
        Initializing…
      </motion.p>
    </div>
  )
}
