'use client'

import { motion } from 'motion/react'
import { Lightbulb, TrendingUp, Activity } from 'lucide-react'
import { Card, Label, ConfidencePip } from './primitives'
import type { StructuredOutput } from '@/ai/output/structured-output'

export function AnalysisView({ data, delay }: { data: NonNullable<StructuredOutput['analysis']>; delay: number }) {
  const { overview, keyFindings, patterns, implications } = data
  if (!overview && keyFindings.length === 0 && patterns.length === 0) return null

  return (
    <div className="space-y-3.5">
      {overview && (
        <Card delay={delay}>
          <div className="p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex items-center justify-center h-6 w-6 rounded-md"
                style={{ background: 'rgba(30,58,95,0.08)', border: '1px solid rgba(30,58,95,0.18)' }}>
                <Lightbulb className="h-3 w-3" style={{ color: '#1e3a5f' }} />
              </div>
              <Label>What This Means</Label>
            </div>
            <div className="space-y-3">
              {overview.split('\n').filter(Boolean).map((para, i) => (
                <p key={i} className="report-body">{para}</p>
              ))}
            </div>
          </div>
        </Card>
      )}

      {keyFindings.length > 0 && (
        <Card delay={delay + 0.015}>
          <div className="p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <p className="report-section-label">Key Insights</p>
              <span className="font-mono text-[10px] text-slate-500">{keyFindings.length}</span>
            </div>
            <div className="space-y-2">
              {keyFindings.map((f, i) => (
                <div key={i} className="p-3.5 rounded-xl"
                  style={{ background: '#f8f5f0', border: '1px solid #e8e2d9' }}>
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center h-5 w-5 rounded-md shrink-0 mt-0.5"
                      style={{ background: 'rgba(30,58,95,0.08)', border: '1px solid rgba(30,58,95,0.18)' }}>
                      <span className="font-mono text-[9px] font-bold" style={{ color: '#1e3a5f' }}>{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] text-slate-700 leading-[1.65]">{f.finding}</p>
                      {f.attributedSources && f.attributedSources.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {f.attributedSources.map((domain, j) => (
                            <span key={j}
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono tracking-wide"
                              style={{ background: '#f0ece4', border: '1px solid #e0dbd0', color: '#64748b' }}>
                              {domain}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {f.confidence && <ConfidencePip level={f.confidence} />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {patterns.length > 0 && (
        <Card delay={delay + 0.015}>
          <div className="p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex items-center justify-center h-6 w-6 rounded-md"
                style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)' }}>
                <Activity className="h-3 w-3 text-indigo-500" />
              </div>
              <Label>Patterns &amp; Signals</Label>
              <span className="ml-auto font-mono text-[10px] text-slate-500">{patterns.length}</span>
            </div>
            <div className="space-y-2">
              {patterns.map((pattern, i) => (
                <div key={i} className="p-3.5 rounded-xl"
                  style={{ background: '#f8f5f0', border: '1px solid #e8e2d9' }}>
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center h-5 w-5 rounded-md shrink-0 mt-0.5"
                      style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)' }}>
                      <span className="font-mono text-[9px] font-bold text-indigo-600">{i + 1}</span>
                    </div>
                    <p className="text-[13.5px] text-slate-700 leading-[1.65]">{pattern}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {implications && (
        <motion.div
          initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: delay + 0.03, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-xl overflow-hidden"
          style={{ background: 'white', border: '1px solid rgba(30,58,95,0.2)' }}
        >
          <div className="p-5 flex items-start gap-3">
            <div className="flex items-center justify-center h-6 w-6 rounded-md shrink-0 mt-0.5"
              style={{ background: 'rgba(30,58,95,0.08)', border: '1px solid rgba(30,58,95,0.18)' }}>
              <TrendingUp className="h-3 w-3" style={{ color: '#1e3a5f' }} />
            </div>
            <div>
              <p className="report-section-label mb-2">Strategic Implications</p>
              <p className="text-[13.5px] text-slate-700 leading-[1.65]">{implications}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
