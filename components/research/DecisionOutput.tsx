'use client'

import { motion } from 'motion/react'
import { Trophy, X, CheckCircle2, ExternalLink, Target, Zap, Shield, HelpCircle, Lightbulb } from 'lucide-react'
import type { EliteResearchOutput } from '@/lib/schemas'

interface Props {
  data: Partial<EliteResearchOutput>
  isLoading: boolean
  onGoDeeper?: (question: string) => void
}

// ── Shared primitives ──────────────────────────────────────────────
function CredibilityPip({ tier }: { tier?: string }) {
  const safe = (tier ?? 'low').toLowerCase()
  const [bg, text, border] =
    safe === 'high'   ? ['rgba(52,211,153,0.08)',  '#34d399', 'rgba(52,211,153,0.18)'] :
    safe === 'medium' ? ['rgba(251,191,36,0.07)',  '#fbbf24', 'rgba(251,191,36,0.18)'] :
                        ['rgba(255,255,255,0.03)', '#475569', 'rgba(255,255,255,0.07)']
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono tracking-[0.1em] shrink-0"
      style={{ background: bg, color: text, border: `1px solid ${border}` }}>
      {safe.toUpperCase()}
    </span>
  )
}

function scoreTextColor(score: number): string {
  return score >= 8 ? '#34d399' : score >= 6 ? '#fbbf24' : '#f87171'
}

function scoreBarColor(score: number): string {
  return score >= 8 ? '#34d399' : score >= 6 ? '#fbbf24' : '#f87171'
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-[9.5px] font-mono tracking-[0.2em] uppercase text-slate-600">{children}</span>
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, ease: [0.16, 1, 0.3, 1] }}
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

// ── Main component ─────────────────────────────────────────────────
export function DecisionOutput({ data, isLoading: _isLoading, onGoDeeper }: Props) {
  const options        = data.decisionOptions?.filter((o): o is NonNullable<typeof o> => !!o?.name) ?? []
  const criteria       = data.decisionCriteria?.filter((c): c is NonNullable<typeof c> => !!c?.name) ?? []
  const winner         = data.winner ?? ''
  const steps          = data.actionableNextSteps?.filter((s): s is string => !!s) ?? []
  const killConditions = data.killConditions?.filter((k): k is string => !!k) ?? []
  const sources        = data.sourceRegistry?.filter((s): s is NonNullable<typeof s> => !!s?.url) ?? []
  const goDeeper       = data.goDeeper?.filter((g): g is string => !!g) ?? []
  const findings       = data.keyFindings?.filter((f): f is NonNullable<typeof f> => !!f?.finding) ?? []

  return (
    <div className="space-y-3.5">

      {/* Decision Brief ──────────────────────────────────────────── */}
      {data.executiveBrief && (
        <Card delay={0} accentColor="rgba(139,92,246,0.5)">
          <div className="p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex items-center justify-center h-6 w-6 rounded-md"
                style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                <Target className="h-3 w-3 text-violet-400" />
              </div>
              <Label>Decision Brief</Label>
              {data.confidence != null && (
                <span className="ml-auto font-mono text-[10px] text-slate-600 tracking-wider">
                  {data.confidence}<span className="text-slate-700">% conf</span>
                </span>
              )}
            </div>
            <p className="text-[15px] font-light text-slate-200 leading-[1.75]">{data.executiveBrief}</p>
          </div>
        </Card>
      )}

      {/* Decision Matrix ─────────────────────────────────────────── */}
      {options.length > 0 && criteria.length > 0 && (
        <Card delay={0.05}>
          <div className="px-6 pt-5 pb-3 border-b border-white/[0.045]">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center h-6 w-6 rounded-md"
                style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>
                <span className="font-mono text-[10px] font-bold text-cyan-400">M</span>
              </div>
              <Label>Decision Matrix</Label>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <th className="text-left px-6 py-3 font-mono text-[9px] tracking-[0.18em] uppercase text-slate-600 min-w-[150px]">
                    Criterion
                  </th>
                  <th className="px-3 py-3 font-mono text-[9px] tracking-[0.15em] uppercase text-slate-700 text-center w-14">Wt.</th>
                  {options.map((opt, i) => (
                    <th key={i}
                      className="px-4 py-3 font-mono text-[10px] tracking-wider text-center min-w-[110px]"
                      style={{ color: opt.name === winner ? '#a78bfa' : '#64748b', background: opt.name === winner ? 'rgba(139,92,246,0.04)' : 'transparent' }}>
                      {opt.name === winner && <Trophy className="h-2.5 w-2.5 inline mr-1" style={{ color: '#a78bfa' }} />}
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
                      const cs    = opt.criterionScores?.find(s => s?.criterion === crit.name)
                      const score = cs?.score
                      return (
                        <td key={oi} className="px-4 py-3 text-center"
                          style={{ background: opt.name === winner ? 'rgba(139,92,246,0.025)' : 'transparent' }}>
                          {score != null ? (
                            <div className="flex flex-col items-center gap-1.5">
                              <span className="font-mono text-[13px] font-semibold tabular-nums"
                                style={{ color: scoreTextColor(score) }}>
                                {score.toFixed(1)}
                              </span>
                              <div className="w-10 h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                                <div className="h-full rounded-full transition-all duration-500"
                                  style={{ width: `${(score / 10) * 100}%`, background: scoreBarColor(score) }} />
                              </div>
                            </div>
                          ) : <span className="text-slate-700 font-mono">—</span>}
                        </td>
                      )
                    })}
                  </tr>
                ))}
                {/* Composite */}
                <tr style={{ background: 'rgba(255,255,255,0.018)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                  <td className="px-6 py-3 font-mono text-[9px] tracking-[0.18em] uppercase text-slate-500">
                    Composite Score
                  </td>
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

      {/* Winner rationale + Tradeoff ─────────────────────────────── */}
      {(data.winnerRationale || data.tradeoff) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {data.winnerRationale && (
            <Card delay={0.1} style={{ background: 'linear-gradient(160deg, #100d1f 0%, #0a1220 100%)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3.5">
                  <Trophy className="h-3.5 w-3.5 text-violet-400" />
                  <Label>Why {winner || 'the winner'}</Label>
                </div>
                <p className="text-[13.5px] text-slate-300 leading-[1.65]">{data.winnerRationale}</p>
              </div>
            </Card>
          )}
          {data.tradeoff && (
            <Card delay={0.12}>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3.5">
                  <Label>The Tradeoff</Label>
                </div>
                <p className="text-[13.5px] text-slate-400 leading-[1.65] italic">{data.tradeoff}</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Contrarian Pick ─────────────────────────────────────────── */}
      {data.contraryPick && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
          className="card-bevel rounded-2xl overflow-hidden"
          style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)' }}>
          <div className="p-5">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center h-6 w-6 rounded-md shrink-0 mt-0.5"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <Zap className="h-3 w-3 text-amber-400" />
              </div>
              <div>
                <p className="text-[9.5px] font-mono tracking-[0.18em] uppercase text-amber-400/70 mb-2">The Contrarian Pick</p>
                <p className="text-[13.5px] text-slate-300 leading-[1.65]">{data.contraryPick}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Kill Conditions ─────────────────────────────────────────── */}
      {killConditions.length > 0 && (
        <Card delay={0.16}>
          <div className="p-5">
            <div className="flex items-center gap-2.5 mb-3.5">
              <div className="flex items-center justify-center h-6 w-6 rounded-md"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <X className="h-3 w-3 text-slate-500" />
              </div>
              <Label>Kill Conditions</Label>
              <span className="text-[9px] font-mono text-slate-700 ml-0.5">— when this changes</span>
            </div>
            <div className="space-y-2.5">
              {killConditions.map((cond, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="flex items-center justify-center h-4 w-4 rounded shrink-0 mt-0.5"
                    style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                    <span className="font-mono text-[8px] font-bold text-slate-600">{i + 1}</span>
                  </div>
                  <p className="text-[13.5px] text-slate-400 leading-[1.65]">{cond}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Key Findings (competitive mode) ───────────────────────── */}
      {findings.length > 0 && (
        <Card delay={0.17}>
          <div className="p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex items-center justify-center h-6 w-6 rounded-md"
                style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                <Lightbulb className="h-3 w-3 text-violet-400" />
              </div>
              <Label>Key Findings</Label>
              <span className="ml-auto font-mono text-[10px] text-slate-700">{findings.length}</span>
            </div>
            <div className="space-y-2">
              {findings.map((f, i) => (
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
                    {f.confidence && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono tracking-[0.1em] shrink-0"
                        style={{
                          background: f.confidence === 'high' ? 'rgba(52,211,153,0.1)' : f.confidence === 'medium' ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.04)',
                          color:      f.confidence === 'high' ? '#34d399' : f.confidence === 'medium' ? '#fbbf24' : '#64748b',
                          border:     `1px solid ${f.confidence === 'high' ? 'rgba(52,211,153,0.22)' : f.confidence === 'medium' ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.08)'}`,
                        }}>
                        {f.confidence.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Adversarial Review ─────────────────────────────────────── */}
      {data.adversarialReview && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
          className="card-bevel rounded-2xl overflow-hidden"
          style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.14)' }}>
          <div className="p-5">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center h-6 w-6 rounded-md shrink-0 mt-0.5"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <Shield className="h-3 w-3 text-red-400" />
              </div>
              <div>
                <p className="text-[9.5px] font-mono tracking-[0.18em] uppercase text-red-400/70 mb-2">
                  Stress Test — Why This Could Be Wrong
                </p>
                <p className="text-[13.5px] text-slate-300 leading-[1.65]">{data.adversarialReview}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Next Steps + Sources ────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {steps.length > 0 && (
          <Card delay={0.2}>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
                <Label>Before You Commit</Label>
              </div>
              <div className="space-y-2.5">
                {steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="flex items-center justify-center h-4 w-4 rounded shrink-0 mt-0.5"
                      style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>
                      <span className="font-mono text-[8px] font-bold text-cyan-400">{i + 1}</span>
                    </div>
                    <p className="text-[13.5px] text-slate-400 leading-[1.65]">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {sources.length > 0 && (
          <Card delay={0.22}>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3.5">
                <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                <Label>Sources</Label>
                <span className="ml-auto font-mono text-[10px] text-slate-700">{sources.length}</span>
              </div>
              <div className="space-y-0.5 max-h-56 overflow-y-auto">
                {sources.map((source, i) => (
                  <a key={i} href={source.url} target="_blank" rel="noopener noreferrer"
                    className="flex flex-col gap-0.5 px-2 py-1.5 rounded-lg transition-colors group"
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
        )}
      </div>

      {/* Go Deeper ──────────────────────────────────────────────── */}
      {goDeeper.length > 0 && (
        <Card delay={0.22}>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3.5">
              <HelpCircle className="h-3.5 w-3.5 text-violet-400" />
              <Label>Go Deeper</Label>
            </div>
            <div className="space-y-1.5">
              {goDeeper.map((q, i) =>
                onGoDeeper ? (
                  <button key={i} onClick={() => onGoDeeper(q)}
                    className="w-full text-left text-[12px] text-slate-500 leading-[1.55] pl-3 py-1 pr-2 rounded-r transition-all duration-150 cursor-pointer hover:text-violet-300"
                    style={{ borderLeft: '1px solid rgba(139,92,246,0.22)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderLeftColor = 'rgba(139,92,246,0.55)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderLeftColor = 'rgba(139,92,246,0.22)' }}>
                    {q}
                  </button>
                ) : (
                  <p key={i} className="text-[12px] text-slate-500 pl-3 py-0.5"
                    style={{ borderLeft: '1px solid rgba(139,92,246,0.2)' }}>{q}</p>
                )
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Option Details ─────────────────────────────────────────── */}
      {options.length > 0 && (
        <Card delay={0.24}>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Label>Option Details</Label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {options.map((opt, i) => (
                <div key={i} className="rounded-xl p-4"
                  style={{
                    background: opt.name === winner ? 'rgba(139,92,246,0.06)' : 'rgba(255,255,255,0.02)',
                    border:     `1px solid ${opt.name === winner ? 'rgba(139,92,246,0.22)' : 'rgba(255,255,255,0.06)'}`,
                  }}>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[13px] font-semibold" style={{ color: opt.name === winner ? '#c4b5fd' : '#cbd5e1' }}>
                      {opt.name === winner && <Trophy className="h-3 w-3 inline mr-1 text-violet-400" />}
                      {opt.name}
                    </span>
                    <span className="font-mono text-[13px] font-bold tabular-nums"
                      style={{ color: scoreTextColor(opt.compositeScore ?? 0) }}>
                      {opt.compositeScore != null ? opt.compositeScore.toFixed(1) : '—'}
                    </span>
                  </div>
                  {opt.summary && (
                    <p className="text-[12px] text-slate-500 mb-2.5 leading-[1.55]">{opt.summary}</p>
                  )}
                  {opt.pros && opt.pros.length > 0 && (
                    <div className="space-y-1">
                      {opt.pros.filter(Boolean).slice(0, 2).map((pro, pi) => (
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
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
