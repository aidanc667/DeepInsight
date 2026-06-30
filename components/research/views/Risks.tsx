'use client'

import { AlertTriangle } from 'lucide-react'
import { Card, Label } from './primitives'
import type { StructuredOutput } from '@/ai/output/structured-output'

export function Risks({ risks, delay }: { risks: StructuredOutput['risks']; delay: number }) {
  if (risks.length === 0) return null
  return (
    <Card delay={delay} accentColor="rgba(245,158,11,0.4)">
      <div className="p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex items-center justify-center h-6 w-6 rounded-md"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)' }}>
            <AlertTriangle className="h-3 w-3 text-amber-400" />
          </div>
          <Label>Risks</Label>
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
  )
}
