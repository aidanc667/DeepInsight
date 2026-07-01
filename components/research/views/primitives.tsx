'use client'

import { motion } from 'motion/react'

export function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-[9.5px] font-mono tracking-[0.2em] uppercase text-slate-600">{children}</span>
}

export function ConfidencePip({ level }: { level: string }) {
  const s = level.toLowerCase()
  const [bg, fg, border] =
    s === 'high'   ? ['rgba(52,211,153,0.1)',  '#34d399', 'rgba(52,211,153,0.22)']  :
    s === 'medium' ? ['rgba(251,191,36,0.08)', '#fbbf24', 'rgba(251,191,36,0.2)']   :
                     ['#f0ece4', '#64748b', '#e0dbd0']
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono tracking-[0.1em] shrink-0"
      style={{ background: bg, color: fg, border: `1px solid ${border}` }}>
      {s.toUpperCase()}
    </span>
  )
}

export function CredibilityPip({ tier }: { tier?: string }) {
  const s = (tier ?? 'low').toLowerCase()
  const [bg, fg, border] =
    s === 'high'   ? ['rgba(52,211,153,0.08)',  '#34d399', 'rgba(52,211,153,0.18)']  :
    s === 'medium' ? ['rgba(251,191,36,0.07)',  '#fbbf24', 'rgba(251,191,36,0.18)']  :
                     ['#f0ece4', '#64748b', '#e0dbd0']
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono tracking-[0.1em] shrink-0"
      style={{ background: bg, color: fg, border: `1px solid ${border}` }}>
      {s.toUpperCase()}
    </span>
  )
}

export interface CardProps {
  children: React.ReactNode
  delay?: number
  accentColor?: string
  className?: string
  style?: React.CSSProperties
}

export function Card({ children, delay = 0, accentColor, className = '', style }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-xl overflow-hidden ${className}`}
      style={{ background: 'white', border: '1px solid #e8e2d9', borderRadius: '12px', ...style }}
    >
      {children}
    </motion.div>
  )
}

export function scoreColor(score: number) {
  return score >= 8 ? '#34d399' : score >= 6 ? '#fbbf24' : '#f87171'
}
