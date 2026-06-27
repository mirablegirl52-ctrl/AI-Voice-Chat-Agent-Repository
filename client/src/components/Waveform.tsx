import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { acquireMicAnalyser, releaseMicAnalyser } from '../lib/voice'

type WaveformMode = 'idle' | 'listening' | 'speaking'

interface Props {
  /** What mode to visualize */
  mode?: WaveformMode
  /** Legacy: when true, visualizes live mic input */
  active?: boolean
  bars?: number
  height?: number
  /** Emotion affects the waveform color/intensity during speaking */
  emotion?: string
  /** Current volume from VAD (0-255) */
  volume?: number
}

// Emotion → waveform intensity multiplier and color tint
const EMOTION_PROFILES: Record<string, { intensity: number; speed: number }> = {
  neutral:     { intensity: 1.0,  speed: 1.0 },
  question:    { intensity: 1.15, speed: 1.2 },
  excited:     { intensity: 1.35, speed: 1.5 },
  thoughtful:  { intensity: 0.75, speed: 0.7 },
  empathetic:  { intensity: 0.85, speed: 0.8 },
  playful:     { intensity: 1.2,  speed: 1.3 },
}

/**
 * Waveform — adaptive visualizer that reacts to three states:
 * - listening: real-time mic levels via shared AnalyserNode
 * - speaking: procedural wave based on emotion/prosody (AI "speaks" visually)
 * - idle: gentle ambient shimmer
 */
export default function Waveform({
  mode = 'idle',
  active: legacyActive,
  bars = 28,
  height = 40,
  emotion = 'neutral',
  volume = 0,
}: Props) {
  // Support legacy `active` prop for backward compat
  const effectiveMode: WaveformMode = legacyActive !== undefined && legacyActive ? 'listening' : mode

  const [levels, setLevels] = useState<number[]>(() => new Array(bars).fill(0.1))
  const rafRef = useRef<number>(0)
  const emotionRef = useRef(emotion)
  const volumeRef = useRef(volume)

  useEffect(() => { emotionRef.current = emotion }, [emotion])
  useEffect(() => { volumeRef.current = volume }, [volume])

  useEffect(() => {
    let cancelled = false

    async function setup() {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)

      if (effectiveMode === 'listening') {
        // Real mic input
        const analyser = await acquireMicAnalyser()
        if (cancelled) {
          releaseMicAnalyser()
          return
        }
        if (!analyser) {
          idleAnimate()
          return
        }

        const buffer = new Uint8Array(analyser.frequencyBinCount)
        const tick = () => {
          if (cancelled) return
          analyser.getByteFrequencyData(buffer)
          const step = Math.max(1, Math.floor(buffer.length / bars))
          const next = Array.from({ length: bars }, (_, i) => {
            const val = buffer[i * step] / 255
            return Math.max(0.08, val)
          })
          setLevels(next)
          rafRef.current = requestAnimationFrame(tick)
        }
        tick()
      } else if (effectiveMode === 'speaking') {
        speakingAnimate()
      } else {
        idleAnimate()
      }
    }

    function idleAnimate() {
      let t = 0
      const tick = () => {
        if (cancelled) return
        t += 0.05
        const next = Array.from({ length: bars }, (_, i) => {
          return 0.08 + Math.abs(Math.sin(t + i * 0.4)) * 0.12
        })
        setLevels(next)
        rafRef.current = requestAnimationFrame(tick)
      }
      tick()
    }

    function speakingAnimate() {
      let t = 0
      const tick = () => {
        if (cancelled) return
        t += 0.06
        const profile = EMOTION_PROFILES[emotionRef.current] || EMOTION_PROFILES.neutral
        const baseIntensity = profile.intensity
        // Combine prosody-based speed with volume
        const volBoost = Math.max(0.3, (volumeRef.current / 128))
        const next = Array.from({ length: bars }, (_, i) => {
          // Multi-wave synthesis for a more organic speech pattern
          const center = bars / 2
          const distFromCenter = Math.abs(i - center) / center
          const envelope = 1 - distFromCenter * 0.4 // louder in center bars

          const wave1 = Math.abs(Math.sin(t * profile.speed + i * 0.35))
          const wave2 = Math.abs(Math.sin(t * profile.speed * 1.7 + i * 0.6)) * 0.4
          const wave3 = Math.abs(Math.sin(t * profile.speed * 0.5 + i * 0.15)) * 0.2
          const combined = (wave1 + wave2 + wave3) * baseIntensity * envelope * volBoost

          return Math.max(0.1, Math.min(1, combined))
        })
        setLevels(next)
        rafRef.current = requestAnimationFrame(tick)
      }
      tick()
    }

    setup()

    return () => {
      cancelled = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (effectiveMode === 'listening') releaseMicAnalyser()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveMode, bars])

  return (
    <div className="flex items-center justify-center gap-[3px]" style={{ height }}>
      {levels.map((lvl, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-gradient-to-t from-ai-500 via-purple-neon to-cyan-neon"
          animate={{ height: `${Math.max(8, lvl * height)}px`, opacity: 0.5 + lvl * 0.5 }}
          transition={{ duration: 0.08 }}
          style={{ minHeight: 6 }}
        />
      ))}
    </div>
  )
}
