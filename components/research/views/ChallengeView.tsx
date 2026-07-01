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
      {/* Steelman first — state the strongest form of the argument before critiquing it */}
      {adversarialReview && (
        <motion.div
          initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-xl overflow-hidden"
          style={{ background: 'white', border: '1px solid rgba(52,211,153,0.25)' }}
        >
          <div className="p-5 flex items-start gap-3">
            <div className="flex items-center justify-center h-6 w-6 rounded-md shrink-0 mt-0.5"
              style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
              <Shield className="h-3 w-3 text-emerald-600" />
            </div>
            <div>
              <p className="report-section-label mb-2">Steelman</p>
              <p className="text-[13.5px] text-slate-700 leading-[1.65]">{adversarialReview}</p>
            </div>
          </div>
        </motion.div>
      )}

      {verdict && (
        <motion.div
          initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: delay + 0.02, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-xl overflow-hidden"
          style={{ background: 'white', border: '1px solid rgba(244,63,94,0.25)' }}
        >
          <div className="p-5">
            <p className="report-section-label mb-3">Verdict</p>
            <p className="report-body">{verdict}</p>
          </div>
        </motion.div>
      )}

      {risks.length > 0 && (
        <Card delay={delay + 0.04} style={{ border: '1px solid rgba(245,158,11,0.25)' }}>
          <div className="p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex items-center justify-center h-6 w-6 rounded-md"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)' }}>
                <AlertTriangle className="h-3 w-3 text-amber-500" />
              </div>
              <Label>Risks &amp; Weaknesses</Label>
              <span className="ml-auto font-mono text-[10px] text-slate-500">{risks.length}</span>
            </div>
            <div className="space-y-2.5">
              {risks.map((risk, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex items-center justify-center h-4 w-4 rounded shrink-0 mt-0.5"
                    style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                    <span className="font-mono text-[8px] font-bold text-amber-600">{i + 1}</span>
                  </div>
                  <p className="text-[13.5px] text-slate-700 leading-[1.65]">{risk}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {(blindSpots.length > 0 || misconceptions.length > 0) && (
        <Card delay={delay + 0.06}>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle className="h-3.5 w-3.5 text-violet-400" />
              <Label>What This Argument Gets Wrong</Label>
            </div>
            <div className="space-y-2">
              {blindSpots.map((spot, i) => (
                <div key={`bs-${i}`} className="flex items-start gap-2.5 p-2.5 rounded-lg"
                  style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.12)' }}>
                  <span className="font-mono text-[11px] text-violet-600 mt-0.5 shrink-0">◈</span>
                  <p className="text-[13.5px] text-slate-700 leading-[1.65]">{spot}</p>
                </div>
              ))}
              {misconceptions.map((m, i) => (
                <div key={`mc-${i}`} className="flex items-start gap-2.5 p-2.5 rounded-lg"
                  style={{ background: 'rgba(244,63,94,0.03)', border: '1px solid rgba(244,63,94,0.12)' }}>
                  <span className="font-mono text-[11px] text-rose-500 mt-0.5 shrink-0">✗</span>
                  <p className="text-[13.5px] text-slate-600 leading-[1.65]">{m}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
