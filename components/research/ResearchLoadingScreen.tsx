'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Brain, Globe, Layers, Sparkles, FileSearch, Check, Zap } from 'lucide-react'
import { getPersonaUI } from '@/lib/prompts/expert-personas-ui'
import type { PersonaUI } from '@/lib/prompts/expert-personas-ui'

interface Props {
  prompt: string
  isActive: boolean
}

const STAGES = [
  { id: 'classify',   label: 'Classifying',     icon: Brain,       color: '#818cf8' },
  { id: 'expert',     label: 'Expert mode',      icon: Sparkles,    color: '#22d3ee' },
  { id: 'research',   label: 'Researching',      icon: Globe,       color: '#06b6d4' },
  { id: 'sources',    label: 'Evaluating',       icon: FileSearch,  color: '#34d399' },
  { id: 'synthesize', label: 'Synthesizing',     icon: Layers,      color: '#f59e0b' },
] as const

// Cumulative ms at which each stage completes
const STAGE_ENDS = [2200, 4800, 10000, 14500, 19000]
const TOTAL_MS   = 19000

export function ResearchLoadingScreen({ prompt, isActive }: Props) {
  const [elapsed, setElapsed]   = useState(0)
  const [msgIdx, setMsgIdx]     = useState(0)
  const startRef                = useRef<number>(Date.now())
  const tickRef                 = useRef<ReturnType<typeof setInterval> | null>(null)
  const msgRef                  = useRef<ReturnType<typeof setInterval> | null>(null)

  // Derive persona only when prompt changes (stable reference)
  const personaRef = useRef<PersonaUI>(getPersonaUI(prompt))
  useEffect(() => {
    personaRef.current = getPersonaUI(prompt)
  }, [prompt])

  // Reset + start ticking when isActive flips to true
  useEffect(() => {
    if (!isActive) {
      if (tickRef.current) clearInterval(tickRef.current)
      if (msgRef.current)  clearInterval(msgRef.current)
      setElapsed(0)
      setMsgIdx(0)
      return
    }

    startRef.current = Date.now()
    setElapsed(0)
    setMsgIdx(0)

    tickRef.current = setInterval(() => {
      setElapsed(Date.now() - startRef.current)
    }, 80)

    msgRef.current = setInterval(() => {
      setMsgIdx(i => (i + 1) % personaRef.current.loadingMessages.length)
    }, 2800)

    return () => {
      if (tickRef.current) clearInterval(tickRef.current)
      if (msgRef.current)  clearInterval(msgRef.current)
    }
  }, [isActive])

  const progress    = Math.min(elapsed / TOTAL_MS, 0.97)
  const activeStage = Math.max(0, STAGE_ENDS.findIndex(end => elapsed < end))
  const persona     = personaRef.current
  const currentMsg  = persona.loadingMessages[msgIdx] ?? persona.loadingMessages[0]

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          key="loading-screen"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6, transition: { duration: 0.2 } }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="card-bevel rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, #0d192a 0%, #0a1220 100%)',
            border: '1px solid rgba(255,255,255,0.072)',
          }}
        >
          {/* Cyan shimmer top */}
          <div className="h-px" style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(6,182,212,0.45) 50%, transparent 100%)',
          }} />

          <div className="p-6 space-y-5">

            {/* ── Expert persona header ─────────────────────────────── */}
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="flex items-center justify-center h-9 w-9 rounded-xl shrink-0"
                style={{
                  background: 'rgba(6,182,212,0.1)',
                  border: '1px solid rgba(6,182,212,0.22)',
                }}
              >
                <Sparkles className="h-4 w-4 text-cyan-400" />
              </motion.div>

              <div className="min-w-0">
                <p className="text-[9px] font-mono text-slate-600 tracking-[0.22em] uppercase mb-0.5">
                  Consulting Expert
                </p>
                <p className="text-[13px] font-medium text-slate-200 truncate">
                  {persona.title}
                </p>
              </div>

              <div
                className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-md shrink-0"
                style={{
                  background: 'rgba(6,182,212,0.07)',
                  border: '1px solid rgba(6,182,212,0.18)',
                }}
              >
                <Zap className="h-3 w-3 text-cyan-400 animate-pulse" />
                <span className="text-[9px] font-mono text-cyan-400 tracking-[0.15em]">ACTIVE</span>
              </div>
            </div>

            {/* ── Progress bar + rotating message ──────────────────── */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={msgIdx}
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.25 }}
                    className="text-[12.5px] text-slate-400 leading-snug"
                  >
                    {currentMsg}
                  </motion.p>
                </AnimatePresence>
                <span className="text-[10px] font-mono text-slate-600 shrink-0 tabular-nums">
                  {Math.round(progress * 100)}%
                </span>
              </div>

              {/* Bar track */}
              <div
                className="h-[3px] rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, #0891b2 0%, #22d3ee 60%, #67e8f9 100%)',
                  }}
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 0.35, ease: 'linear' }}
                />
              </div>
            </div>

            {/* ── Stage checklist ───────────────────────────────────── */}
            <div className="grid grid-cols-5 gap-2">
              {STAGES.map((stage, i) => {
                const done    = i < activeStage
                const active  = i === activeStage
                const pending = i > activeStage
                const Icon    = stage.icon

                return (
                  <motion.div
                    key={stage.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: pending ? 0.4 : 1, y: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.3 }}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <div
                      className="flex items-center justify-center h-7 w-7 rounded-lg transition-all duration-500"
                      style={{
                        background: done
                          ? 'rgba(52,211,153,0.12)'
                          : active
                          ? 'rgba(6,182,212,0.12)'
                          : 'rgba(255,255,255,0.03)',
                        border: done
                          ? '1px solid rgba(52,211,153,0.28)'
                          : active
                          ? '1px solid rgba(6,182,212,0.32)'
                          : '1px solid rgba(255,255,255,0.07)',
                      }}
                    >
                      {done ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : active ? (
                        <Icon className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
                      ) : (
                        <Icon className="h-3.5 w-3.5 text-slate-700" />
                      )}
                    </div>

                    <p
                      className="text-[8.5px] font-mono text-center leading-tight tracking-wider transition-colors duration-300"
                      style={{
                        color: done ? '#34d399' : active ? '#22d3ee' : '#334155',
                      }}
                    >
                      {stage.label.toUpperCase()}
                    </p>
                  </motion.div>
                )
              })}
            </div>

            {/* ── Model callout ─────────────────────────────────────── */}
            <div
              className="flex items-center justify-center gap-4 pt-1 border-t"
              style={{ borderColor: 'rgba(255,255,255,0.05)' }}
            >
              {[
                { label: 'CLAUDE SONNET', dot: '#818cf8' },
                { label: 'GEMINI FLASH', dot: '#22d3ee' },
                { label: 'LIVE WEB', dot: '#34d399' },
              ].map(({ label, dot }) => (
                <div key={label} className="flex items-center gap-1.5 pt-3">
                  <div
                    className="h-1.5 w-1.5 rounded-full animate-pulse"
                    style={{ background: dot }}
                  />
                  <span className="text-[9px] font-mono text-slate-600 tracking-[0.15em]">
                    {label}
                  </span>
                </div>
              ))}
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
