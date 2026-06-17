import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { acquireMicAnalyser, releaseMicAnalyser } from '../lib/voice'

interface Props {
  /** When true, visualizes live mic input. When false, shows an idle shimmer. */
  active: boolean
  bars?: number
  height?: number
}

/**
 * Waveform — shows live mic levels when active (from the shared mic analyser),
 * otherwise a gentle idle shimmer. Does NOT open its own getUserMedia stream.
 */
export default function Waveform({ active, bars = 28, height = 40 }: Props) {
  const [levels, setLevels] = useState<number[]>(() => new Array(bars).fill(0.1))
  const rafRef = useRef<number>(0)

  useEffect(() => {
    let cancelled = false

    async function setup() {
      // Cancel any previous animation loop
      if (rafRef.current) cancelAnimationFrame(rafRef.current)

      if (!active) {
        idleAnimate()
        return
      }

      // Acquire the shared analyser (no duplicate getUserMedia)
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

    setup()

    return () => {
      cancelled = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (active) releaseMicAnalyser()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, bars])

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
