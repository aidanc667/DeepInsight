'use client'

import { ExternalLink } from 'lucide-react'
import { Card, Label, CredibilityPip } from './primitives'
import type { StructuredOutput } from '@/ai/output/structured-output'

export function Sources({ sources, delay }: { sources: StructuredOutput['sources']; delay: number }) {
  if (sources.length === 0) return null
  return (
    <Card delay={delay}>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3.5">
          <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
          <Label>Sources</Label>
          <span className="ml-auto font-mono text-[10px] text-slate-700">{sources.length}</span>
        </div>
        <div className="space-y-0.5 max-h-56 overflow-y-auto">
          {sources.map((source, i) => (
            <a key={i} href={source.url} target="_blank" rel="noopener noreferrer"
              className="flex flex-col gap-0.5 px-2 py-1.5 rounded-lg group"
              style={{ background: 'transparent' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
              <div className="flex items-center gap-2">
                <CredibilityPip tier={source.credibilityTier} />
                <span className="text-[12px] text-slate-500 group-hover:text-slate-300 truncate transition-colors flex-1">{source.domain}</span>
                <ExternalLink className="h-2.5 w-2.5 text-slate-700 group-hover:text-slate-400 shrink-0 transition-colors" />
              </div>
              {source.keyInsight && (
                <p className="text-[10.5px] text-slate-600 pl-8 leading-snug line-clamp-2">{source.keyInsight}</p>
              )}
              {source.extractedSnippet && (
                <p className="text-[10px] text-slate-700 pl-8 leading-snug italic line-clamp-1 mt-0.5">
                  &ldquo;{source.extractedSnippet.slice(0, 140)}&hellip;&rdquo;
                </p>
              )}
            </a>
          ))}
        </div>
      </div>
    </Card>
  )
}
