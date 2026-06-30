'use client'

import { motion } from 'motion/react'
import { Target, Trophy, Zap, RotateCcw } from 'lucide-react'
import { Card, Label, scoreColor } from './primitives'
import type { StructuredOutput } from '@/ai/output/structured-output'

export function DecisionBreakdown({ data, delay }: { data: NonNullable<StructuredOutput['decisionBreakdown']>; delay: number }) {
  const { criteria, winner, winnerRationale, tradeoff, contraryPick, killConditions } = data
  const options = data.options.slice(0, 3)
  if (options.length === 0 && !winner) return null

  return (
    <div className="space-y-3.5">

      {/* Criteria / options matrix */}
      {options.length > 0 && criteria.length > 0 && (
        <Card delay={delay}>
          <div className="px-6 pt-5 pb-3 border-b border-white/[0.045]">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center h-6 w-6 rounded-md"
                style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                <Target className="h-3 w-3 text-violet-400" />
              </div>
              <Label>Decision Breakdown</Label>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <th className="text-left px-6 py-3 font-mono text-[9px] tracking-[0.18em] uppercase text-slate-600 min-w-[150px]">Criterion</th>
                  <th className="px-3 py-3 font-mono text-[9px] tracking-[0.15em] uppercase text-slate-700 text-center w-14">Wt.</th>
                  {options.map((opt, i) => (
                    <th key={i}
                      className="px-4 py-3 font-mono text-[10px] tracking-wider text-center min-w-[110px]"
                      style={{ color: opt.name === winner ? '#a78bfa' : '#64748b', background: opt.name === winner ? 'rgba(139,92,246,0.04)' : 'transparent' }}>
                      {opt.name === winner && <Trophy className="h-2.5 w-2.5 inline mr-1 text-violet-400" />}
                      {opt.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {criteria.map((crit, ci) => (
                  <tr key={ci} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td className="px-6 py-3 text-[13px] text-slate-400">{crit.name}</td>
                    <td className="px-3 py-3 text-center">
                      <span className="font-mono text-[11px] text-slate-600">{crit.weight}%</span>
                    </td>
                    {options.map((opt, oi) => {
                      const score = opt.criterionScores?.find(s => s?.criterion === crit.name)?.score
                      return (
                        <td key={oi} className="px-4 py-3 text-center"
                          style={{ background: opt.name === winner ? 'rgba(139,92,246,0.025)' : 'transparent' }}>
                          {score != null ? (
                            <div className="flex flex-col items-center gap-1.5">
                              <span className="font-mono text-[13px] font-semibold tabular-nums"
                                style={{ color: scoreColor(score) }}>{score.toFixed(1)}</span>
                              <div className="w-10 h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                                <div className="h-full rounded-full"
                                  style={{ width: `${(score / 10) * 100}%`, background: scoreColor(score) }} />
                              </div>
                            </div>
                          ) : <span className="text-slate-700 font-mono">—</span>}
                        </td>
                      )
                    })}
                  </tr>
                ))}
                <tr style={{ background: 'rgba(255,255,255,0.018)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                  <td className="px-6 py-3 font-mono text-[9px] tracking-[0.18em] uppercase text-slate-500">Composite Score</td>
                  <td />
                  {options.map((opt, oi) => (
                    <td key={oi} className="px-4 py-3 text-center"
                      style={{ background: opt.name === winner ? 'rgba(139,92,246,0.05)' : 'transparent' }}>
                      <span className="font-mono text-[15px] font-bold tabular-nums"
                        style={{ color: opt.name === winner ? '#a78bfa' : '#64748b' }}>
                        {opt.compositeScore != null ? opt.compositeScore.toFixed(1) : '—'}
                      </span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Winner narrative + tradeoff */}
      {(winnerRationale || tradeoff) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {winnerRationale && (
            <Card delay={delay + 0.02}
              style={{ background: 'linear-gradient(160deg, #100d1f 0%, #0a1220 100%)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3.5">
                  <Trophy className="h-3.5 w-3.5 text-violet-400" />
                  <Label>Why {winner || 'the winner'}</Label>
                </div>
                <p className="text-[13.5px] text-slate-300 leading-[1.65]">{winnerRationale}</p>
              </div>
            </Card>
          )}
          {tradeoff && (
            <Card delay={delay + 0.015}>
              <div className="p-5">
                <Label>The Tradeoff</Label>
                <p className="text-[13.5px] text-slate-400 leading-[1.65] italic mt-3.5">{tradeoff}</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Contrarian pick */}
      {contraryPick && (
        <motion.div
          initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: delay + 0.04, ease: [0.16, 1, 0.3, 1] }}
          className="card-bevel rounded-2xl overflow-hidden"
          style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)' }}
        >
          <div className="p-5 flex items-start gap-3">
            <div className="flex items-center justify-center h-6 w-6 rounded-md shrink-0 mt-0.5"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <Zap className="h-3 w-3 text-amber-400" />
            </div>
            <div>
              <p className="text-[9.5px] font-mono tracking-[0.18em] uppercase text-amber-400/70 mb-2">The Contrarian Pick</p>
              <p className="text-[13.5px] text-slate-300 leading-[1.65]">{contraryPick}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Kill Conditions — when to reverse course */}
      {killConditions.length > 0 && (
        <Card delay={delay + 0.045}
          style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.14)' }}>
          <div className="p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex items-center justify-center h-6 w-6 rounded-md shrink-0"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <RotateCcw className="h-3 w-3 text-red-400" />
              </div>
              <Label>When to Reverse Course</Label>
            </div>
            <div className="space-y-2.5">
              {killConditions.map((condition, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="font-mono text-[11px] text-red-400 mt-0.5 shrink-0">✗</span>
                  <p className="text-[13.5px] text-slate-300 leading-[1.65]">{condition}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Option detail cards */}
      {options.length > 0 && (
        <Card delay={delay + 0.025}>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Label>Option Details</Label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {options.map((opt, i) => (
                <div key={i} className="rounded-xl p-4"
                  style={{
                    background: opt.name === winner ? 'rgba(139,92,246,0.06)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${opt.name === winner ? 'rgba(139,92,246,0.22)' : 'rgba(255,255,255,0.06)'}`,
                  }}>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[13px] font-semibold"
                      style={{ color: opt.name === winner ? '#c4b5fd' : '#cbd5e1' }}>
                      {opt.name === winner && <Trophy className="h-3 w-3 inline mr-1 text-violet-400" />}
                      {opt.name}
                    </span>
                    <span className="font-mono text-[13px] font-bold tabular-nums"
                      style={{ color: scoreColor(opt.compositeScore ?? 0) }}>
                      {opt.compositeScore != null ? opt.compositeScore.toFixed(1) : '—'}
                    </span>
                  </div>
                  {opt.summary && <p className="text-[12px] text-slate-500 mb-2.5 leading-[1.55]">{opt.summary}</p>}
                  <div className="space-y-1">
                    {opt.pros?.filter(Boolean).slice(0, 2).map((pro, pi) => (
                      <div key={pi} className="flex items-start gap-1.5">
                        <span className="text-[11px] font-mono text-emerald-400 mt-0.5 shrink-0">+</span>
                        <span className="text-[12px] text-slate-400">{pro}</span>
                      </div>
                    ))}
                    {opt.cons?.filter(Boolean).slice(0, 1).map((con, ci) => (
                      <div key={ci} className="flex items-start gap-1.5">
                        <span className="text-[11px] font-mono text-red-400 mt-0.5 shrink-0">−</span>
                        <span className="text-[12px] text-slate-500">{con}</span>
                      </div>
                    ))}
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
