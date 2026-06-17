import { useMemo } from 'react'

interface Props {
  count?: number
}

/** Animated aurora gradient blobs + grid background. Purely decorative. */
export default function Background({ count = 3 }: Props) {
  const blobs = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        top: `${15 + i * 25}%`,
        left: `${[10, 65, 35][i % 3]}%`,
        size: 300 + i * 80,
        color: ['rgba(99,102,241,0.35)', 'rgba(168,85,247,0.3)', 'rgba(34,211,238,0.25)'][i % 3],
        delay: `${i * 2}s`,
      })),
    [count]
  )

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      <div className="absolute inset-0 bg-deep" />
      {blobs.map((b) => (
        <div
          key={b.id}
          className="aurora floating"
          style={{
            top: b.top,
            left: b.left,
            width: b.size,
            height: b.size,
            background: b.color,
            animationDelay: b.delay,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-grid opacity-40" />
    </div>
  )
}
