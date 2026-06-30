'use client'

import { ExternalLink } from 'lucide-react'
import { CredibilityPip } from './views/primitives'
import type { SourceRegistryItem } from '@/ai/schemas'

interface SourcesRailProps {
  sources: SourceRegistryItem[]
}

export function SourcesRail({ sources }: SourcesRailProps) {
  if (!sources || sources.length === 0) {
    return (
      <aside
        className="flex flex-col shrink-0 overflow-hidden"
        style={{
          width: 200,
          background: '#0d192a',
          borderLeft: '1px solid rgba(255,255,255,0.072)',
        }}
      >
        <div className="px-3 pt-4 pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.072)' }}>
          <p className="text-[9px] font-semibold tracking-[0.2em] uppercase" style={{ color: '#94a3b8' }}>
            Sources
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: '#64748b' }}>
            No sources yet
          </p>
        </div>
      </aside>
    )
  }

  const sorted = [...sources]
    .filter(s => s?.url)
    .sort((a, b) => {
      const rank = (s: SourceRegistryItem) => {
        const tier = (s.credibilityTier ?? 'low').toLowerCase()
        if (tier === 'high') return 0
        if (tier === 'medium') return 1
        return 2
      }
      return rank(a) - rank(b)
    })

  const highCount = sorted.filter(s => (s.credibilityTier ?? 'low').toLowerCase() === 'high').length
  const mediumCount = sorted.filter(s => (s.credibilityTier ?? 'low').toLowerCase() === 'medium').length

  return (
    <aside
      className="flex flex-col shrink-0 overflow-hidden"
      style={{
        width: 200,
        background: '#0d192a',
        borderLeft: '1px solid rgba(255,255,255,0.072)',
      }}
    >
      {/* Header */}
      <div className="px-3 pt-4 pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.072)' }}>
        <p className="text-[9px] font-semibold tracking-[0.2em] uppercase" style={{ color: '#94a3b8' }}>
          Sources
        </p>
        <p className="text-[10px] mt-1 space-y-0.5" style={{ color: '#64748b' }}>
          <div>{sorted.length} verified</div>
          <div className="text-[9px] mt-0.5">
            {highCount > 0 && <span style={{ color: '#34d399' }}>{highCount} high</span>}
            {highCount > 0 && mediumCount > 0 && <span style={{ color: '#64748b' }}> · </span>}
            {mediumCount > 0 && <span style={{ color: '#fbbf24' }}>{mediumCount} med</span>}
          </div>
        </p>
      </div>

      {/* Source cards */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1.5">
        {sorted.map((source, i) => (
          <a
            key={i}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col gap-1 p-2 rounded-md transition-colors"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.08)',
              textDecoration: 'none',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
          >
            <div className="flex items-center gap-1.5">
              <CredibilityPip tier={source.credibilityTier} />
              <span className="text-[10px] text-slate-400 hover:text-slate-300 truncate transition-colors flex-1 font-mono">
                {source.domain}
              </span>
              <ExternalLink className="h-2.5 w-2.5 text-slate-600 hover:text-slate-400 shrink-0 transition-colors" />
            </div>

            {source.keyInsight && (
              <p className="text-[9px] text-slate-500 leading-snug line-clamp-2">
                {source.keyInsight}
              </p>
            )}

            {source.extractedSnippet && (
              <p className="text-[8.5px] text-slate-600 leading-snug italic line-clamp-1 px-0.5">
                &ldquo;{source.extractedSnippet.slice(0, 100)}&hellip;&rdquo;
              </p>
            )}
          </a>
        ))}
      </div>
    </aside>
  )
}
