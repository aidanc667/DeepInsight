'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Clock, Trash2, ChevronRight, BookOpen, Target, Radio, MessageSquare, BarChart3, Link2 } from 'lucide-react'
import { loadSessions, clearHistory } from '@/lib/research-memory'
import type { ResearchSession } from '@/lib/research-memory'

const MODE_ICONS: Record<string, React.ElementType> = {
  decision:     Target,
  research:     BookOpen,
  intelligence: Radio,
  perspectives: MessageSquare,
  competitive:  BarChart3,
  explainer:    Link2,
}

const MODE_TAGS: Record<string, string> = {
  decision:     'DECISION',
  research:     'RESEARCH',
  intelligence: 'INTEL',
  perspectives: 'PERSP',
  competitive:  'COMP',
  explainer:    'EXPLAIN',
}

function relativeTime(ts: number): string {
  const diff  = Date.now() - ts
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

interface Props {
  onRerun: (query: string) => void
}

export function ResearchHistory({ onRerun }: Props) {
  const [sessions, setSessions] = useState<ResearchSession[]>([])
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    loadSessions().then(setSessions)
  }, [])

  useEffect(() => {
    const onFocus = () => { loadSessions().then(setSessions) }
    window.addEventListener('focus', onFocus)
    const interval = setInterval(() => { loadSessions().then(setSessions) }, 30000)
    return () => {
      window.removeEventListener('focus', onFocus)
      clearInterval(interval)
    }
  }, [])

  if (sessions.length === 0) return null

  const visible = expanded ? sessions : sessions.slice(0, 3)

  function handleClear() {
    setSessions([])
    clearHistory()
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-[#0b1422] border border-white/[0.07] p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="h-5 w-5 rounded-md bg-white/[0.04] border border-white/[0.07] flex items-center justify-center">
          <Clock className="h-3 w-3 text-slate-500" />
        </div>
        <span className="text-[10px] font-mono tracking-[0.18em] uppercase text-slate-600">Recent Research</span>
        <span className="font-mono text-[10px] text-slate-700 ml-1">{sessions.length}</span>
        <button
          onClick={handleClear}
          className="ml-auto flex items-center gap-1 text-[10px] font-mono text-slate-700 hover:text-red-400 tracking-wider transition-colors"
        >
          <Trash2 className="h-3 w-3" />
          CLEAR
        </button>
      </div>

      <div className="space-y-1">
        <AnimatePresence initial={false}>
          {visible.map((session) => {
            const Icon    = MODE_ICONS[session.mode] ?? BookOpen
            const modeTag = MODE_TAGS[session.mode] ?? 'RESEARCH'
            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <button
                  onClick={() => onRerun(session.query)}
                  className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/[0.03] transition-colors group text-left"
                >
                  <div className="h-5 w-5 rounded-md bg-white/[0.03] border border-white/[0.06] flex items-center justify-center shrink-0 mt-0.5 group-hover:border-cyan-500/25 transition-colors">
                    <Icon className="h-2.5 w-2.5 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-400 font-medium truncate group-hover:text-slate-200 transition-colors">
                      {session.query}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="font-mono text-[9px] tracking-wider text-slate-700">{modeTag}</span>
                      <span className="font-mono text-[9px] text-slate-700">{relativeTime(session.timestamp)}</span>
                      {session.confidence > 0 && (
                        <span className="font-mono text-[9px] text-slate-700">{session.confidence}% conf</span>
                      )}
                      {session.sourceCount > 0 && (
                        <span className="font-mono text-[9px] text-slate-700">{session.sourceCount} src</span>
                      )}
                      {session.iterationCount > 1 && (
                        <span className="font-mono text-[9px] text-emerald-600">{session.iterationCount} passes</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-700 group-hover:text-cyan-400 shrink-0 mt-1 transition-colors" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {sessions.length > 3 && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-3 w-full text-[10px] font-mono text-slate-700 hover:text-slate-500 tracking-wider transition-colors py-1"
        >
          {expanded ? 'SHOW LESS ↑' : `SHOW ${sessions.length - 3} MORE ↓`}
        </button>
      )}
    </motion.section>
  )
}
