'use client'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { TrustScore } from '@/ai/schemas'

interface Props { score: TrustScore }

const SIZE = 72
const STROKE = 5
const R = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * R

const colorMap = {
  green:  { ring: '#34d399', text: 'text-emerald-400', border: 'border-emerald-500/20', label: 'text-emerald-400', bg: 'bg-emerald-500/8' },
  orange: { ring: '#fbbf24', text: 'text-amber-400',   border: 'border-amber-500/20',   label: 'text-amber-400',   bg: 'bg-amber-500/8' },
  red:    { ring: '#f87171', text: 'text-red-400',      border: 'border-red-500/20',     label: 'text-red-400',     bg: 'bg-red-500/8' },
}

export function TrustScoreBadge({ score }: Props) {
  const cfg = colorMap[score.alertLevel]
  const dashOffset = CIRCUMFERENCE * (1 - score.finalScore / 100)

  return (
    <Tooltip>
      <TooltipTrigger>
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg cursor-default select-none" style={{ background: 'white', border: '1px solid #e8e2d9', borderRadius: 8 }}>
          <div className="relative" style={{ width: SIZE * 0.55, height: SIZE * 0.55 }}>
            <svg width={SIZE * 0.55} height={SIZE * 0.55} className="-rotate-90">
              <circle
                cx={SIZE * 0.275} cy={SIZE * 0.275} r={R * 0.55}
                fill="none" stroke="#e8e2d9" strokeWidth={STROKE * 0.55}
              />
              <circle
                cx={SIZE * 0.275} cy={SIZE * 0.275} r={R * 0.55}
                fill="none" stroke={cfg.ring} strokeWidth={STROKE * 0.55}
                strokeDasharray={CIRCUMFERENCE * 0.55}
                strokeDashoffset={dashOffset * 0.55}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`font-mono text-[10px] font-bold ${cfg.text}`}>{score.finalScore}</span>
            </div>
          </div>
          <div className="text-left">
            <p className="text-[9px] font-mono text-slate-600 uppercase tracking-[0.15em] leading-none">Trust</p>
            <p className={`text-[10px] font-mono font-semibold capitalize mt-0.5 ${cfg.label}`}>
              {score.alertLevel}
            </p>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        className="text-xs p-3 space-y-1.5 min-w-[200px] shadow-lg"
        style={{ background: 'white', border: '1px solid #e8e2d9', color: '#1e293b' }}
      >
        <p className="font-mono text-[10px] tracking-wider uppercase mb-2" style={{ color: '#94a3b8' }}>Score Breakdown</p>
        <div className="flex justify-between" style={{ color: '#64748b' }}>
          <span>Model confidence ×0.30</span>
          <span className="font-mono" style={{ color: '#1e293b' }}>{score.modelConfidence.toFixed(0)} pts</span>
        </div>
        <div className="flex justify-between" style={{ color: '#64748b' }}>
          <span>Source quality ×0.30</span>
          <span className="font-mono" style={{ color: '#1e293b' }}>{(score.citationScore * 100).toFixed(0)} pts</span>
        </div>
        <div className="flex justify-between" style={{ color: '#64748b' }}>
          <span>Coverage ×0.25</span>
          <span className="font-mono" style={{ color: '#1e293b' }}>{score.coverageScore} pts</span>
        </div>
        <div className="flex justify-between" style={{ color: '#64748b' }}>
          <span>Recency proxy ×0.15</span>
          <span className="font-mono" style={{ color: '#1e293b' }}>{(score.recencyScore * 100).toFixed(0)} pts</span>
        </div>
        <div className="pt-1.5 flex justify-between font-semibold" style={{ borderTop: '1px solid #e8e2d9' }}>
          <span style={{ color: '#64748b' }}>Final</span>
          <span className={`font-mono ${cfg.text}`}>{score.finalScore}/100</span>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
