import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

interface Props {
  /** When true, visualizes live mic input. When false, shows an idle shimmer. */
  active: boolean
  bars?: number
  height?: number
}

/**
 * Waveform — shows live mic levels when active, otherwise a gentle idle shimmer.
 */
export default function Waveform({ active, bars = 32, height = 60 }: Props) {
  const [levels, setLevels] = useState<number[]>(() => new Array(bars).fill(0.1))
  const rafRef = useRef<number>(0)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const micRef = useRef<{ stream: MediaStream; ctx: AudioContext } | null>(null)

  useEffect(() => {
    let cancelled = false

    async function setupMic() {
      if (!active) {
        teardown()
        idleAnimate()
        return
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        const ctx = new AudioContext()
        const source = ctx.createMediaStreamSource(stream)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 128
        source.connect(analyser)
        analyserRef.current = analyser
        micRef.current = { stream, ctx }
        drawReal()
      } catch {
        // Permission denied — fall back to idle shimmer
        idleAnimate()
      }
    }

    function drawReal() {
      const analyser = analyserRef.current
      if (!analyser) return
      const buffer = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        analyser.getByteFrequencyData(buffer)
        const step = Math.floor(buffer.length / bars)
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
        t += 0.05
        const next = Array.from({ length: bars }, (_, i) => {
          return 0.08 + Math.abs(Math.sin(t + i * 0.4)) * (active ? 0.25 : 0.12)
        })
        setLevels(next)
        rafRef.current = requestAnimationFrame(tick)
      }
      tick()
    }

    function teardown() {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (micRef.current) {
        micRef.current.stream.getTracks().forEach((t) => t.stop())
        micRef.current.ctx.close()
        micRef.current = null
      }
      analyserRef.current = null
    }

    setupMic()

    return () => {
      cancelled = true
      teardown()
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
