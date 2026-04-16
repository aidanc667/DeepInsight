'use client'

import { motion } from 'motion/react'

interface Props { active: boolean }

const MODELS = [
  { id: 'claude',  label: 'Claude Sonnet',  sub: 'planning & synthesis',  color: 'bg-violet-400', ring: 'bg-violet-400/20' },
  { id: 'gemini',  label: 'Gemini Flash',   sub: 'live web search',        color: 'bg-cyan-400',   ring: 'bg-cyan-400/20' },
]

export function ModelStatusDots({ active }: Props) {
  if (!active) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-6 pt-1"
    >
      {MODELS.map((m, i) => (
        <motion.div
          key={m.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.12 }}
          className="flex items-center gap-2.5"
        >
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-50 ${m.color}`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${m.color}`} />
          </span>
          <span className="font-mono text-[11px] text-slate-500">
            <span className="text-slate-400">{m.label}</span>
            <span className="text-slate-700 ml-1">— {m.sub}</span>
          </span>
        </motion.div>
      ))}
    </motion.div>
  )
}
