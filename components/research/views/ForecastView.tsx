'use client'

import { motion } from 'motion/react'
import {
  Radio, Activity, Zap, Target,
  ArrowUpRight, ArrowDownRight, Minus, TrendingUp,
} from 'lucide-react'
import { Card, Label } from './primitives'
import type { ForecastSection } from '@/ai/output/structured-output'

const directionConfig = {
  accelerating: { icon: ArrowUpRight, color: '#34d399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.2)', label: 'Accelerating' },
  emerging:     { icon: TrendingUp,   color: '#818cf8', bg: 'rgba(129,140,248,0.08)', border: 'rgba(129,140,248,0.2)', label: 'Emerging' },
  peaking:      { icon: Minus,        color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.2)',  label: 'Peaking' },
  declining:    { icon: ArrowDownRight,color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)', label: 'Declining' },
}

const confidenceColor = { high: '#34d399', medium: '#fbbf24', low: '#f87171' }

export function ForecastView({ data, delay }: { data: ForecastSection; delay: number }) {
  return (
    <div className="space-y-3">
      {/* Headline */}
      {data.headline && (
        <Card delay={delay} style={{ border: '1px solid rgba(99,102,241,0.2)' }}>
          <div className="p-5 flex items-start gap-3">
            <div className="flex items-center justify-center h-6 w-6 rounded-md shrink-0 mt-0.5"
              style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)' }}>
              <Radio className="h-3 w-3 text-indigo-400" />
            </div>
            <div>
              <p className="report-section-label mb-2">The Call</p>
              <p className="text-[14px] font-semibold text-slate-800 leading-[1.55]">{data.headline}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Key Trends */}
      {data.keyTrends.length > 0 && (
        <Card delay={delay + 0.01}>
          <div className="p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex items-center justify-center h-6 w-6 rounded-md shrink-0"
                style={{ background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)' }}>
                <Activity className="h-3 w-3 text-indigo-400" />
              </div>
              <Label>Signal Tracker</Label>
            </div>
            <div className="space-y-3">
              {data.keyTrends.map((trend, i) => {
                const cfg = directionConfig[trend.direction] ?? directionConfig.emerging
                const DirIcon = cfg.icon
                return (
                  <div key={i} className="rounded-xl p-3.5" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <div className="flex items-center gap-2">
                        <DirIcon className="h-3.5 w-3.5 shrink-0" style={{ color: cfg.color }} />
                        <span className="text-[13px] font-semibold text-slate-800">{trend.signal}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[9px] font-mono tracking-[0.12em] uppercase px-1.5 py-0.5 rounded"
                          style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                          {cfg.label}
                        </span>
                        <span className="text-[9px] font-mono text-slate-600">{trend.timeHorizon}</span>
                      </div>
                    </div>
                    {trend.evidence && (
                      <p className="text-[12px] text-slate-600 leading-[1.55] ml-5">{trend.evidence}</p>
                    )}
                    <div className="flex items-center gap-1 mt-1.5 ml-5">
                      <div className="h-1 w-1 rounded-full" style={{ background: confidenceColor[trend.confidence] }} />
                      <span className="text-[9.5px] font-mono capitalize" style={{ color: confidenceColor[trend.confidence] }}>
                        {trend.confidence} confidence
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Consensus vs Contrarian */}
      {(data.consensus || data.contrarian) && (
        <div className="grid grid-cols-2 gap-3">
          {data.consensus && (
            <Card delay={delay + 0.02}>
              <div className="p-4">
                <p className="report-section-label mb-2.5">Consensus View</p>
                <p className="text-[12.5px] text-slate-600 leading-[1.6]">{data.consensus}</p>
              </div>
            </Card>
          )}
          {data.contrarian && (
            <Card delay={delay + 0.025} style={{ border: '1px solid rgba(251,191,36,0.25)' }}>
              <div className="p-4">
                <p className="report-section-label mb-2.5">Where Consensus Is Wrong</p>
                <p className="text-[12.5px] text-slate-700 leading-[1.6]">{data.contrarian}</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Wild Card */}
      {data.wildCard && (
        <motion.div
          initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: delay + 0.03, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-xl overflow-hidden"
          style={{ background: 'white', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <div className="p-5 flex items-start gap-3">
            <div className="flex items-center justify-center h-6 w-6 rounded-md shrink-0 mt-0.5"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
              <Zap className="h-3 w-3 text-red-500" />
            </div>
            <div>
              <p className="report-section-label mb-2">Wild Card Scenario</p>
              <p className="text-[13.5px] text-slate-700 leading-[1.65]">{data.wildCard}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Implications */}
      {data.implications && (
        <Card delay={delay + 0.035} style={{ border: '1px solid rgba(20,184,166,0.25)' }}>
          <div className="p-5 flex items-start gap-3">
            <div className="flex items-center justify-center h-6 w-6 rounded-md shrink-0 mt-0.5"
              style={{ background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.2)' }}>
              <Target className="h-3 w-3 text-teal-600" />
            </div>
            <div>
              <p className="report-section-label mb-2">What To Do With This</p>
              <p className="text-[13.5px] text-slate-700 leading-[1.65]">{data.implications}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
