'use client'

import { motion } from 'motion/react'
import { Lightbulb, X } from 'lucide-react'
import { Card, Label } from './primitives'
import type { StructuredOutput } from '@/ai/output/structured-output'

export function UnderstandingView({ data, delay }: { data: NonNullable<StructuredOutput['understanding']>; delay: number }) {
  const { overview, analogy, keyTakeaway, mechanisms, misconceptions } = data
  if (!overview && !analogy && mechanisms.length === 0) return null

  return (
    <div className="space-y-3.5">
      {overview && (
        <Card delay={delay} accentColor="rgba(20,184,166,0.3)">
          <div className="p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex items-center justify-center h-6 w-6 rounded-md"
                style={{ background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.2)' }}>
                <Lightbulb className="h-3 w-3 text-teal-400" />
              </div>
              <Label>The Explanation</Label>
            </div>
            <div className="space-y-3">
              {overview.split('\n').filter(Boolean).map((para, i) => (
                <p key={i} className="text-[14px] text-slate-300 leading-[1.72]">{para}</p>
              ))}
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {analogy && (
          <motion.div
            initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, delay: delay + 0.02, ease: [0.16, 1, 0.3, 1] }}
            className="card-bevel rounded-2xl overflow-hidden"
            style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.16)' }}
          >
            <div className="p-5">
              <p className="text-[9.5px] font-mono tracking-[0.18em] uppercase text-amber-400/70 mb-3">Think of it like…</p>
              <p className="text-[13.5px] text-slate-300 leading-[1.65] italic">{analogy}</p>
            </div>
          </motion.div>
        )}

        {keyTakeaway && (
          <motion.div
            initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, delay: delay + 0.03, ease: [0.16, 1, 0.3, 1] }}
            className="card-bevel rounded-2xl overflow-hidden"
            style={{ background: 'rgba(20,184,166,0.05)', border: '1px solid rgba(20,184,166,0.18)' }}
          >
            <div className="p-5">
              <p className="text-[9.5px] font-mono tracking-[0.18em] uppercase text-teal-400/70 mb-3">Key Takeaway</p>
              <p className="text-[14px] font-medium text-teal-200 leading-[1.65]">{keyTakeaway}</p>
            </div>
          </motion.div>
        )}
      </div>

      {mechanisms.length > 0 && (
        <Card delay={delay + 0.04}>
          <div className="p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <Label>How It Works</Label>
            </div>
            <div className="space-y-2">
              {mechanisms.map((f, i) => (
                <div key={i} className="p-3.5 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.022)', border: '1px solid rgba(255,255,255,0.052)' }}>
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center h-5 w-5 rounded-md shrink-0 mt-0.5"
                      style={{ background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.2)' }}>
                      <span className="font-mono text-[9px] font-bold text-teal-400">{i + 1}</span>
                    </div>
                    <p className="text-[13.5px] text-slate-300 leading-[1.65]">{f.finding}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {misconceptions.length > 0 && (
        <Card delay={delay + 0.025}>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3.5">
              <X className="h-3.5 w-3.5 text-slate-500" />
              <Label>Common Misunderstandings</Label>
            </div>
            <div className="space-y-2.5">
              {misconceptions.map((m, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="font-mono text-[11px] text-amber-500 mt-0.5 shrink-0">✗</span>
                  <p className="text-[13.5px] text-slate-400 leading-[1.65]">{m}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
