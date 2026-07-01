'use client'

import { motion } from 'motion/react'
import { CheckCircle2, Zap, AlertTriangle, Shield } from 'lucide-react'
import { Card, Label } from './primitives'
import type { StructuredOutput } from '@/ai/output/structured-output'

export function ExecutionView({ data, delay }: { data: NonNullable<StructuredOutput['execution']>; delay: number }) {
  const { steps, resourcesNeeded, potentialBlockers, adversarialReview } = data
  if (steps.length === 0) return null

  return (
    <div className="space-y-3.5">
      <Card delay={delay} style={{ border: '1px solid rgba(249,115,22,0.2)' }}>
        <div className="p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="flex items-center justify-center h-6 w-6 rounded-md"
              style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
              <CheckCircle2 className="h-3 w-3 text-orange-400" />
            </div>
            <Label>Step-by-Step Plan</Label>
            <span className="ml-auto font-mono text-[10px] text-slate-500">{steps.length} steps</span>
          </div>
          <div className="space-y-3">
            {steps.map((s, i) => (
              <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl"
                style={{ background: '#f8f5f0', border: '1px solid #e8e2d9' }}>
                <div className="flex items-center justify-center h-6 w-6 rounded-lg shrink-0"
                  style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
                  <span className="font-mono text-[11px] font-bold text-orange-600">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-semibold text-slate-800 leading-tight mb-1">{s.step}</p>
                  <p className="text-[12.5px] text-slate-600 leading-[1.6]">{s.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {resourcesNeeded && (
          <Card delay={delay + 0.025}>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3.5">
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                <Label>Resources Needed</Label>
              </div>
              <p className="text-[13.5px] text-slate-700 leading-[1.65]">{resourcesNeeded}</p>
            </div>
          </Card>
        )}

        {potentialBlockers.length > 0 && (
          <Card delay={delay + 0.035}
            style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3.5">
                <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                <Label>Potential Blockers</Label>
              </div>
              <div className="space-y-2">
                {potentialBlockers.map((b, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="font-mono text-[11px] text-red-400 mt-0.5 shrink-0">!</span>
                    <p className="text-[13px] text-slate-700 leading-[1.65]">{b}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>

      {adversarialReview && (
        <motion.div
          initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: delay + 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-xl overflow-hidden"
          style={{ background: 'white', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <div className="p-5 flex items-start gap-3">
            <div className="flex items-center justify-center h-6 w-6 rounded-md shrink-0 mt-0.5"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
              <Shield className="h-3 w-3 text-red-500" />
            </div>
            <div>
              <p className="report-section-label mb-2">Most Likely Failure Point</p>
              <p className="text-[13.5px] text-slate-700 leading-[1.65]">{adversarialReview}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
