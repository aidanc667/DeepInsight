'use client'

import { motion } from 'motion/react'
import { MessageSquare, CheckCircle2 } from 'lucide-react'
import { Card } from './primitives'
import type { StructuredOutput } from '@/ai/output/structured-output'

export function PerspectivesView({ data, delay }: { data: NonNullable<StructuredOutput['perspectives']>; delay: number }) {
  const { sides, commonGround } = data
  if (sides.length === 0 && !commonGround) return null

  return (
    <div className="space-y-3.5">
      {sides.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {sides.map((side, i) => (
            <Card key={i} delay={delay + i * 0.03}
              style={{
                background: i % 2 === 0
                  ? 'linear-gradient(160deg, #0e1a2e 0%, #0a1220 100%)'
                  : 'linear-gradient(160deg, #1a0e2e 0%, #0a1220 100%)',
                border: `1px solid ${i % 2 === 0 ? 'rgba(59,130,246,0.2)' : 'rgba(139,92,246,0.2)'}`,
              }}>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center justify-center h-6 w-6 rounded-md"
                    style={{
                      background: i % 2 === 0 ? 'rgba(59,130,246,0.1)' : 'rgba(139,92,246,0.1)',
                      border: `1px solid ${i % 2 === 0 ? 'rgba(59,130,246,0.2)' : 'rgba(139,92,246,0.2)'}`,
                    }}>
                    <MessageSquare className="h-3 w-3" style={{ color: i % 2 === 0 ? '#60a5fa' : '#a78bfa' }} />
                  </div>
                  <span className="text-[11px] font-semibold" style={{ color: i % 2 === 0 ? '#60a5fa' : '#a78bfa' }}>
                    {side.label}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {side.points.filter(Boolean).map((point, pi) => (
                    <div key={pi} className="flex items-start gap-2.5">
                      <span className="font-mono text-[11px] mt-0.5 shrink-0"
                        style={{ color: i % 2 === 0 ? '#3b82f6' : '#8b5cf6' }}>·</span>
                      <p className="text-[13.5px] text-slate-300 leading-[1.65]">{point}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {commonGround && (
        <motion.div
          initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: delay + 0.04, ease: [0.16, 1, 0.3, 1] }}
          className="card-bevel rounded-2xl overflow-hidden"
          style={{ background: 'rgba(52,211,153,0.04)', border: '1px solid rgba(52,211,153,0.14)' }}
        >
          <div className="p-5 flex items-start gap-3">
            <div className="flex items-center justify-center h-6 w-6 rounded-md shrink-0 mt-0.5"
              style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            </div>
            <div>
              <p className="text-[9.5px] font-mono tracking-[0.18em] uppercase text-emerald-400/70 mb-2">Common Ground</p>
              <p className="text-[13.5px] text-slate-300 leading-[1.65]">{commonGround}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
