import { motion } from 'framer-motion'

export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking'

const config: Record<OrbState, { colors: string[]; label: string; speed: number }> = {
  idle: {
    colors: ['#6366f1', '#a855f7', '#22d3ee'],
    label: 'Tap to speak',
    speed: 4,
  },
  listening: {
    colors: ['#22d3ee', '#3b82f6', '#6366f1'],
    label: 'Listening…',
    speed: 1.5,
  },
  thinking: {
    colors: ['#a855f7', '#6366f1', '#ec4899'],
    label: 'Thinking…',
    speed: 1,
  },
  speaking: {
    colors: ['#22d3ee', '#06b6d4', '#8b5cf6'],
    label: 'Speaking…',
    speed: 1.2,
  },
}

interface Props {
  state: OrbState
  size?: number
  showLabel?: boolean
  onClick?: () => void
}

export default function AIOrb({ state, size = 220, showLabel = true, onClick }: Props) {
  const c = config[state]
  const id = `orb-grad-${state}`

  return (
    <div className="flex flex-col items-center justify-center gap-6" onClick={onClick}>
      <motion.div
        className="relative cursor-pointer"
        style={{ width: size, height: size }}
        animate={
          state === 'idle'
            ? { scale: [1, 1.03, 1] }
            : state === 'listening'
            ? { scale: [1, 1.08, 1] }
            : state === 'thinking'
            ? { rotate: 360 }
            : { scale: [1, 1.05, 0.98, 1] }
        }
        transition={{
          duration: c.speed,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Outer glow rings */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle, ${c.colors[0]}33 0%, transparent 70%)`,
            }}
            animate={{ scale: [1, 1.5 + i * 0.3], opacity: [0.5, 0] }}
            transition={{
              duration: c.speed,
              repeat: Infinity,
              delay: i * (c.speed / 3),
              ease: 'easeOut',
            }}
          />
        ))}

        {/* Core orb */}
        <div className="relative w-full h-full rounded-full overflow-hidden gradient-border">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <defs>
              <radialGradient id={id} cx="35%" cy="30%">
                <stop offset="0%" stopColor={c.colors[0]} stopOpacity="0.9" />
                <stop offset="50%" stopColor={c.colors[1]} stopOpacity="0.8" />
                <stop offset="100%" stopColor={c.colors[2]} stopOpacity="0.7" />
              </radialGradient>
              <filter id={`blur-${state}`}>
                <feGaussianBlur stdDeviation="3" />
              </filter>
            </defs>
            <circle cx="100" cy="100" r="95" fill={`url(#${id})`} />
            {/* Inner swirl */}
            <motion.ellipse
              cx="100"
              cy="100"
              rx="60"
              ry="30"
              fill={c.colors[0]}
              fillOpacity="0.3"
              filter={`url(#blur-${state})`}
              animate={{ rotate: 360 }}
              transition={{ duration: c.speed * 1.5, repeat: Infinity, ease: 'linear' }}
              style={{ transformOrigin: '100px 100px' }}
            />
            <motion.ellipse
              cx="100"
              cy="100"
              rx="30"
              ry="60"
              fill={c.colors[2]}
              fillOpacity="0.2"
              filter={`url(#blur-${state})`}
              animate={{ rotate: -360 }}
              transition={{ duration: c.speed * 2, repeat: Infinity, ease: 'linear' }}
              style={{ transformOrigin: '100px 100px' }}
            />
            {/* Highlight */}
            <ellipse cx="70" cy="60" rx="35" ry="25" fill="white" fillOpacity="0.25" filter={`url(#blur-${state})`} />
          </svg>
        </div>
      </motion.div>

      {showLabel && (
        <motion.p
          key={c.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-medium text-white/60 tracking-wide"
        >
          {c.label}
        </motion.p>
      )}
    </div>
  )
}
