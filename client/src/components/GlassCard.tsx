import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  strong?: boolean
  glow?: boolean
}

export default function GlassCard({ children, className = '', strong = false, glow = false }: Props) {
  return (
    <div
      className={`${strong ? 'glass-strong' : 'glass'} ${glow ? 'shadow-glow' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
