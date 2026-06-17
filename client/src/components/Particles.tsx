import { useEffect, useState } from 'react'

interface Props {
  count?: number
}

interface Dot {
  id: number
  x: number
  y: number
  size: number
  duration: number
  delay: number
}

/** Floating particle dots — used on splash / onboarding. */
export default function Particles({ count = 40 }: Props) {
  const [dots, setDots] = useState<Dot[]>([])

  useEffect(() => {
    setDots(
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 2 + Math.random() * 4,
        duration: 4 + Math.random() * 8,
        delay: Math.random() * 5,
      }))
    )
  }, [count])

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      {dots.map((d) => (
        <div
          key={d.id}
          className="particle bg-gradient-to-br from-ai-400 to-cyan-neon"
          style={{
            left: `${d.x}%`,
            top: `${d.y}%`,
            width: d.size,
            height: d.size,
            animation: `float ${d.duration}s ease-in-out infinite`,
            animationDelay: `${d.delay}s`,
          }}
        />
      ))}
    </div>
  )
}
