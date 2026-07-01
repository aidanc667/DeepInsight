'use client'

import { motion } from 'motion/react'
import { Shield, X } from 'lucide-react'
import { Card, Label } from './primitives'
import type { StructuredOutput } from '@/ai/output/structured-output'

export function WhatThisMisses({ data, delay }: { data: StructuredOutput['whatThisMisses']; delay: number }) {
  const { adversarialReview, misconceptions } = data
  if (!adversarialReview && misconceptions.length === 0) return null

  return (
    <div className="space-y-3.5">
      {adversarialReview && (
        <motion.div
          initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-xl overflow-hidden"
          style={{ background: 'white', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <div className="p-5 flex items-start gap-3">
            <div className="flex items-center justify-center h-6 w-6 rounded-md shrink-0 mt-0.5"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
              <Shield className="h-3 w-3 text-red-500" />
            </div>
            <div>
              <p className="report-section-label mb-2">What This Misses</p>
              <p className="text-[13.5px] text-slate-700 leading-[1.65]">{adversarialReview}</p>
            </div>
          </div>
        </motion.div>
      )}

      {misconceptions.length > 0 && (
        <Card delay={delay + 0.02}>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3.5">
              <X className="h-3.5 w-3.5 text-slate-500" />
              <Label>Common Misconceptions</Label>
            </div>
            <div className="space-y-2.5">
              {misconceptions.map((m, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="font-mono text-[11px] text-amber-600 mt-0.5 shrink-0">✗</span>
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
