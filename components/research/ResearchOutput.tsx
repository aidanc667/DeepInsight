'use client'

import { motion } from 'motion/react'
import {
  BookOpen, Lightbulb, AlertTriangle, CheckCircle2,
  ExternalLink, Shield, ArrowRight, HelpCircle
} from 'lucide-react'
import type { EliteResearchOutput } from '@/lib/schemas'

interface Props {
  data: Partial<EliteResearchOutput>
  isLoading: boolean
  onGoDeeper?: (question: string) => void
}

// ── Shared primitives ──────────────────────────────────────────────
function ConfidencePip({ level }: { level: string }) {
  const safe = (level ?? '').toLowerCase()
  const [bg, text, border] =
    safe === 'high'   ? ['rgba(52,211,153,0.1)',  '#34d399', 'rgba(52,211,153,0.22)'] :
    safe === 'medium' ? ['rgba(251,191,36,0.08)', '#fbbf24', 'rgba(251,191,36,0.2)'] :
                        ['rgba(255,255,255,0.04)', '#64748b', 'rgba(255,255,255,0.08)']
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono tracking-[0.1em] shrink-0"
      style={{ background: bg, color: text, border: `1px solid ${border}` }}>
      {safe.toUpperCase()}
    </span>
  )
}

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

function Label({ children }: { children: string }) {
  return (
    <span className="text-[9.5px] font-mono tracking-[0.2em] uppercase text-slate-600">{children}</span>
  )
}

interface CardProps {
  children: React.ReactNode
  delay?: number
  accentColor?: string
  className?: string
}

function Card({ children, delay = 0, accentColor, className = '' }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, ease: [0.16, 1, 0.3, 1] }}
      className={`card-bevel rounded-2xl overflow-hidden ${className}`}
      style={{ background: 'linear-gradient(160deg, #0d192a 0%, #0a1220 100%)', border: '1px solid rgba(255,255,255,0.072)' }}
    >
      {accentColor && (
        <div className="h-px" style={{ background: `linear-gradient(90deg, transparent 0%, ${accentColor} 50%, transparent 100%)` }} />
      )}
      {children}
    </motion.div>
  )
}

// ── Main component ─────────────────────────────────────────────────
export function ResearchOutput({ data, isLoading: _isLoading, onGoDeeper }: Props) {
  const findings       = data.keyFindings?.filter((f): f is NonNullable<typeof f> => !!f?.finding) ?? []
  const misconceptions = data.misconceptions?.filter((m): m is string => !!m) ?? []
  const steps          = data.actionableNextSteps?.filter((s): s is string => !!s) ?? []
  const goDeeper       = data.goDeeper?.filter((g): g is string => !!g) ?? []
  const sources        = data.sourceRegistry?.filter((s): s is NonNullable<typeof s> => !!s?.url) ?? []

  return (
    <div className="space-y-3.5">

      {/* Executive Brief ─────────────────────────────────────────── */}
      {data.executiveBrief && (
        <Card delay={0} accentColor="rgba(59,130,246,0.5)">
          <div className="p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex items-center justify-center h-6 w-6 rounded-md"
                style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <BookOpen className="h-3 w-3 text-blue-400" />
              </div>
              <Label>Executive Brief</Label>
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

      {/* Deep Dive ───────────────────────────────────────────────── */}
      {data.overview && (
        <Card delay={0.04}>
          <div className="p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <Label>Deep Dive</Label>
            </div>
            <div className="space-y-3">
              {data.overview.split('\n').filter(Boolean).map((para, i) => (
                <p key={i} className="text-[14px] text-slate-300 leading-[1.72]">{para}</p>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Key Findings ────────────────────────────────────────────── */}
      {findings.length > 0 && (
        <Card delay={0.06}>
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
                <div key={i} className="p-3.5 rounded-xl transition-colors"
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
                      {/* Per-claim source attribution chips */}
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

      {/* Consensus + Misconceptions ──────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {data.expertConsensus && (
          <Card delay={0.08}>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <Label>Expert Consensus</Label>
              </div>
              <div className="space-y-2.5">
                {data.expertConsensus.split('\n').filter(Boolean).map((para, i) => (
                  <p key={i} className="text-[13.5px] text-slate-300 leading-[1.65]">{para}</p>
                ))}
              </div>
            </div>
          </Card>
        )}

        {misconceptions.length > 0 && (
          <Card delay={0.1}>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
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

      {/* Implications ───────────────────────────────────────────── */}
      {data.implications && (
        <Card delay={0.12} accentColor="rgba(6,182,212,0.3)">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3.5">
              <ArrowRight className="h-3.5 w-3.5 text-cyan-400" />
              <Label>Implications</Label>
            </div>
            <div className="space-y-2.5">
              {data.implications.split('\n').filter(Boolean).map((para, i) => (
                <p key={i} className="text-[13.5px] text-slate-300 leading-[1.65]">{para}</p>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Adversarial Review ─────────────────────────────────────── */}
      {data.adversarialReview && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
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
                  Stress Test — What This Research Might Miss
                </p>
                <p className="text-[13.5px] text-slate-300 leading-[1.65]">{data.adversarialReview}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Next Steps · Go Deeper · Sources ──────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {steps.length > 0 && (
          <Card delay={0.16}>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
                <Label>Next Steps</Label>
              </div>
              <div className="space-y-2.5">
                {steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="flex items-center justify-center h-4 w-4 rounded shrink-0 mt-0.5"
                      style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>
                      <span className="font-mono text-[8px] font-bold text-cyan-400">{i + 1}</span>
                    </div>
                    <p className="text-[12.5px] text-slate-400 leading-[1.6]">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {goDeeper.length > 0 && (
          <Card delay={0.18}>
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
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderLeftColor = 'rgba(139,92,246,0.22)' }}
                    >
                      {q}
                    </button>
                  ) : (
                    <p key={i} className="text-[12px] text-slate-500 leading-[1.55] pl-3 py-0.5"
                      style={{ borderLeft: '1px solid rgba(139,92,246,0.2)' }}>{q}</p>
                  )
                )}
              </div>
            </div>
          </Card>
        )}

        {sources.length > 0 && (
          <Card delay={0.2}>
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
                    style={{ background: 'transparent' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
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
    </div>
  )
}
