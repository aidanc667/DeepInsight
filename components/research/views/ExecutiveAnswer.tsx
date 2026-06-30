'use client'

import { BookOpen } from 'lucide-react'
import { Card, Label } from './primitives'
import type { StructuredOutput } from '@/ai/output/structured-output'

export function ExecutiveAnswer({ data, delay }: { data: StructuredOutput['executiveAnswer']; delay: number }) {
  if (!data.brief) return null
  return (
    <Card delay={delay} accentColor="rgba(59,130,246,0.5)">
      <div className="p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex items-center justify-center h-6 w-6 rounded-md"
            style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <BookOpen className="h-3 w-3 text-blue-400" />
          </div>
          <Label>Executive Answer</Label>
          {data.confidence > 0 && (
            <span className="ml-auto font-mono text-[10px] text-slate-600 tracking-wider">
              {data.confidence}<span className="text-slate-700">% conf</span>
            </span>
          )}
        </div>
        <p className="text-[15px] font-light text-slate-200 leading-[1.75]">{data.brief}</p>
      </div>
    </Card>
  )
}
