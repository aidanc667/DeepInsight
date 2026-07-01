'use client'

import type { SourceRegistryItem } from '@/ai/schemas'

interface SourcesRailProps {
  sources: SourceRegistryItem[]
}

function tierBadge(tier: string | undefined) {
  if (!tier) return null
  const t = tier.toLowerCase()
  if (t === 'high') {
    return { label: 'HIGH', bg: '#e8f0e8', text: '#1a4a1a', border: '#b8d8b8' }
  }
  if (t === 'medium') {
    return { label: 'MED', bg: '#fef3cd', text: '#7a5a00', border: 'transparent' }
  }
  return { label: 'LOW', bg: '#f0ece4', text: '#64748b', border: 'transparent' }
}

export function SourcesRail({ sources }: SourcesRailProps) {
  if (!sources || sources.length === 0) {
    return (
      <aside
        className="flex flex-col shrink-0 overflow-hidden"
        style={{
          width: '200px',
          background: '#f0ece4',
          borderLeft: '1px solid #e0dbd0',
        }}
      >
        <div className="px-3 pt-4 pb-2" style={{ borderBottom: '1px solid #e0dbd0' }}>
          <p className="text-[9px] font-semibold tracking-[0.1em] uppercase" style={{ color: '#94a3b8' }}>
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

  return (
    <aside
      className="flex flex-col shrink-0 overflow-y-auto"
      style={{
        width: '200px',
        background: '#f0ece4',
        borderLeft: '1px solid #e0dbd0',
      }}
    >
      {/* Header */}
      <div className="px-3 pt-4 pb-2" style={{ borderBottom: '1px solid #e0dbd0' }}>
        <p className="text-[9px] font-semibold tracking-[0.1em] uppercase" style={{ color: '#94a3b8' }}>
          Sources
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: '#64748b' }}>
          {sorted.length} verified · {highCount} high-cred
        </p>
      </div>

      {/* Source cards */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1.5">
        {sorted.map((source, i) => {
          const badge = tierBadge(source.credibilityTier)
          return (
            <a
              key={i}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col gap-1 p-2 rounded-md transition-colors"
              style={{
                background: 'white',
                border: '1px solid #e8e2d9',
                textDecoration: 'none',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#c8bfb0')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#e8e2d9')}
            >
              <div className="flex items-center gap-1.5">
                {badge && (
                  <span
                    className="inline-block text-[8px] font-mono px-1.5 py-0.5 rounded shrink-0"
                    style={{
                      background: badge.bg,
                      color: badge.text,
                      border: badge.border !== 'transparent' ? `1px solid ${badge.border}` : undefined,
                    }}
                  >
                    {badge.label}
                  </span>
                )}
                <span className="text-[10px] font-mono truncate flex-1" style={{ color: '#1e3a5f' }}>
                  {source.domain}
                </span>
              </div>

              {source.keyInsight && (
                <p className="text-[9px] line-clamp-3 leading-snug" style={{ color: '#64748b' }}>
                  {source.keyInsight}
                </p>
              )}

              {source.extractedSnippet && (
                <p className="text-[8.5px] leading-snug italic line-clamp-1 px-0.5" style={{ color: '#94a3b8' }}>
                  &ldquo;{source.extractedSnippet.slice(0, 100)}&hellip;&rdquo;
                </p>
              )}
            </a>
          )
        })}
      </div>
    </aside>
  )
}
