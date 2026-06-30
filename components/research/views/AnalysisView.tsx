'use client'

import { motion } from 'motion/react'
import { Lightbulb, BookOpen, TrendingUp } from 'lucide-react'
import { Card, Label, ConfidencePip } from './primitives'
import type { StructuredOutput } from '@/ai/output/structured-output'

export function AnalysisView({ data, delay }: { data: NonNullable<StructuredOutput['analysis']>; delay: number }) {
  const { overview, keyFindings, patterns, implications } = data
  if (!overview && keyFindings.length === 0 && patterns.length === 0) return null

  return (
    <div className="space-y-3.5">
      {overview && (
        <Card delay={delay} accentColor="rgba(6,182,212,0.3)">
          <div className="p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex items-center justify-center h-6 w-6 rounded-md"
                style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>
                <Lightbulb className="h-3 w-3 text-cyan-400" />
              </div>
              <Label>What This Means</Label>
            </div>
            <div className="space-y-3">
              {overview.split('\n').filter(Boolean).map((para, i) => (
                <p key={i} className="text-[14px] text-slate-300 leading-[1.72]">{para}</p>
              ))}
            </div>
          </div>
        </Card>
      )}

      {keyFindings.length > 0 && (
        <Card delay={delay + 0.015}>
          <div className="p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <Label>Key Insights</Label>
              <span className="ml-auto font-mono text-[10px] text-slate-700">{keyFindings.length}</span>
            </div>
            <div className="space-y-2">
              {keyFindings.map((f, i) => (
                <div key={i} className="p-3.5 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.022)', border: '1px solid rgba(255,255,255,0.052)' }}>
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center h-5 w-5 rounded-md shrink-0 mt-0.5"
                      style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>
                      <span className="font-mono text-[9px] font-bold text-cyan-400">{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] text-slate-300 leading-[1.65]">{f.finding}</p>
                      {f.attributedSources && f.attributedSources.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {f.attributedSources.map((domain, j) => (
                            <span key={j}
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono tracking-wide"
                              style={{ background: 'rgba(6,182,212,0.07)', border: '1px solid rgba(6,182,212,0.18)', color: '#64748b' }}>
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
            <div className="flex items-center gap-2 mb-3.5">
              <BookOpen className="h-3.5 w-3.5 text-violet-400" />
              <Label>Patterns &amp; Trends</Label>
            </div>
            <div className="space-y-2.5">
              {patterns.map((pattern, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg"
                  style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.12)' }}>
                  <span className="font-mono text-[12px] text-violet-400 mt-0.5 shrink-0">→</span>
                  <p className="text-[13.5px] text-slate-300 leading-[1.65]">{pattern}</p>
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
          className="card-bevel rounded-2xl overflow-hidden"
          style={{ background: 'rgba(6,182,212,0.04)', border: '1px solid rgba(6,182,212,0.18)' }}
        >
          <div className="p-5 flex items-start gap-3">
            <div className="flex items-center justify-center h-6 w-6 rounded-md shrink-0 mt-0.5"
              style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>
              <TrendingUp className="h-3 w-3 text-cyan-400" />
            </div>
            <div>
              <p className="text-[9.5px] font-mono tracking-[0.18em] uppercase text-cyan-400/70 mb-2">Strategic Implications</p>
              <p className="text-[13.5px] text-slate-300 leading-[1.65]">{implications}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
