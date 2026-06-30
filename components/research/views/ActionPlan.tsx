'use client'

import { CheckCircle2 } from 'lucide-react'
import { Card, Label } from './primitives'
import type { StructuredOutput } from '@/ai/output/structured-output'

export function ActionPlan({ data, delay }: { data: StructuredOutput['actionPlan']; delay: number }) {
  const { steps, implications } = data
  if (steps.length === 0 && !implications) return null

  return (
    <Card delay={delay} accentColor="rgba(6,182,212,0.3)">
      <div className="p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
          <Label>Action Plan</Label>
        </div>
        {implications && (
          <p className="text-[13.5px] text-slate-400 leading-[1.65] italic mb-4">{implications}</p>
        )}
        {steps.length > 0 && (
          <div className="space-y-2.5">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="flex items-center justify-center h-4 w-4 rounded shrink-0 mt-0.5"
                  style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>
                  <span className="font-mono text-[8px] font-bold text-cyan-400">{i + 1}</span>
                </div>
                <p className="text-[13.5px] text-slate-300 leading-[1.65]">{step}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
