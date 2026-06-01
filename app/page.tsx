'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useClerk } from '@clerk/nextjs'
import { experimental_useObject as useObject } from '@ai-sdk/react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Square, Target, BookOpen, Radio,
  MessageSquare, BarChart3, Link2, Brain, Check, RotateCcw,
  Zap, ArrowRight, Sparkles, Loader2, Plus, Send, LogOut
} from 'lucide-react'
import { TrustScoreBadge } from '@/components/research/TrustScoreBadge'
import { ResearchLoadingScreen } from '@/components/research/ResearchLoadingScreen'
import { ClarificationCard } from '@/components/research/ClarificationCard'
import { StructuredOutputView } from '@/components/research/StructuredOutputView'
import { ResearchHistory } from '@/components/research/ResearchHistory'
import { AgentCards } from '@/components/research/AgentCards'
import { EliteResearchOutputSchema } from '@/ai/schemas'
import { getModeCap } from '@/ai/config/modes'
import { saveSession, loadSessions } from '@/lib/research-memory'
import type { ClarificationQuestion, TrustScore, QueryMode, EliteResearchOutput } from '@/ai/schemas'

type AppState = 'idle' | 'checking' | 'questioning' | 'researching' | 'done'
type QuestionEntry = { question: ClarificationQuestion; answer: string }
type QuestionPlan = { expertTitle: string; questions: ClarificationQuestion[] }

const MODE_CONFIG: Record<QueryMode, {
  label: string
  icon: React.ElementType
  example: string
  tag: string
  accent: string
}> = {
  decision:     { label: 'Strategy',     icon: Target,        tag: 'STRATEGY',     accent: 'text-violet-400', example: 'What car should I buy for a family of 4?' },
  research:     { label: 'Research',     icon: BookOpen,      tag: 'RESEARCH',     accent: 'text-blue-400',   example: 'How does mRNA vaccine technology work?' },
  intelligence: { label: 'Analysis',     icon: Radio,         tag: 'ANALYSIS',     accent: 'text-cyan-400',   example: "What's the current state of quantum computing in 2026?" },
  perspectives: { label: 'Perspectives', icon: MessageSquare, tag: 'PERSPECTIVES', accent: 'text-amber-400',  example: 'Strongest arguments for and against remote work?' },
  competitive:  { label: 'Challenge',    icon: BarChart3,     tag: 'CHALLENGE',    accent: 'text-rose-400',   example: 'What are the biggest risks in building a consumer AI startup right now?' },
  explainer:    { label: 'Understanding',icon: Link2,         tag: 'UNDERSTANDING',accent: 'text-teal-400',   example: 'How does raising interest rates affect housing?' },
  action:       { label: 'Execution',    icon: ArrowRight,    tag: 'EXECUTION',    accent: 'text-orange-400', example: 'How do I launch a SaaS product from scratch?' },
  forecast:     { label: 'Forecast',     icon: Zap,           tag: 'FORECAST',     accent: 'text-indigo-400', example: 'Where is AI heading in the next 2 years?' },
}

// ─── Outer shell — holds the reset key ────────────────────────────────────────
export default function Page() {
  const [sessionId, setSessionId] = useState(0)
  const { signOut } = useClerk()

  // Sign out automatically when the browser is closed and reopened.
  // sessionStorage is wiped on browser close (unlike localStorage), so if the
  // key is absent we know this is a fresh browser open with a stale Clerk cookie.
  useEffect(() => {
    const hasSession = sessionStorage.getItem('deepinsight-session')
    if (!hasSession) {
      signOut({ redirectUrl: '/sign-in' })
      return
    }
  }, [signOut])

  return <ResearchApp key={sessionId} onNewChat={() => setSessionId(n => n + 1)} onSignOut={() => signOut({ redirectUrl: '/sign-in' })} />
}

// ─── Inner app — full remount on new chat ─────────────────────────────────────
function ResearchApp({ onNewChat, onSignOut }: { onNewChat: () => void; onSignOut: () => void }) {
  const [prompt, setPrompt] = useState('')
  const [appState, setAppState] = useState<AppState>('idle')
  const [detectedMode, setDetectedMode] = useState<QueryMode | null>(null)
  const [trustScore, setTrustScore] = useState<TrustScore | null>(null)
  const [deepResearch, setDeepResearch] = useState(false)

  const [questionHistory, setQuestionHistory] = useState<QuestionEntry[]>([])
  const [questionPlan, setQuestionPlan]       = useState<QuestionPlan | null>(null)
  const [questionIndex, setQuestionIndex]     = useState(0)
  const [pendingAnswer, setPendingAnswer]     = useState('')
  const [fetchingNext, setFetchingNext]       = useState(false)

  const [followUpText, setFollowUpText]       = useState('')
  const [showFollowUp, setShowFollowUp]       = useState(false)
  const [selectedAgent, setSelectedAgent]     = useState<string | null>(null)
  const [chatHistory, setChatHistory]         = useState<Array<{ prompt: string; result: Partial<EliteResearchOutput> }>>([])
  const [currentPromptLabel, setCurrentPromptLabel] = useState('')

  // Holds the in-flight presearch promise so startResearch can await it
  const presearchRef = useRef<Promise<{ rawText: string; citations: unknown[] } | null> | null>(null)

  // Debounced pre-classify while typing — fires /api/classify after 600ms of inactivity.
  // Result cached in detectedMode so handleAnalyze can skip the classify call.
  const classifyAbortRef = useRef<AbortController | null>(null)
  useEffect(() => {
    if (appState !== 'idle' || selectedAgent) return
    if (prompt.trim().length < 12) return
    const timer = setTimeout(async () => {
      classifyAbortRef.current?.abort()
      const ctrl = new AbortController()
      classifyAbortRef.current = ctrl
      try {
        const res = await fetch('/api/classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: prompt.trim() }),
          signal: ctrl.signal,
        })
        if (!res.ok) return
        const data = await res.json()
        if (data?.mode) setDetectedMode(data.mode as QueryMode)
      } catch {
        // Aborted or network error — ignore
      }
    }, 600)
    return () => {
      clearTimeout(timer)
      classifyAbortRef.current?.abort()
    }
  }, [prompt, appState, selectedAgent])

  // Current question = plan[questionIndex], or null if past the end
  const currentQuestion = questionPlan?.questions[questionIndex] ?? null

  const { object, submit, isLoading, stop } = useObject({
    api: '/api/research',
    schema: EliteResearchOutputSchema,
    onFinish: ({ object: result }) => {
      // Always mark done so buttons/UI appear — even on partial/undefined result
      setAppState('done')

      // Compute trust score regardless — use safe defaults for any missing fields
      const sourcesCount    = result?.sourceRegistry?.filter(s => s?.url)?.length ?? 0
      const highCredSources = result?.sourceRegistry?.filter(s => s?.credibilityTier === 'high')?.length ?? 0
      const medCredSources  = result?.sourceRegistry?.filter(s => s?.credibilityTier === 'medium')?.length ?? 0
      const modelConfidence = result?.confidence ?? 50

      const rawQuality    = (highCredSources * 1.0) + (medCredSources * 0.6) +
                            ((sourcesCount - highCredSources - medCredSources) * 0.2)
      const citationScore = sourcesCount > 0 ? Math.min(rawQuality / sourcesCount, 1) : 0.3
      const coverageScore = Math.min(sourcesCount / 10, 1)
      const credRatio     = sourcesCount > 0 ? highCredSources / sourcesCount : 0
      const recencyScore  = 0.45 + credRatio * 0.45

      const T = (0.30 * modelConfidence) +
                (0.30 * citationScore * 100) +
                (0.25 * coverageScore * 100) +
                (0.15 * recencyScore  * 100)

      const finalScore = Math.round(Math.min(100, Math.max(0, T)))
      const alertLevel = finalScore >= 72 ? 'green' : finalScore >= 45 ? 'orange' : 'red'

      setTrustScore({
        modelConfidence: Math.round(modelConfidence),
        citationScore,
        recencyScore,
        coverageScore: Math.round(coverageScore * 100),
        finalScore,
        alertLevel,
      })

      if (result) {
        const iterCount = sourcesCount > 8 ? 2 : 1
        setDeepResearch(iterCount > 1)
        void saveSession({
          timestamp:      Date.now(),
          query:          prompt,
          mode:           result.queryMode ?? 'research',
          summary:        result.executiveBrief ?? '',
          confidence:     result.confidence ?? 50,
          sourceCount:    sourcesCount,
          iterationCount: iterCount,
        })
      }
    },
    onError: () => setAppState('idle'),
  })

  const mode       = (object?.queryMode ?? detectedMode ?? 'research') as QueryMode
  const modeConfig = MODE_CONFIG[mode] ?? MODE_CONFIG.research

  // Fire Gemini presearch in the background — called as soon as clarification questions appear.
  // Result is stored in presearchRef and awaited by startResearch.
  const firePresearch = useCallback((q: string) => {
    presearchRef.current = fetch('/api/presearch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: q }),
    })
      .then(r => r.ok ? r.json() : null)
      .catch(() => null)
  }, [])

  const startResearch = useCallback(async (context?: string) => {
    setAppState('researching')
    setDeepResearch(false)
    // Run presearch wait + session load in parallel — no reason to sequence them
    const [prefetchedGemini, prior] = await Promise.all([
      presearchRef.current ?? Promise.resolve(null),
      loadSessions(),
    ])
    presearchRef.current = null
    submit({
      prompt,
      clarificationContext: context,
      forceProceed:         !context,
      mode:                 detectedMode,
      priorSessions:        prior.slice(0, 10),
      prefetchedGemini,
    })
  }, [prompt, detectedMode, submit])

  // Queries that clearly need personal context — always show questions regardless of plan result
  const needsContext = useCallback((q: string) => {
    return /\b(should i|should we|what.*(should|best|recommend|buy|get|choose|pick|use)|which.*(better|best|right|for me)|help me (choose|decide|pick|find|buy|select)|best .*(for|option|choice)|compare|versus|vs\.?|recommend|advice|suggest)\b/i.test(q)
  }, [])

  const handleAnalyze = useCallback(async () => {
    if (!prompt.trim()) return
    setAppState('checking')
    setQuestionHistory([])
    setQuestionPlan(null)
    setQuestionIndex(0)
    setPendingAnswer('')
    setCurrentPromptLabel(prompt)
    // Keep selectedAgent — it stays highlighted through the research run

    try {
      // Agent path or pre-classified: mode already known — skip classify call
      const skipClassify = !!selectedAgent || !!detectedMode
      const [classifyRes, planRes] = await Promise.all([
        skipClassify
          ? Promise.resolve(null)
          : fetch('/api/classify', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt }),
            }),
        fetch('/api/clarify/plan', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, mode: selectedAgent ?? detectedMode ?? undefined }),
        }),
      ])

      const classifyResult = classifyRes ? await classifyRes.json() : null
      const plan           = await planRes.json() as QuestionPlan & { error?: boolean }

      const classifiedMode = (classifyResult?.mode ?? selectedAgent ?? detectedMode) as QueryMode | undefined
      if (classifiedMode) setDetectedMode(classifiedMode)

      if (plan.questions && plan.questions.length > 0) {
        // Plan returned questions — show them and pre-fire Gemini in background
        firePresearch(prompt)
        setQuestionPlan(plan)
        setAppState('questioning')
      } else if (needsContext(prompt)) {
        // Plan returned empty but this is clearly a personal decision query.
        // Fall back to single-question mode via clarify/next.
        const nextRes = await fetch('/api/clarify/next', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, history: [], mode: classifiedMode }),
        })
        const next = await nextRes.json()
        if (!next.done && next.question) {
          firePresearch(prompt)
          setQuestionPlan({ expertTitle: plan.expertTitle ?? '', questions: [next.question] })
          setAppState('questioning')
        } else {
          startResearch()
        }
      } else {
        // Purely factual — no personalisation needed
        startResearch()
      }
    } catch {
      startResearch()
    }
  }, [prompt, startResearch, needsContext])

  const handleSubmitAnswer = useCallback(async () => {
    if (!pendingAnswer || !currentQuestion) return
    const entry      = { question: currentQuestion, answer: pendingAnswer }
    const newHistory = [...questionHistory, entry]
    setQuestionHistory(newHistory)
    setPendingAnswer('')

    const nextIndex      = questionIndex + 1
    const hasMorePlanned = questionPlan && nextIndex < questionPlan.questions.length

    if (hasMorePlanned) {
      // More planned questions — advance instantly, no network call
      setQuestionIndex(nextIndex)
      return
    }

    const modeCap = getModeCap(detectedMode ?? 'research')
    if (newHistory.length >= modeCap) {
      const ctx = newHistory.map(e => `${e.question.question}: ${e.answer}`).join('\n')
      startResearch(ctx)
      return
    }

    setFetchingNext(true)
    try {
      const res  = await fetch('/api/clarify/next', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify({
          prompt,
          history: newHistory.map(e => ({ question: e.question.question, answer: e.answer })),
          mode: detectedMode ?? undefined,
        }),
      })
      const next = await res.json()
      if (!next.done && next.question) {
        // Expert has another question — append it and advance
        setQuestionPlan(prev => ({
          expertTitle: prev?.expertTitle ?? '',
          questions:   [...(prev?.questions ?? []), next.question],
        }))
        setQuestionIndex(nextIndex)
      } else {
        // Expert is satisfied — start research with full context
        const ctx = newHistory.map(e => `${e.question.question}: ${e.answer}`).join('\n')
        startResearch(ctx || undefined)
      }
    } catch {
      const ctx = newHistory.map(e => `${e.question.question}: ${e.answer}`).join('\n')
      startResearch(ctx || undefined)
    } finally {
      setFetchingNext(false)
    }
  }, [pendingAnswer, currentQuestion, questionHistory, questionIndex, questionPlan, prompt, startResearch])

  const handleSkipToResearch = useCallback(() => {
    const ctx = questionHistory.map(e => `${e.question.question}: ${e.answer}`).join('\n')
    startResearch(ctx || undefined)
  }, [questionHistory, startResearch])

  const handleContinueResearch = useCallback(() => {
    const newPrompt = followUpText.trim()
    if (!newPrompt) return

    // Snapshot the current result into history before submitting
    if (object) {
      setChatHistory(prev => [...prev, {
        prompt: currentPromptLabel || prompt,
        result: object as Partial<EliteResearchOutput>,
      }])
    }

    // Build context from the previous research so the next run builds on it
    const prevParts = [
      `PREVIOUS QUERY: "${currentPromptLabel || prompt}"`,
      object?.executiveBrief
        ? `PREVIOUS SUMMARY: ${object.executiveBrief}`
        : '',
      object?.keyFindings?.length
        ? `KEY FINDINGS FROM PREVIOUS RESEARCH:\n${
            object.keyFindings
              .slice(0, 4)
              .map(f => `• ${f?.finding ?? ''}`)
              .filter(f => f !== '• ')
              .join('\n')
          }`
        : '',
    ].filter(Boolean).join('\n\n')

    setCurrentPromptLabel(newPrompt)
    setPrompt(newPrompt)
    setFollowUpText('')
    setShowFollowUp(false)
    setSelectedAgent(null)
    setQuestionHistory([])
    setQuestionPlan(null)
    setQuestionIndex(0)
    setPendingAnswer('')
    setTrustScore(null)
    setDeepResearch(false)
    setAppState('researching')
    loadSessions().then(prior => {
      submit({
        prompt:               newPrompt,
        clarificationContext: prevParts,
        forceProceed:         true,
        mode:                 detectedMode,
        priorSessions:        prior.slice(0, 10),
      })
    })
  }, [followUpText, prompt, currentPromptLabel, object, detectedMode, submit])

  const handleGoDeeper = useCallback((question: string) => {
    setPrompt(question)
    setQuestionHistory([])
    setQuestionPlan(null)
    setQuestionIndex(0)
    setPendingAnswer('')
    setTrustScore(null)
    setDetectedMode(null)
    setDeepResearch(false)
    setAppState('researching')
    loadSessions().then(prior => {
      submit({ prompt: question, forceProceed: true, mode: undefined, priorSessions: prior.slice(0, 10) })
    })
  }, [submit])

  const handleRerun = useCallback((query: string) => {
    setPrompt(query)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Stable reference — only changes when selectedAgent changes, NOT on every keystroke.
  // This lets AgentCards (wrapped in React.memo) skip re-renders while the user types.
  const useAgentSelect = useCallback((example: string, agentId: string) => {
    if (selectedAgent === agentId) {
      setSelectedAgent(null)
      setDetectedMode(null)
    } else {
      setPrompt(example)
      setSelectedAgent(agentId)
      setDetectedMode(agentId as QueryMode)
    }
  }, [selectedAgent])

  const isResearching   = appState === 'researching' || isLoading
  const isInputDisabled = isResearching || appState === 'questioning'
  const totalQuestions  = questionPlan?.questions.length ?? 0
  const expertTitle     = questionPlan?.expertTitle ?? ''

  return (
    <div className="min-h-screen">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b border-white/[0.055]"
        style={{ background: 'rgba(7, 13, 26, 0.88)', backdropFilter: 'blur(16px)' }}>
        <div className="max-w-5xl mx-auto px-6 h-[52px] flex items-center justify-between">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="relative h-7 w-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.15) 0%, rgba(6,182,212,0.06) 100%)', border: '1px solid rgba(6,182,212,0.22)' }}>
              <Brain className="h-3.5 w-3.5 text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-2.5">
              <span className="font-mono text-[13px] font-bold text-slate-100 tracking-[0.12em]">DeepInsight</span>
            </div>
          </div>

          {/* Right: status pills + sign out */}
          <div className="flex items-center gap-2.5">
            <AnimatePresence>
              {(isResearching || appState === 'done') && detectedMode && (
                <motion.div key="mode"
                  initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <modeConfig.icon className={`h-3 w-3 ${modeConfig.accent}`} />
                  <span className="text-[9px] font-mono text-slate-400 tracking-[0.15em]">{modeConfig.tag}</span>
                </motion.div>
              )}
              {appState === 'done' && deepResearch && (
                <motion.div key="deep"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md"
                  style={{ background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.18)' }}
                >
                  <Zap className="h-3 w-3 text-emerald-400" />
                  <span className="text-[9px] font-mono text-emerald-400 tracking-[0.15em]">DEEP</span>
                </motion.div>
              )}
            </AnimatePresence>
            {trustScore && <TrustScoreBadge score={trustScore} />}
            <div className="w-px h-4 bg-white/10 mx-0.5" />
            <button
              onClick={onSignOut}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="text-[11px] font-mono tracking-wide">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-5">

        {/* ── Hero Input Panel ───────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="card-bevel rounded-2xl overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #0e1a2e 0%, #0a1220 100%)', border: '1px solid rgba(255,255,255,0.075)' }}
        >
          {/* Cyan shimmer top */}
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(6,182,212,0.45) 50%, transparent 100%)' }} />

          <div className="p-7 space-y-5">
            {/* Heading */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-[22px] font-semibold text-slate-100 tracking-tight leading-tight">
                  What do you want to research?
                </h1>
                <p className="text-[11px] font-mono text-slate-600 mt-2 tracking-[0.18em]">
                  CLAUDE · GEMINI · LIVE WEB SEARCH · MULTI-MODEL SYNTHESIS
                </p>
              </div>
              <AnimatePresence>
                {!selectedAgent && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="shrink-0 flex flex-col items-end gap-1 mt-0.5"
                  >
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                      style={{ background: 'rgba(6,182,212,0.07)', border: '1px solid rgba(6,182,212,0.2)' }}>
                      <Sparkles className="h-3 w-3 text-cyan-400" />
                      <span className="text-[11px] font-semibold text-cyan-300 tracking-wide">Deep Research Mode</span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-600 tracking-wide">Select an agent for faster results</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Gradient-border textarea wrapper */}
            <div className="input-gradient-border">
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAnalyze() }}
                placeholder="Ask anything — a decision to make, a topic to research, a trend to understand, a debate to explore..."
                className="w-full min-h-[106px] rounded-[11px] p-4 text-[14px] leading-relaxed text-slate-200 placeholder:text-slate-600 resize-none focus:outline-none transition-all duration-200"
                style={{ background: '#060c16', caretColor: '#22d3ee' }}
                disabled={isInputDisabled}
              />
            </div>

            {/* CTA row */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleAnalyze}
                disabled={!prompt.trim() || isResearching || appState === 'checking' || appState === 'questioning'}
                className="btn-glow flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-semibold tracking-wide transition-all duration-200 disabled:opacity-35 disabled:cursor-not-allowed disabled:shadow-none"
                style={{ background: '#06b6d4', color: '#040d18' }}
              >
                {appState === 'checking' ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" />Analyzing…</>
                ) : (
                  <><Sparkles className="h-3.5 w-3.5" />Run Research</>
                )}
              </button>
              <span className="ml-auto text-[10px] font-mono text-slate-700 hidden sm:block tracking-wider">⌘ ↵</span>
            </div>

            {/* Agent cards */}
            <AgentCards
              onSelect={useAgentSelect}
              selectedAgent={selectedAgent}
              disabled={isInputDisabled}
            />

          </div>
        </motion.section>

        {/* ── Questioning Panel ──────────────────────────────────────── */}
        <AnimatePresence>
          {appState === 'questioning' && (
            <motion.section
              key="questioning"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="card-bevel rounded-2xl overflow-hidden"
              style={{ background: 'linear-gradient(160deg, #0d1929 0%, #0a1220 100%)', border: '1px solid rgba(6,182,212,0.18)' }}
            >
              <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(6,182,212,0.4) 50%, transparent 100%)' }} />

              {/* Panel header */}
              <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.045]">
                <div className="flex items-center justify-center h-6 w-6 rounded-lg shrink-0"
                  style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.22)' }}>
                  <Brain className="h-3 w-3 text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  {expertTitle && (
                    <p className="text-[10px] font-mono text-cyan-500/70 tracking-[0.15em] truncate">
                      {expertTitle.toUpperCase()}
                    </p>
                  )}
                  <p className="text-[13px] font-semibold text-slate-200 tracking-tight leading-tight">
                    {questionHistory.length === 0
                      ? 'A few quick questions to personalise your research'
                      : `${questionHistory.length} of ${totalQuestions} answered`}
                  </p>
                </div>
                {/* Progress: answered count */}
                {questionHistory.length > 0 && (
                  <span className="text-[9px] font-mono text-emerald-500/70 shrink-0 tracking-widest">
                    {questionHistory.length} answered
                  </span>
                )}
                <button
                  onClick={handleSkipToResearch}
                  className="ml-2 text-[10px] font-mono text-slate-600 hover:text-slate-400 tracking-[0.15em] transition-colors shrink-0"
                >
                  {questionHistory.length > 0 ? 'RUN NOW →' : 'SKIP →'}
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Answered history */}
                {questionHistory.length > 0 && (
                  <div className="space-y-1.5">
                    {questionHistory.map((entry, i) => (
                      <motion.div key={i}
                        initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 py-2 px-3 rounded-lg"
                        style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.13)' }}>
                        <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                        <span className="text-[12px] text-slate-500 truncate flex-1">{entry.question.question}</span>
                        <span className="text-[11px] font-mono font-semibold text-emerald-400 shrink-0">{entry.answer}</span>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Active question or fetching-next spinner */}
                <AnimatePresence mode="wait">
                  {fetchingNext ? (
                    <motion.div key="fetching"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-3 py-8 justify-center">
                      <Loader2 className="h-4 w-4 animate-spin text-cyan-500/50" />
                      <span className="text-[11px] font-mono tracking-[0.18em] text-slate-600">
                        EXPERT THINKING…
                      </span>
                    </motion.div>
                  ) : currentQuestion ? (
                    <motion.div key={currentQuestion.fieldTargeted}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}>
                      <ClarificationCard
                        question={currentQuestion}
                        index={questionHistory.length}
                        selected={pendingAnswer}
                        onSelect={setPendingAnswer}
                      />
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                {/* Actions */}
                <div className="flex items-center gap-4 pt-1">
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={!pendingAnswer || fetchingNext}
                    className="btn-glow flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold tracking-wide transition-all duration-200 disabled:opacity-30 disabled:shadow-none disabled:cursor-not-allowed"
                    style={{ background: '#06b6d4', color: '#040d18' }}
                  >
                    Continue
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={handleSkipToResearch}
                    disabled={fetchingNext}
                    className="text-[11px] font-mono text-slate-600 hover:text-slate-400 tracking-[0.12em] disabled:opacity-40 transition-colors"
                  >
                    {questionHistory.length > 0 ? 'Start research now' : 'Skip questions'}
                  </button>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ── Research Loading Screen ─────────────────────────────────── */}
        <ResearchLoadingScreen
          prompt={prompt}
          isActive={isResearching && !object?.executiveBrief}
        />

        {/* ── Chat History (previous turns) ───────────────────────────── */}
        {chatHistory.map((entry, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Divider with prompt label */}
            <div className="flex items-center gap-3 pt-2">
              <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <span className="text-[10px] font-mono text-slate-600 tracking-[0.15em] shrink-0">
                {entry.prompt}
              </span>
              <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
            </div>
            <div className="opacity-50">
              <StructuredOutputView
                data={entry.result}
                isLoading={false}
                onGoDeeper={handleGoDeeper}
              />
            </div>
            <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </motion.div>
        ))}

        {/* ── Results ─────────────────────────────────────────────────── */}
        <AnimatePresence>
          {(isResearching || appState === 'done') && object && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-4"
            >
              {chatHistory.length > 0 && (
                <div className="flex items-center gap-3 pt-2">
                  <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  <span className="text-[10px] font-mono text-slate-500 tracking-[0.15em] shrink-0">
                    {currentPromptLabel}
                  </span>
                  <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
                </div>
              )}
              <StructuredOutputView
                data={object as Partial<EliteResearchOutput>}
                isLoading={isLoading}
                onGoDeeper={handleGoDeeper}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Stop generation ─────────────────────────────────────────── */}
        <AnimatePresence>
          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center">
              <button
                onClick={stop}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-500 hover:text-slate-300 font-mono text-[11px] tracking-[0.15em] transition-all duration-150"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <Square className="h-3 w-3 fill-current" />
                STOP GENERATION
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Post-result actions ──────────────────────────────────────── */}
        <AnimatePresence>
          {appState === 'done' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-3 pb-10"
            >
              {/* Follow-up input panel (shown when Continue is clicked) */}
              <AnimatePresence>
                {showFollowUp && (
                  <motion.div
                    key="followup"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="card-bevel rounded-2xl overflow-hidden"
                    style={{
                      background: 'linear-gradient(160deg, #0d1929 0%, #0a1220 100%)',
                      border: '1px solid rgba(6,182,212,0.2)',
                    }}
                  >
                    <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(6,182,212,0.4) 50%, transparent 100%)' }} />
                    <div className="p-5 space-y-4">
                      {/* Label */}
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-3.5 w-3.5 text-cyan-400" />
                        <span className="text-[10px] font-mono text-cyan-500/70 tracking-[0.18em]">
                          FOLLOW-UP · CONTEXT CARRIED FORWARD
                        </span>
                      </div>

                      {/* Textarea */}
                      <div className="input-gradient-border">
                        <textarea
                          autoFocus
                          value={followUpText}
                          onChange={e => setFollowUpText(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleContinueResearch()
                          }}
                          placeholder="Ask a follow-up question about this topic…"
                          rows={3}
                          className="w-full rounded-[11px] p-4 text-[14px] leading-relaxed text-slate-200 placeholder:text-slate-600 resize-none focus:outline-none transition-all"
                          style={{ background: '#060c16', caretColor: '#22d3ee' }}
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleContinueResearch}
                          disabled={!followUpText.trim()}
                          className="btn-glow flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold tracking-wide transition-all duration-200 disabled:opacity-30 disabled:shadow-none disabled:cursor-not-allowed"
                          style={{ background: '#06b6d4', color: '#040d18' }}
                        >
                          <Send className="h-3.5 w-3.5" />
                          Research this
                        </button>
                        <button
                          onClick={() => { setShowFollowUp(false); setFollowUpText('') }}
                          className="text-[11px] font-mono text-slate-600 hover:text-slate-400 tracking-[0.12em] transition-colors"
                        >
                          Cancel
                        </button>
                        <span className="ml-auto text-[10px] font-mono text-slate-700 hidden sm:block tracking-wider">⌘ ↵</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Primary action buttons */}
              <AnimatePresence>
                {!showFollowUp && (
                  <motion.div
                    key="actions"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-center justify-center gap-3 pt-2"
                  >
                    {/* Continue Research — primary */}
                    <button
                      onClick={() => setShowFollowUp(true)}
                      className="btn-glow flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold tracking-wide transition-all duration-200"
                      style={{
                        background: 'rgba(6,182,212,0.08)',
                        border: '1px solid rgba(6,182,212,0.3)',
                        color: '#22d3ee',
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Continue Chat
                    </button>

                    {/* Start New Chat — secondary */}
                    <button
                      onClick={onNewChat}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-medium text-slate-500 hover:text-slate-200 transition-all duration-150"
                      style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Start New Chat
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── History (idle only) ──────────────────────────────────────── */}
        {appState === 'idle' && <ResearchHistory onRerun={handleRerun} />}

      </div>
    </div>
  )
}
