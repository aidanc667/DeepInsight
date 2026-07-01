'use client'

import { BookOpen } from 'lucide-react'
import { Card, Label } from './primitives'
import type { StructuredOutput } from '@/ai/output/structured-output'

export function ExecutiveAnswer({ data, delay }: { data: StructuredOutput['executiveAnswer']; delay: number }) {
  if (!data.brief) return null
  return (
    <Card delay={delay}>
      <div className="p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex items-center justify-center h-6 w-6 rounded-md"
            style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.18)' }}>
            <BookOpen className="h-3 w-3 text-blue-500" />
          </div>
          <Label>Executive Answer</Label>
        </div>
        <p className="report-body">{data.brief}</p>
      </div>
    </Card>
  )
}
