'use client'

import { motion } from 'motion/react'
import {
  BookOpen, Lightbulb, AlertTriangle, CheckCircle2,
  ExternalLink, Shield, HelpCircle, Target, Trophy, Zap, X, MessageSquare, TrendingUp, RotateCcw,
  Radio, ArrowUpRight, ArrowDownRight, Minus, Activity,
} from 'lucide-react'
import type { ForecastSection } from '@/ai/output/structured-output'
import { toStructuredOutput } from '@/ai/output/structured-output'
import type { StructuredOutput } from '@/ai/output/structured-output'
import type { EliteResearchOutput } from '@/ai/schemas'

interface Props {
  data: Partial<EliteResearchOutput>
  isLoading: boolean
  onGoDeeper?: (question: string) => void
}

// ── Shared primitives ──────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-[9.5px] font-mono tracking-[0.2em] uppercase text-slate-600">{children}</span>
}

function ConfidencePip({ level }: { level: string }) {
  const s = level.toLowerCase()
  const [bg, fg, border] =
    s === 'high'   ? ['rgba(52,211,153,0.1)',  '#34d399', 'rgba(52,211,153,0.22)']  :
    s === 'medium' ? ['rgba(251,191,36,0.08)', '#fbbf24', 'rgba(251,191,36,0.2)']   :
                     ['rgba(255,255,255,0.04)', '#64748b', 'rgba(255,255,255,0.08)']
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono tracking-[0.1em] shrink-0"
      style={{ background: bg, color: fg, border: `1px solid ${border}` }}>
      {s.toUpperCase()}
    </span>
  )
}

function CredibilityPip({ tier }: { tier?: string }) {
  const s = (tier ?? 'low').toLowerCase()
  const [bg, fg, border] =
    s === 'high'   ? ['rgba(52,211,153,0.08)',  '#34d399', 'rgba(52,211,153,0.18)']  :
    s === 'medium' ? ['rgba(251,191,36,0.07)',  '#fbbf24', 'rgba(251,191,36,0.18)']  :
                     ['rgba(255,255,255,0.03)', '#475569', 'rgba(255,255,255,0.07)']
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono tracking-[0.1em] shrink-0"
      style={{ background: bg, color: fg, border: `1px solid ${border}` }}>
      {s.toUpperCase()}
    </span>
  )
}

interface CardProps {
  children: React.ReactNode
  delay?: number
  accentColor?: string
  className?: string
  style?: React.CSSProperties
}

function Card({ children, delay = 0, accentColor, className = '', style }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`card-bevel rounded-2xl overflow-hidden ${className}`}
      style={{ background: 'linear-gradient(160deg, #0d192a 0%, #0a1220 100%)', border: '1px solid rgba(255,255,255,0.072)', ...style }}
    >
      {accentColor && (
        <div className="h-px" style={{ background: `linear-gradient(90deg, transparent 0%, ${accentColor} 50%, transparent 100%)` }} />
      )}
      {children}
    </motion.div>
  )
}

function scoreColor(score: number) {
  return score >= 8 ? '#34d399' : score >= 6 ? '#fbbf24' : '#f87171'
}

// ── 1. Executive Answer ────────────────────────────────────────────────────────

function ExecutiveAnswer({ data, delay }: { data: StructuredOutput['executiveAnswer']; delay: number }) {
  if (!data.brief) return null
  return (
    <Card delay={delay} accentColor="rgba(59,130,246,0.5)">
      <div className="p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex items-center justify-center h-6 w-6 rounded-md"
            style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <BookOpen className="h-3 w-3 text-blue-400" />
          </div>
          <Label>Executive Answer</Label>
          {data.confidence > 0 && (
            <span className="ml-auto font-mono text-[10px] text-slate-600 tracking-wider">
              {data.confidence}<span className="text-slate-700">% conf</span>
            </span>
          )}
        </div>
        <p className="text-[15px] font-light text-slate-200 leading-[1.75]">{data.brief}</p>
      </div>
    </Card>
  )
}

// ── 2. Decision Breakdown ──────────────────────────────────────────────────────

function DecisionBreakdown({ data, delay }: { data: NonNullable<StructuredOutput['decisionBreakdown']>; delay: number }) {
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

// ── 3. Evidence & Insights ─────────────────────────────────────────────────────

function EvidenceAndInsights({ data, delay }: { data: StructuredOutput['evidenceAndInsights']; delay: number }) {
  const { overview, keyFindings, expertConsensus } = data
  if (!overview && keyFindings.length === 0 && !expertConsensus) return null

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
              <Label>Key Findings</Label>
              <span className="ml-auto font-mono text-[10px] text-slate-700">{keyFindings.length}</span>
            </div>
            <div className="space-y-2">
              {keyFindings.map((f, i) => (
                <div key={i} className="p-3.5 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.022)', border: '1px solid rgba(255,255,255,0.052)' }}>
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center h-5 w-5 rounded-md shrink-0 mt-0.5"
                      style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                      <span className="font-mono text-[9px] font-bold text-violet-400">{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] text-slate-300 leading-[1.65]">{f.finding}</p>
                      {f.sourceContext && (
                        <p className="text-[11px] text-slate-600 mt-1.5 italic">{f.sourceContext}</p>
                      )}
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

      {expertConsensus && (
        <Card delay={delay + 0.015}>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <Label>Expert Consensus</Label>
            </div>
            <div className="space-y-2.5">
              {expertConsensus.split('\n').filter(Boolean).map((para, i) => (
                <p key={i} className="text-[13.5px] text-slate-300 leading-[1.65]">{para}</p>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

// ── 4. Risks ───────────────────────────────────────────────────────────────────

function Risks({ risks, delay }: { risks: StructuredOutput['risks']; delay: number }) {
  if (risks.length === 0) return null
  return (
    <Card delay={delay} accentColor="rgba(245,158,11,0.4)">
      <div className="p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex items-center justify-center h-6 w-6 rounded-md"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)' }}>
            <AlertTriangle className="h-3 w-3 text-amber-400" />
          </div>
          <Label>Risks</Label>
          <span className="ml-auto font-mono text-[10px] text-slate-700">{risks.length}</span>
        </div>
        <div className="space-y-2.5">
          {risks.map((risk, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex items-center justify-center h-4 w-4 rounded shrink-0 mt-0.5"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <span className="font-mono text-[8px] font-bold text-amber-400">{i + 1}</span>
              </div>
              <p className="text-[13.5px] text-slate-300 leading-[1.65]">{risk}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

// ── 5. What This Misses ────────────────────────────────────────────────────────

function WhatThisMisses({ data, delay }: { data: StructuredOutput['whatThisMisses']; delay: number }) {
  const { adversarialReview, misconceptions } = data
  if (!adversarialReview && misconceptions.length === 0) return null

  return (
    <div className="space-y-3.5">
      {adversarialReview && (
        <motion.div
          initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay, ease: [0.16, 1, 0.3, 1] }}
          className="card-bevel rounded-2xl overflow-hidden"
          style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.14)' }}
        >
          <div className="p-5 flex items-start gap-3">
            <div className="flex items-center justify-center h-6 w-6 rounded-md shrink-0 mt-0.5"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <Shield className="h-3 w-3 text-red-400" />
            </div>
            <div>
              <p className="text-[9.5px] font-mono tracking-[0.18em] uppercase text-red-400/70 mb-2">What This Misses</p>
              <p className="text-[13.5px] text-slate-300 leading-[1.65]">{adversarialReview}</p>
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
                  <span className="font-mono text-[11px] text-amber-500 mt-0.5 shrink-0">✗</span>
                  <p className="text-[13.5px] text-slate-400 leading-[1.65]">{m}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

// ── 6. Action Plan ─────────────────────────────────────────────────────────────

function ActionPlan({ data, delay }: { data: StructuredOutput['actionPlan']; delay: number }) {
  const { steps, implications } = data
  if (steps.length === 0 && !implications) return null

  return (
    <Card delay={delay} accentColor="rgba(6,182,212,0.3)">
      <div className="p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
          <Label>Action Plan</Label>
        </div>
        {implications && (
          <p className="text-[13.5px] text-slate-400 leading-[1.65] italic mb-4">{implications}</p>
        )}
        {steps.length > 0 && (
          <div className="space-y-2.5">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="flex items-center justify-center h-4 w-4 rounded shrink-0 mt-0.5"
                  style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>
                  <span className="font-mono text-[8px] font-bold text-cyan-400">{i + 1}</span>
                </div>
                <p className="text-[13.5px] text-slate-300 leading-[1.65]">{step}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}

// ── Go Deeper (standalone, interactive) ───────────────────────────────────────

function GoDeeperCard({
  data, delay, onGoDeeper,
}: {
  data: StructuredOutput['goDeeper']
  delay: number
  onGoDeeper?: (q: string) => void
}) {
  if (data.questions.length === 0) return null
  return (
    <Card delay={delay}>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3.5">
          <HelpCircle className="h-3.5 w-3.5 text-violet-400" />
          <Label>Go Deeper</Label>
          <span className="ml-auto font-mono text-[10px] text-slate-700">{data.questions.length}</span>
        </div>
        <div className="space-y-1.5">
          {data.questions.map((q, i) =>
            onGoDeeper ? (
              <button key={i} onClick={() => onGoDeeper(q)}
                className="w-full text-left text-[13px] text-slate-400 leading-[1.6] pl-3.5 py-1.5 pr-2 rounded-r transition-all duration-150 hover:text-violet-300"
                style={{ borderLeft: '2px solid rgba(139,92,246,0.25)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderLeftColor = 'rgba(139,92,246,0.6)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderLeftColor = 'rgba(139,92,246,0.25)' }}>
                {q}
              </button>
            ) : (
              <p key={i} className="text-[13px] text-slate-500 leading-[1.6] pl-3.5 py-1"
                style={{ borderLeft: '2px solid rgba(139,92,246,0.2)' }}>{q}</p>
            )
          )}
        </div>
      </div>
    </Card>
  )
}

// ── 7. Sources ─────────────────────────────────────────────────────────────────

function Sources({ sources, delay }: { sources: StructuredOutput['sources']; delay: number }) {
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

// ── 8. Perspectives View (ECHO) ───────────────────────────────────────────────

function PerspectivesView({ data, delay }: { data: NonNullable<StructuredOutput['perspectives']>; delay: number }) {
  const { sides, commonGround } = data
  if (sides.length === 0 && !commonGround) return null

  return (
    <div className="space-y-3.5">
      {sides.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {sides.map((side, i) => (
            <Card key={i} delay={delay + i * 0.03}
              style={{
                background: i % 2 === 0
                  ? 'linear-gradient(160deg, #0e1a2e 0%, #0a1220 100%)'
                  : 'linear-gradient(160deg, #1a0e2e 0%, #0a1220 100%)',
                border: `1px solid ${i % 2 === 0 ? 'rgba(59,130,246,0.2)' : 'rgba(139,92,246,0.2)'}`,
              }}>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center justify-center h-6 w-6 rounded-md"
                    style={{
                      background: i % 2 === 0 ? 'rgba(59,130,246,0.1)' : 'rgba(139,92,246,0.1)',
                      border: `1px solid ${i % 2 === 0 ? 'rgba(59,130,246,0.2)' : 'rgba(139,92,246,0.2)'}`,
                    }}>
                    <MessageSquare className="h-3 w-3" style={{ color: i % 2 === 0 ? '#60a5fa' : '#a78bfa' }} />
                  </div>
                  <span className="text-[11px] font-semibold" style={{ color: i % 2 === 0 ? '#60a5fa' : '#a78bfa' }}>
                    {side.label}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {side.points.filter(Boolean).map((point, pi) => (
                    <div key={pi} className="flex items-start gap-2.5">
                      <span className="font-mono text-[11px] mt-0.5 shrink-0"
                        style={{ color: i % 2 === 0 ? '#3b82f6' : '#8b5cf6' }}>·</span>
                      <p className="text-[13.5px] text-slate-300 leading-[1.65]">{point}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {commonGround && (
        <motion.div
          initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: delay + 0.04, ease: [0.16, 1, 0.3, 1] }}
          className="card-bevel rounded-2xl overflow-hidden"
          style={{ background: 'rgba(52,211,153,0.04)', border: '1px solid rgba(52,211,153,0.14)' }}
        >
          <div className="p-5 flex items-start gap-3">
            <div className="flex items-center justify-center h-6 w-6 rounded-md shrink-0 mt-0.5"
              style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            </div>
            <div>
              <p className="text-[9.5px] font-mono tracking-[0.18em] uppercase text-emerald-400/70 mb-2">Common Ground</p>
              <p className="text-[13.5px] text-slate-300 leading-[1.65]">{commonGround}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// ── 9. Challenge View (CRITIC) ────────────────────────────────────────────────

function ChallengeView({ data, delay }: { data: NonNullable<StructuredOutput['challenge']>; delay: number }) {
  const { verdict, risks, blindSpots, misconceptions, adversarialReview } = data
  if (!verdict && risks.length === 0 && blindSpots.length === 0) return null

  return (
    <div className="space-y-3.5">
      {verdict && (
        <motion.div
          initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay, ease: [0.16, 1, 0.3, 1] }}
          className="card-bevel rounded-2xl overflow-hidden"
          style={{ background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.18)' }}
        >
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(244,63,94,0.5) 50%, transparent 100%)' }} />
          <div className="p-5">
            <p className="text-[9.5px] font-mono tracking-[0.18em] uppercase text-rose-400/70 mb-3">Verdict</p>
            <p className="text-[14px] text-slate-200 leading-[1.72] font-light">{verdict}</p>
          </div>
        </motion.div>
      )}

      {risks.length > 0 && (
        <Card delay={delay + 0.02} accentColor="rgba(245,158,11,0.4)">
          <div className="p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex items-center justify-center h-6 w-6 rounded-md"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)' }}>
                <AlertTriangle className="h-3 w-3 text-amber-400" />
              </div>
              <Label>Risks &amp; Weaknesses</Label>
              <span className="ml-auto font-mono text-[10px] text-slate-700">{risks.length}</span>
            </div>
            <div className="space-y-2.5">
              {risks.map((risk, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex items-center justify-center h-4 w-4 rounded shrink-0 mt-0.5"
                    style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                    <span className="font-mono text-[8px] font-bold text-amber-400">{i + 1}</span>
                  </div>
                  <p className="text-[13.5px] text-slate-300 leading-[1.65]">{risk}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {(blindSpots.length > 0 || misconceptions.length > 0) && (
        <Card delay={delay + 0.035}>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle className="h-3.5 w-3.5 text-violet-400" />
              <Label>What This Argument Gets Wrong</Label>
            </div>
            <div className="space-y-2">
              {blindSpots.map((spot, i) => (
                <div key={`bs-${i}`} className="flex items-start gap-2.5 p-2.5 rounded-lg"
                  style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.1)' }}>
                  <span className="font-mono text-[11px] text-violet-400 mt-0.5 shrink-0">◈</span>
                  <p className="text-[13.5px] text-slate-300 leading-[1.65]">{spot}</p>
                </div>
              ))}
              {misconceptions.map((m, i) => (
                <div key={`mc-${i}`} className="flex items-start gap-2.5 p-2.5 rounded-lg"
                  style={{ background: 'rgba(244,63,94,0.04)', border: '1px solid rgba(244,63,94,0.1)' }}>
                  <span className="font-mono text-[11px] text-rose-400 mt-0.5 shrink-0">✗</span>
                  <p className="text-[13.5px] text-slate-400 leading-[1.65]">{m}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {adversarialReview && (
        <motion.div
          initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: delay + 0.06, ease: [0.16, 1, 0.3, 1] }}
          className="card-bevel rounded-2xl overflow-hidden"
          style={{ background: 'rgba(52,211,153,0.04)', border: '1px solid rgba(52,211,153,0.14)' }}
        >
          <div className="p-5 flex items-start gap-3">
            <div className="flex items-center justify-center h-6 w-6 rounded-md shrink-0 mt-0.5"
              style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>
              <Shield className="h-3 w-3 text-emerald-400" />
            </div>
            <div>
              <p className="text-[9.5px] font-mono tracking-[0.18em] uppercase text-emerald-400/70 mb-2">Steelman</p>
              <p className="text-[13.5px] text-slate-300 leading-[1.65]">{adversarialReview}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// ── 10. Execution View (FORGE) ────────────────────────────────────────────────

function ExecutionView({ data, delay }: { data: NonNullable<StructuredOutput['execution']>; delay: number }) {
  const { steps, resourcesNeeded, potentialBlockers, adversarialReview } = data
  if (steps.length === 0) return null

  return (
    <div className="space-y-3.5">
      <Card delay={delay} accentColor="rgba(249,115,22,0.4)">
        <div className="p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="flex items-center justify-center h-6 w-6 rounded-md"
              style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
              <CheckCircle2 className="h-3 w-3 text-orange-400" />
            </div>
            <Label>Step-by-Step Plan</Label>
            <span className="ml-auto font-mono text-[10px] text-slate-700">{steps.length} steps</span>
          </div>
          <div className="space-y-3">
            {steps.map((s, i) => (
              <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl"
                style={{ background: 'rgba(249,115,22,0.04)', border: '1px solid rgba(249,115,22,0.1)' }}>
                <div className="flex items-center justify-center h-6 w-6 rounded-lg shrink-0"
                  style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)' }}>
                  <span className="font-mono text-[11px] font-bold text-orange-400">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-semibold text-slate-200 leading-tight mb-1">{s.step}</p>
                  <p className="text-[12.5px] text-slate-400 leading-[1.6]">{s.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {resourcesNeeded && (
          <Card delay={delay + 0.025}>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3.5">
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                <Label>Resources Needed</Label>
              </div>
              <p className="text-[13.5px] text-slate-300 leading-[1.65]">{resourcesNeeded}</p>
            </div>
          </Card>
        )}

        {potentialBlockers.length > 0 && (
          <Card delay={delay + 0.035}
            style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)' }}>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3.5">
                <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                <Label>Potential Blockers</Label>
              </div>
              <div className="space-y-2">
                {potentialBlockers.map((b, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="font-mono text-[11px] text-red-400 mt-0.5 shrink-0">!</span>
                    <p className="text-[13px] text-slate-400 leading-[1.65]">{b}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>

      {adversarialReview && (
        <motion.div
          initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: delay + 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="card-bevel rounded-2xl overflow-hidden"
          style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.14)' }}
        >
          <div className="p-5 flex items-start gap-3">
            <div className="flex items-center justify-center h-6 w-6 rounded-md shrink-0 mt-0.5"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <Shield className="h-3 w-3 text-red-400" />
            </div>
            <div>
              <p className="text-[9.5px] font-mono tracking-[0.18em] uppercase text-red-400/70 mb-2">Most Likely Failure Point</p>
              <p className="text-[13.5px] text-slate-300 leading-[1.65]">{adversarialReview}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// ── 11. Analysis View (CIPHER) ────────────────────────────────────────────────

function AnalysisView({ data, delay }: { data: NonNullable<StructuredOutput['analysis']>; delay: number }) {
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

// ── 12. Understanding View (SAGE) ─────────────────────────────────────────────

function UnderstandingView({ data, delay }: { data: NonNullable<StructuredOutput['understanding']>; delay: number }) {
  const { overview, analogy, keyTakeaway, mechanisms, misconceptions } = data
  if (!overview && !analogy && mechanisms.length === 0) return null

  return (
    <div className="space-y-3.5">
      {overview && (
        <Card delay={delay} accentColor="rgba(20,184,166,0.3)">
          <div className="p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex items-center justify-center h-6 w-6 rounded-md"
                style={{ background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.2)' }}>
                <Lightbulb className="h-3 w-3 text-teal-400" />
              </div>
              <Label>The Explanation</Label>
            </div>
            <div className="space-y-3">
              {overview.split('\n').filter(Boolean).map((para, i) => (
                <p key={i} className="text-[14px] text-slate-300 leading-[1.72]">{para}</p>
              ))}
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {analogy && (
          <motion.div
            initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, delay: delay + 0.02, ease: [0.16, 1, 0.3, 1] }}
            className="card-bevel rounded-2xl overflow-hidden"
            style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.16)' }}
          >
            <div className="p-5">
              <p className="text-[9.5px] font-mono tracking-[0.18em] uppercase text-amber-400/70 mb-3">Think of it like…</p>
              <p className="text-[13.5px] text-slate-300 leading-[1.65] italic">{analogy}</p>
            </div>
          </motion.div>
        )}

        {keyTakeaway && (
          <motion.div
            initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, delay: delay + 0.03, ease: [0.16, 1, 0.3, 1] }}
            className="card-bevel rounded-2xl overflow-hidden"
            style={{ background: 'rgba(20,184,166,0.05)', border: '1px solid rgba(20,184,166,0.18)' }}
          >
            <div className="p-5">
              <p className="text-[9.5px] font-mono tracking-[0.18em] uppercase text-teal-400/70 mb-3">Key Takeaway</p>
              <p className="text-[14px] font-medium text-teal-200 leading-[1.65]">{keyTakeaway}</p>
            </div>
          </motion.div>
        )}
      </div>

      {mechanisms.length > 0 && (
        <Card delay={delay + 0.04}>
          <div className="p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <Label>How It Works</Label>
            </div>
            <div className="space-y-2">
              {mechanisms.map((f, i) => (
                <div key={i} className="p-3.5 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.022)', border: '1px solid rgba(255,255,255,0.052)' }}>
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center h-5 w-5 rounded-md shrink-0 mt-0.5"
                      style={{ background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.2)' }}>
                      <span className="font-mono text-[9px] font-bold text-teal-400">{i + 1}</span>
                    </div>
                    <p className="text-[13.5px] text-slate-300 leading-[1.65]">{f.finding}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {misconceptions.length > 0 && (
        <Card delay={delay + 0.025}>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3.5">
              <X className="h-3.5 w-3.5 text-slate-500" />
              <Label>Common Misunderstandings</Label>
            </div>
            <div className="space-y-2.5">
              {misconceptions.map((m, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="font-mono text-[11px] text-amber-500 mt-0.5 shrink-0">✗</span>
                  <p className="text-[13.5px] text-slate-400 leading-[1.65]">{m}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

// ── Forecast (PULSE) ──────────────────────────────────────────────────────────

const directionConfig = {
  accelerating: { icon: ArrowUpRight, color: '#34d399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.2)', label: 'Accelerating' },
  emerging:     { icon: TrendingUp,   color: '#818cf8', bg: 'rgba(129,140,248,0.08)', border: 'rgba(129,140,248,0.2)', label: 'Emerging' },
  peaking:      { icon: Minus,        color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.2)',  label: 'Peaking' },
  declining:    { icon: ArrowDownRight,color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)', label: 'Declining' },
}

const confidenceColor = { high: '#34d399', medium: '#fbbf24', low: '#f87171' }

function ForecastView({ data, delay }: { data: ForecastSection; delay: number }) {
  return (
    <div className="space-y-3">
      {/* Headline */}
      {data.headline && (
        <Card delay={delay} style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <div className="p-5 flex items-start gap-3">
            <div className="flex items-center justify-center h-6 w-6 rounded-md shrink-0 mt-0.5"
              style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)' }}>
              <Radio className="h-3 w-3 text-indigo-400" />
            </div>
            <div>
              <p className="text-[9.5px] font-mono tracking-[0.18em] uppercase text-indigo-400/70 mb-2">The Call</p>
              <p className="text-[14px] font-semibold text-slate-100 leading-[1.55]">{data.headline}</p>
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
                        <span className="text-[13px] font-semibold text-slate-100">{trend.signal}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[9px] font-mono tracking-[0.12em] uppercase px-1.5 py-0.5 rounded"
                          style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                          {cfg.label}
                        </span>
                        <span className="text-[9px] font-mono text-slate-500">{trend.timeHorizon}</span>
                      </div>
                    </div>
                    {trend.evidence && (
                      <p className="text-[12px] text-slate-400 leading-[1.55] ml-5">{trend.evidence}</p>
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
                <p className="text-[9.5px] font-mono tracking-[0.18em] uppercase text-slate-500 mb-2.5">Consensus View</p>
                <p className="text-[12.5px] text-slate-400 leading-[1.6]">{data.consensus}</p>
              </div>
            </Card>
          )}
          {data.contrarian && (
            <Card delay={delay + 0.025} style={{ background: 'rgba(251,191,36,0.04)', border: '1px solid rgba(251,191,36,0.15)' }}>
              <div className="p-4">
                <p className="text-[9.5px] font-mono tracking-[0.18em] uppercase text-amber-400/70 mb-2.5">Where Consensus Is Wrong</p>
                <p className="text-[12.5px] text-slate-300 leading-[1.6]">{data.contrarian}</p>
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
          className="card-bevel rounded-2xl overflow-hidden"
          style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.14)' }}
        >
          <div className="p-5 flex items-start gap-3">
            <div className="flex items-center justify-center h-6 w-6 rounded-md shrink-0 mt-0.5"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <Zap className="h-3 w-3 text-red-400" />
            </div>
            <div>
              <p className="text-[9.5px] font-mono tracking-[0.18em] uppercase text-red-400/70 mb-2">Wild Card Scenario</p>
              <p className="text-[13.5px] text-slate-300 leading-[1.65]">{data.wildCard}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Implications */}
      {data.implications && (
        <Card delay={delay + 0.035} style={{ background: 'rgba(20,184,166,0.04)', border: '1px solid rgba(20,184,166,0.15)' }}>
          <div className="p-5 flex items-start gap-3">
            <div className="flex items-center justify-center h-6 w-6 rounded-md shrink-0 mt-0.5"
              style={{ background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.2)' }}>
              <Target className="h-3 w-3 text-teal-400" />
            </div>
            <div>
              <p className="text-[9.5px] font-mono tracking-[0.18em] uppercase text-teal-400/70 mb-2">What To Do With This</p>
              <p className="text-[13.5px] text-slate-300 leading-[1.65]">{data.implications}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

// ── Main export ────────────────────────────────────────────────────────────────

export function StructuredOutputView({ data, isLoading: _isLoading, onGoDeeper }: Props) {
  const s = toStructuredOutput(data)
  const mode = s.executiveAnswer.queryMode

  // Modes where Action Plan is meaningful (the model produces real next steps)
  const showActionPlan = mode !== 'action' && mode !== 'perspectives' && mode !== 'forecast'
  // Modes where Go Deeper questions add real value
  const showGoDeeper = mode !== 'decision' && mode !== 'action'

  return (
    <div className="space-y-3.5">
      {/* Universal: executive answer */}
      <ExecutiveAnswer data={s.executiveAnswer} delay={0} />

      {/* Mode-specific primary content */}
      {mode === 'decision' && s.decisionBreakdown && (
        <DecisionBreakdown data={s.decisionBreakdown} delay={0.02} />
      )}
      {mode === 'perspectives' && s.perspectives && (
        <PerspectivesView data={s.perspectives} delay={0.02} />
      )}
      {mode === 'competitive' && s.challenge && (
        <ChallengeView data={s.challenge} delay={0.02} />
      )}
      {mode === 'action' && s.execution && (
        <ExecutionView data={s.execution} delay={0.02} />
      )}
      {mode === 'intelligence' && s.analysis && (
        <AnalysisView data={s.analysis} delay={0.02} />
      )}
      {mode === 'research' && (
        <EvidenceAndInsights data={s.evidenceAndInsights} delay={0.03} />
      )}
      {mode === 'explainer' && s.understanding && (
        <UnderstandingView data={s.understanding} delay={0.03} />
      )}
      {mode === 'forecast' && s.forecast && (
        <ForecastView data={s.forecast} delay={0.02} />
      )}

      {/* Universal secondary — shown where relevant */}
      {s.risks.length > 0 && mode !== 'competitive' && mode !== 'action' && (
        <Risks risks={s.risks} delay={0.05} />
      )}
      {mode !== 'competitive' && mode !== 'action' && mode !== 'explainer' && (
        <WhatThisMisses data={s.whatThisMisses} delay={0.07} />
      )}
      {showActionPlan && (
        <ActionPlan data={s.actionPlan} delay={0.08} />
      )}
      {showGoDeeper && (
        <GoDeeperCard data={s.goDeeper} delay={0.09} onGoDeeper={onGoDeeper} />
      )}

      {/* Universal: sources */}
      <Sources sources={s.sources} delay={0.1} />
    </div>
  )
}
