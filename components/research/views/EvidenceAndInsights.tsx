'use client'

import { Lightbulb } from 'lucide-react'
import { Card, Label, ConfidencePip } from './primitives'
import type { StructuredOutput } from '@/ai/output/structured-output'

export function EvidenceAndInsights({ data, delay }: { data: StructuredOutput['evidenceAndInsights']; delay: number }) {
  const { overview, keyFindings } = data
  if (!overview && keyFindings.length === 0) return null

  return (
    <div className="space-y-3.5">
      {overview && (
        <Card delay={delay}>
          <div className="p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex items-center justify-center h-6 w-6 rounded-md"
                style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                <Lightbulb className="h-3 w-3 text-violet-400" />
              </div>
              <Label>Evidence &amp; Insights</Label>
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
              <p className="report-section-label">Key Findings</p>
              <span className="font-mono text-[10px] text-slate-500">{keyFindings.length}</span>
            </div>
            <div className="space-y-2">
              {keyFindings.map((f, i) => (
                <div key={i} className="p-3.5 rounded-xl"
                  style={{ background: '#f8f5f0', border: '1px solid #e8e2d9' }}>
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center h-5 w-5 rounded-md shrink-0 mt-0.5"
                      style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.18)' }}>
                      <span className="font-mono text-[9px] font-bold text-violet-600">{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] text-slate-700 leading-[1.65]">{f.finding}</p>
                      {f.sourceContext && (
                        <p className="text-[11px] text-slate-500 mt-1.5 italic">{f.sourceContext}</p>
                      )}
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

    </div>
  )
}
