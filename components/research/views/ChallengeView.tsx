'use client'

import { motion } from 'motion/react'
import { AlertTriangle, HelpCircle, Shield } from 'lucide-react'
import { Card, Label } from './primitives'
import type { StructuredOutput } from '@/ai/output/structured-output'

export function ChallengeView({ data, delay }: { data: NonNullable<StructuredOutput['challenge']>; delay: number }) {
  const { verdict, risks, blindSpots, misconceptions, adversarialReview } = data
  if (!verdict && risks.length === 0 && blindSpots.length === 0) return null

  return (
    <div className="space-y-3.5">
      {verdict && (
        <motion.div
          initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay, ease: [0.16, 1, 0.3, 1] }}
          className="card-bevel rounded-2xl overflow-hidden"
          style={{ background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.18)' }}
        >
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(244,63,94,0.5) 50%, transparent 100%)' }} />
          <div className="p-5">
            <p className="text-[9.5px] font-mono tracking-[0.18em] uppercase text-rose-400/70 mb-3">Verdict</p>
            <p className="text-[14px] text-slate-200 leading-[1.72] font-light">{verdict}</p>
          </div>
        </motion.div>
      )}

      {risks.length > 0 && (
        <Card delay={delay + 0.02} accentColor="rgba(245,158,11,0.4)">
          <div className="p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex items-center justify-center h-6 w-6 rounded-md"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)' }}>
                <AlertTriangle className="h-3 w-3 text-amber-400" />
              </div>
              <Label>Risks &amp; Weaknesses</Label>
              <span className="ml-auto font-mono text-[10px] text-slate-700">{risks.length}</span>
            </div>
            <div className="space-y-2.5">
              {risks.map((risk, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex items-center justify-center h-4 w-4 rounded shrink-0 mt-0.5"
                    style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                    <span className="font-mono text-[8px] font-bold text-amber-400">{i + 1}</span>
                  </div>
                  <p className="text-[13.5px] text-slate-300 leading-[1.65]">{risk}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {(blindSpots.length > 0 || misconceptions.length > 0) && (
        <Card delay={delay + 0.035}>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle className="h-3.5 w-3.5 text-violet-400" />
              <Label>What This Argument Gets Wrong</Label>
            </div>
            <div className="space-y-2">
              {blindSpots.map((spot, i) => (
                <div key={`bs-${i}`} className="flex items-start gap-2.5 p-2.5 rounded-lg"
                  style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.1)' }}>
                  <span className="font-mono text-[11px] text-violet-400 mt-0.5 shrink-0">◈</span>
                  <p className="text-[13.5px] text-slate-300 leading-[1.65]">{spot}</p>
                </div>
              ))}
              {misconceptions.map((m, i) => (
                <div key={`mc-${i}`} className="flex items-start gap-2.5 p-2.5 rounded-lg"
                  style={{ background: 'rgba(244,63,94,0.04)', border: '1px solid rgba(244,63,94,0.1)' }}>
                  <span className="font-mono text-[11px] text-rose-400 mt-0.5 shrink-0">✗</span>
                  <p className="text-[13.5px] text-slate-400 leading-[1.65]">{m}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {adversarialReview && (
        <motion.div
          initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: delay + 0.06, ease: [0.16, 1, 0.3, 1] }}
          className="card-bevel rounded-2xl overflow-hidden"
          style={{ background: 'rgba(52,211,153,0.04)', border: '1px solid rgba(52,211,153,0.14)' }}
        >
          <div className="p-5 flex items-start gap-3">
            <div className="flex items-center justify-center h-6 w-6 rounded-md shrink-0 mt-0.5"
              style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>
              <Shield className="h-3 w-3 text-emerald-400" />
            </div>
            <div>
              <p className="text-[9.5px] font-mono tracking-[0.18em] uppercase text-emerald-400/70 mb-2">Steelman</p>
              <p className="text-[13.5px] text-slate-300 leading-[1.65]">{adversarialReview}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
