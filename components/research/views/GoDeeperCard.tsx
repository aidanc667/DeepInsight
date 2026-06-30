'use client'

import { HelpCircle } from 'lucide-react'
import { Card, Label } from './primitives'
import type { StructuredOutput } from '@/ai/output/structured-output'

export function GoDeeperCard({
  data, delay, onGoDeeper,
}: {
  data: StructuredOutput['goDeeper']
  delay: number
  onGoDeeper?: (q: string) => void
}) {
  if (data.questions.length === 0) return null
  return (
    <Card delay={delay}>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3.5">
          <HelpCircle className="h-3.5 w-3.5 text-violet-400" />
          <Label>Go Deeper</Label>
          <span className="ml-auto font-mono text-[10px] text-slate-700">{data.questions.length}</span>
        </div>
        <div className="space-y-1.5">
          {data.questions.map((q, i) =>
            onGoDeeper ? (
              <button key={i} onClick={() => onGoDeeper(q)}
                className="w-full text-left text-[13px] text-slate-400 leading-[1.6] pl-3.5 py-1.5 pr-2 rounded-r transition-all duration-150 hover:text-violet-300"
                style={{ borderLeft: '2px solid rgba(139,92,246,0.25)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderLeftColor = 'rgba(139,92,246,0.6)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderLeftColor = 'rgba(139,92,246,0.25)' }}>
                {q}
              </button>
            ) : (
              <p key={i} className="text-[13px] text-slate-500 leading-[1.6] pl-3.5 py-1"
                style={{ borderLeft: '2px solid rgba(139,92,246,0.2)' }}>{q}</p>
            )
          )}
        </div>
      </div>
    </Card>
  )
}
