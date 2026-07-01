'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useClerk } from '@clerk/nextjs'
import { experimental_useObject as useObject } from '@ai-sdk/react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Target, BookOpen, Radio,
  MessageSquare, BarChart3, Link2, Check, RotateCcw,
  Zap, ArrowRight, Loader2, Plus, Send, Menu, Brain
} from 'lucide-react'
import { TrustScoreBadge } from '@/components/research/TrustScoreBadge'
import { ResearchLoadingScreen } from '@/components/research/ResearchLoadingScreen'
import { ClarificationCard } from '@/components/research/ClarificationCard'
import { StructuredOutputView } from '@/components/research/StructuredOutputView'
import { Sidebar } from '@/components/research/Sidebar'
import { SourcesRail } from '@/components/research/SourcesRail'
import { EliteResearchOutputSchema } from '@/ai/schemas'
import { getModeCap } from '@/ai/config/modes'
import { saveSession, loadSessions, deleteSession } from '@/lib/research-memory'
import { computeTrustScore } from '@/lib/trust-score'
import type { ClarificationQuestion, TrustScore, QueryMode, EliteResearchOutput } from '@/ai/schemas'
import { Component, type ReactNode } from 'react'

class OutputErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError) return (
      <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
        <p className="text-[13px] text-red-400 font-mono">Output rendering error — please try again.</p>
      </div>
    )
    return this.props.children
  }
}

type AppState = 'idle' | 'checking' | 'questioning' | 'researching' | 'done'
type QuestionEntry = { question: ClarificationQuestion; answer: string }
type QuestionPlan = { expertTitle: string; questions: ClarificationQuestion[] }

const MODE_CONFIG: Record<QueryMode, {
  label: string
  icon: React.ElementType
  example: string
  tag: string
  accent: string
  tagline: string
}> = {
  decision:     { label: 'Strategy',     icon: Target,        tag: 'STRATEGY',     accent: 'text-violet-400', tagline: 'Decide with clarity.',         example: 'What car should I buy for a family of 4?' },
  research:     { label: 'Research',     icon: BookOpen,      tag: 'RESEARCH',     accent: 'text-blue-400',   tagline: 'Find what matters.',           example: 'How does mRNA vaccine technology work?' },
  intelligence: { label: 'Analysis',     icon: Radio,         tag: 'ANALYSIS',     accent: 'text-cyan-400',   tagline: 'Get the full picture.',        example: "What's the current state of quantum computing in 2026?" },
  perspectives: { label: 'Perspectives', icon: MessageSquare, tag: 'PERSPECTIVES', accent: 'text-amber-400',  tagline: 'See every side.',              example: 'Strongest arguments for and against remote work?' },
  competitive:  { label: 'Challenge',    icon: BarChart3,     tag: 'CHALLENGE',    accent: 'text-rose-400',   tagline: 'Stress-test your idea.',       example: 'What are the biggest risks in building a consumer AI startup right now?' },
  explainer:    { label: 'Understanding',icon: Link2,         tag: 'UNDERSTANDING',accent: 'text-teal-400',   tagline: 'Make it click.',               example: 'How does raising interest rates affect housing?' },
  action:       { label: 'Execution',    icon: ArrowRight,    tag: 'EXECUTION',    accent: 'text-orange-400', tagline: 'Turn ideas into action.',      example: 'How do I launch a SaaS product from scratch?' },
  forecast:     { label: 'Forecast',     icon: Zap,           tag: 'FORECAST',     accent: 'text-indigo-400', tagline: 'See around the corner.',       example: 'Where is AI heading in the next 2 years?' },
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

  return <ResearchApp key={sessionId} onNewChat={() => setSessionId(n => n + 1)} />
}

// ─── Inner app — full remount on new chat ─────────────────────────────────────
function ResearchApp({ onNewChat }: { onNewChat: () => void }) {
  const [prompt, setPrompt] = useState('')
  const [appState, setAppState] = useState<AppState>('idle')
  const [detectedMode, setDetectedMode] = useState<QueryMode | null>(null)
  const [trustScore, setTrustScore] = useState<TrustScore | null>(null)
  const [restoredOutput, setRestoredOutput] = useState<Partial<EliteResearchOutput> | null>(null)

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

  const [recentSessions, setRecentSessions] = useState<Array<{ id: string; prompt: string; mode?: QueryMode; createdAt: string }>>([])
  const [researchError, setResearchError]   = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen]       = useState(false)

  useEffect(() => {
    if (appState !== 'idle' && appState !== 'done') return
    loadSessions().then(sessions => {
      setRecentSessions(sessions.map(s => ({
        id: s.id ?? String(s.timestamp ?? Date.now()),
        prompt: s.query ?? '',
        mode: s.mode as QueryMode | undefined,
        createdAt: String(s.timestamp ?? ''),
      })))
    }).catch(() => {})
  }, [appState])

  // True when the current research run is a continue-chat turn (should not save to history)
  const isContinuationRef = useRef(false)

  // Holds the in-flight presearch promise so startResearch can await it
  const presearchRef = useRef<Promise<{ rawText: string; citations: unknown[] } | null> | null>(null)
  // Stores the AI-selected domain from classify so clarify/next calls can use it
  const classifiedDomainRef = useRef<string | null>(null)

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
      setTrustScore(computeTrustScore(result ?? undefined))

      if (result && !isContinuationRef.current) {
        const sourcesCount = result.sourceRegistry?.filter(s => s?.url)?.length ?? 0
        const iterCount = sourcesCount > 8 ? 2 : 1
        void saveSession({
          timestamp:      Date.now(),
          query:          prompt,
          mode:           result.queryMode ?? 'research',
          summary:        result.executiveBrief ?? '',
          confidence:     result.confidence ?? 50,
          sourceCount:    sourcesCount,
          iterationCount: iterCount,
        })
        // Cache full output in localStorage so clicking history restores the report instantly
        try {
          localStorage.setItem('di:report:' + prompt, JSON.stringify(result))
        } catch { /* storage full — ignore */ }
      }
      isContinuationRef.current = false
    },
    onError: (err) => {
      setAppState('idle')
      const msg = err instanceof Error ? err.message : String(err)
      setResearchError(msg.includes('429') || msg.toLowerCase().includes('rate')
        ? "You've hit the daily research limit. Please try again tomorrow."
        : 'Something went wrong with the research pipeline. Please try again.')
    },
  })

  const outputData  = restoredOutput ?? object
  const mode        = (outputData?.queryMode ?? detectedMode ?? 'research') as QueryMode
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

  const handleAnalyze = useCallback(async () => {
    if (!prompt.trim()) return
    setResearchError(null)
    setRestoredOutput(null)
    setAppState('checking')
    setQuestionHistory([])
    setQuestionPlan(null)
    setQuestionIndex(0)
    setPendingAnswer('')
    setCurrentPromptLabel(prompt)
    classifiedDomainRef.current = null

    let shownQ1 = false
    let firstShownQuestion: ClarificationQuestion | null = null
    let didStartResearch = false

    try {
      const skipClassify = !!selectedAgent || !!detectedMode
      const mode = selectedAgent ?? detectedMode ?? undefined

      // Fire classify immediately, then fire clarify calls once we have the domain
      const classifyPromise = skipClassify
        ? Promise.resolve(null)
        : fetch('/api/classify', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt }),
          }).then(r => r.json())

      // Fire clarify/next immediately with what we know (domain may upgrade after classify resolves)
      const firstQPromise = fetch('/api/clarify/next', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, history: [], mode }),
      }).then(r => r.json())

      // Fire plan after classify resolves so it gets the AI-selected domain
      const planPromise = classifyPromise.then(classifyRes => {
        const domain = classifyRes?.domain ?? undefined
        const resolvedMode = classifyRes?.mode ?? mode
        return fetch('/api/clarify/plan', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, mode: resolvedMode, domain }),
        }).then(r => r.json())
      })

      // Transition to questioning as soon as Q1 arrives — don't wait for full plan
      firstQPromise.then(firstQ => {
        if (shownQ1 || didStartResearch || firstQ.done || !firstQ.question) return
        shownQ1 = true
        firstShownQuestion = firstQ.question
        firePresearch(prompt)
        setQuestionPlan({ expertTitle: '', questions: [firstQ.question] })
        setAppState('questioning')
      }).catch(() => {})

      // Await classify + plan in parallel (plan may arrive after Q1 already shown)
      const [classifyResult, plan] = await Promise.all([classifyPromise, planPromise]) as [
        { mode?: string; confidence?: number; domain?: string } | null,
        QuestionPlan & { error?: boolean }
      ]

      const classifiedMode = (classifyResult?.mode ?? selectedAgent ?? detectedMode) as QueryMode | undefined
      if (classifiedMode) setDetectedMode(classifiedMode)
      if (classifyResult?.domain) classifiedDomainRef.current = classifyResult.domain

      if (plan.questions && plan.questions.length > 0) {
        if (!shownQ1) {
          // clarify/next was slower than plan — use only Q1 from plan
          // (Q2+ always come from clarify/next with full history to avoid overlap)
          shownQ1 = true
          firstShownQuestion = plan.questions[0]
          firePresearch(prompt)
          setQuestionPlan({ expertTitle: plan.expertTitle ?? '', questions: [plan.questions[0]] })
          setAppState('questioning')
        } else {
          // Q1 already visible — update expertTitle only, keep single question
          // Q2+ will come from clarify/next which sees Q1's answer
          const q1 = firstShownQuestion ?? plan.questions[0]
          setQuestionPlan({ expertTitle: plan.expertTitle ?? '', questions: [q1] })
        }
      } else if (!shownQ1) {
        // Plan says no questions — always attempt Q1 from clarify/next before researching
        const next = await firstQPromise
        if (!next.done && next.question) {
          shownQ1 = true
          firstShownQuestion = next.question
          firePresearch(prompt)
          setQuestionPlan({ expertTitle: plan.expertTitle ?? '', questions: [next.question] })
          setAppState('questioning')
        } else {
          didStartResearch = true
          startResearch()
        }
      }
      // If plan is empty but shownQ1 is true: Q1 came from clarify/next.
      // After answering, handleSubmitAnswer will call clarify/next for Q2 (existing flow).
    } catch {
      // Only start research if Q1 was never shown — if it was, let user continue answering
      if (!shownQ1) {
        didStartResearch = true
        startResearch()
      }
    }
  }, [prompt, startResearch, firePresearch, selectedAgent, detectedMode])

  const handleSubmitAnswer = useCallback(async () => {
    if (!pendingAnswer || !currentQuestion) return
    const entry      = { question: currentQuestion, answer: pendingAnswer }
    const newHistory = [...questionHistory, entry]
    setQuestionHistory(newHistory)
    setPendingAnswer('')

    const nextIndex = questionIndex + 1

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
          domain: classifiedDomainRef.current ?? undefined,
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
  }, [pendingAnswer, currentQuestion, questionHistory, questionIndex, prompt, startResearch, detectedMode])

  const handleSkipToResearch = useCallback(() => {
    const ctx = questionHistory.map(e => `${e.question.question}: ${e.answer}`).join('\n')
    startResearch(ctx || undefined)
  }, [questionHistory, startResearch])

  const handleContinueResearch = useCallback(async () => {
    const newPrompt = followUpText.trim()
    if (!newPrompt) return

    // Capture Q&A history BEFORE clearing it
    const capturedQHistory = questionHistory.slice()

    // Snapshot the current result into history before submitting
    if (object) {
      setChatHistory(prev => [...prev, {
        prompt: currentPromptLabel || prompt,
        result: object as Partial<EliteResearchOutput>,
      }])
    }

    // Build rich context: all prior turns + Q&A answers + current result
    const allPriorTurns = chatHistory.map((entry, i) =>
      `[TURN ${i + 1}] QUERY: "${entry.prompt}"\nSUMMARY: ${entry.result?.executiveBrief ?? ''}${
        entry.result?.keyFindings?.length
          ? `\nKEY FINDINGS:\n${entry.result.keyFindings.slice(0, 3).map(f => `• ${f?.finding ?? ''}`).filter(f => f !== '• ').join('\n')}`
          : ''
      }`
    )

    const prevParts = [
      allPriorTurns.length > 0 ? `CONVERSATION HISTORY:\n${allPriorTurns.join('\n\n')}` : '',
      `CURRENT QUERY: "${currentPromptLabel || prompt}"`,
      capturedQHistory.length > 0
        ? `CLARIFICATIONS PROVIDED:\n${capturedQHistory.map(e => `Q: ${e.question.question}\nA: ${e.answer}`).join('\n')}`
        : '',
      object?.executiveBrief
        ? `CURRENT SUMMARY: ${object.executiveBrief}`
        : '',
      object?.keyFindings?.length
        ? `KEY FINDINGS:\n${
            object.keyFindings
              .slice(0, 4)
              .map(f => `• ${f?.finding ?? ''}`)
              .filter(f => f !== '• ')
              .join('\n')
          }`
        : '',
    ].filter(Boolean).join('\n\n')

    isContinuationRef.current = true
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
    setAppState('researching')
    try {
      const prior = await loadSessions()
      submit({
        prompt:               newPrompt,
        clarificationContext: prevParts,
        forceProceed:         true,
        mode:                 detectedMode,
        priorSessions:        prior.slice(0, 10),
      })
    } catch {
      submit({
        prompt:               newPrompt,
        clarificationContext: prevParts,
        forceProceed:         true,
        mode:                 detectedMode,
        priorSessions:        [],
      })
    }
  }, [followUpText, prompt, currentPromptLabel, object, detectedMode, submit, chatHistory, questionHistory])

  const handleGoDeeper = useCallback((question: string) => {
    if (object) {
      setChatHistory(prev => [...prev, {
        prompt: currentPromptLabel || prompt,
        result: object as Partial<EliteResearchOutput>,
      }])
    }
    const prevContext = [
      object?.executiveBrief ? `PREVIOUS SUMMARY: ${object.executiveBrief}` : '',
      object?.keyFindings?.length
        ? `KEY FINDINGS:\n${object.keyFindings.slice(0, 3).map(f => `• ${f?.finding ?? ''}`).filter(f => f !== '• ').join('\n')}`
        : '',
    ].filter(Boolean).join('\n\n')

    setCurrentPromptLabel(question)
    setPrompt(question)
    setQuestionHistory([])
    setQuestionPlan(null)
    setQuestionIndex(0)
    setPendingAnswer('')
    setTrustScore(null)
    setDetectedMode(null)
    setAppState('researching')
    loadSessions().then(prior => {
      submit({ prompt: question, clarificationContext: prevContext || undefined, forceProceed: true, mode: undefined, priorSessions: prior.slice(0, 10) })
    })
  }, [submit, object, currentPromptLabel, prompt])

  const isResearching   = appState === 'researching' || isLoading
  const isInputDisabled = isResearching || appState === 'questioning'
  const totalQuestions  = questionPlan?.questions.length ?? 0
  const expertTitle     = questionPlan?.expertTitle ?? ''
  const isChecking      = appState === 'checking'

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f8f5f0' }}>

      {/* ── Mobile header ─────────────────────────────────────────── */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 px-4 h-12 shrink-0"
        style={{ background: '#111827', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-1.5 rounded transition-colors"
          style={{ color: '#94a3b8' }}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <button onClick={onNewChat} className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="flex items-center justify-center h-[20px] w-[20px] rounded-[4px]" style={{ background: '#1e3a5f' }}>
            <Brain className="h-3 w-3" style={{ color: '#7aaccc' }} />
          </div>
          <span className="text-[13px] font-bold tracking-[0.06em]" style={{ color: '#e2e8f0' }}>DeepInsight</span>
        </button>
        {trustScore && <div className="ml-auto"><TrustScoreBadge score={trustScore} /></div>}
      </div>

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <Sidebar
        activeMode={selectedAgent as QueryMode | null}
        onModeSelect={(id) => {
          setSelectedAgent(id)
          setDetectedMode(id)
        }}
        onNewResearch={onNewChat}
        recentSessions={recentSessions}
        onRerun={(session) => {
          setPrompt(session.prompt)
          if (session.mode) {
            setSelectedAgent(session.mode)
            setDetectedMode(session.mode as QueryMode)
          }
          // Restore cached report if available — skip re-running research
          try {
            const cached = localStorage.getItem('di:report:' + session.prompt)
            if (cached) {
              const parsed = JSON.parse(cached) as Partial<EliteResearchOutput>
              setRestoredOutput(parsed)
              setTrustScore(computeTrustScore(parsed))
              setAppState('done')
              setSidebarOpen(false)
              return
            }
          } catch { /* ignore */ }
          setSidebarOpen(false)
        }}
        onDeleteSession={(id) => {
          setRecentSessions(prev => prev.filter(s => s.id !== id))
          void deleteSession(id)
        }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* ── Main area ─────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden pt-12 md:pt-0">

        {/* Topbar — shown when researching or done (desktop only — mobile has its own header) */}
        {(appState === 'done' || appState === 'researching' || isLoading) && (
          <div
            className="hidden md:flex items-center gap-3 px-6 h-12 shrink-0"
            style={{ background: '#f8f5f0', borderBottom: '1px solid #e8e2d9' }}
          >
            <span className="text-[11px]" style={{ color: '#94a3b8' }}>Research</span>
            <span style={{ color: '#e8e2d9' }}>/</span>
            <span className="text-[11px] truncate flex-1" style={{ color: '#1e293b' }}>
              {prompt.length > 60 ? prompt.slice(0, 60) + '…' : prompt}
            </span>
            {detectedMode && (
              <span
                className="shrink-0 text-[9px] font-mono px-2 py-1 rounded"
                style={{ background: '#1e3a5f', color: 'white' }}
              >
                {MODE_CONFIG[detectedMode]?.tag ?? detectedMode.toUpperCase()}
              </span>
            )}
            {trustScore && <TrustScoreBadge score={trustScore} />}
            {isLoading && (
              <button
                onClick={stop}
                className="shrink-0 text-[11px] font-mono px-3 py-1 rounded transition-colors"
                style={{ color: '#94a3b8', border: '1px solid #e8e2d9' }}
              >
                Stop
              </button>
            )}
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Idle state ─────────────────────────────────────────── */}
          {appState === 'idle' && (
            <div className="flex flex-col items-center justify-center min-h-full px-8 py-16">
              <div className="w-full max-w-xl space-y-5">
                {researchError && (
                  <div
                    className="flex items-start gap-3 px-4 py-3 rounded-xl text-[13px]"
                    style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: '#b91c1c' }}
                  >
                    <span className="shrink-0 mt-0.5">⚠</span>
                    <span>{researchError}</span>
                  </div>
                )}
                <h1 className="text-[26px] font-bold tracking-tight" style={{ color: '#111827' }}>
                  What do you want to research?
                </h1>

                <div
                  className="rounded-xl overflow-hidden"
                  style={{ border: '1px solid #e8e2d9', background: 'white' }}
                >
                  <textarea
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAnalyze() } }}
                    placeholder="Ask anything — a decision to make, a topic to research, a trend to understand…"
                    className="w-full min-h-[110px] p-4 resize-none focus:outline-none text-[15px] leading-relaxed placeholder:text-[#94a3b8]"
                    style={{ fontFamily: 'Georgia, serif', color: '#1e293b', background: 'transparent', caretColor: '#1e3a5f' }}
                    disabled={isInputDisabled}
                  />
                  <div
                    className="flex items-center justify-between px-4 py-2.5"
                    style={{ borderTop: '1px solid #e8e2d9' }}
                  >
                    {detectedMode ? (
                      <span className="text-[10px] font-mono" style={{ color: '#6b8cae' }}>
                        Auto · {MODE_CONFIG[detectedMode]?.label ?? detectedMode}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono" style={{ color: '#94a3b8' }}>
                        Mode auto-detected
                      </span>
                    )}
                    <button
                      onClick={handleAnalyze}
                      disabled={!prompt.trim() || isResearching || isChecking}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{ background: '#1e3a5f', color: 'white' }}
                    >
                      {isChecking ? (
                        <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Analyzing…</>
                      ) : (
                        'Run Research'
                      )}
                    </button>
                  </div>
                </div>

                {/* Mode cards grid */}
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(MODE_CONFIG) as QueryMode[]).map(modeKey => {
                    const cfg = MODE_CONFIG[modeKey]
                    const Icon = cfg.icon
                    const isSelected = selectedAgent === modeKey
                    return (
                      <button
                        key={modeKey}
                        onClick={() => {
                          setSelectedAgent(modeKey)
                          setDetectedMode(modeKey)
                          setPrompt(cfg.example)
                        }}
                        className="flex flex-col items-start gap-1.5 p-3 rounded-xl text-left transition-all"
                        style={{
                          background: isSelected ? 'rgba(30,58,95,0.08)' : 'rgba(30,58,95,0.02)',
                          border: `1px solid ${isSelected ? 'rgba(30,58,95,0.22)' : '#e8e2d9'}`,
                        }}
                        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(30,58,95,0.05)' }}
                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(30,58,95,0.02)' }}
                      >
                        <div className="flex items-center gap-1.5">
                          <Icon className="h-3 w-3 shrink-0" style={{ color: isSelected ? '#1e3a5f' : '#6b8cae' }} />
                          <span className="text-[10px] font-semibold leading-none" style={{ color: isSelected ? '#1e3a5f' : '#334155' }}>
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-[10px] leading-snug font-medium truncate" style={{ color: isSelected ? '#1e3a5f' : '#64748b' }}>
                          {cfg.tagline}
                        </p>
                      </button>
                    )
                  })}
                </div>

                <p className="text-[10px] font-mono text-center" style={{ color: '#94a3b8' }}>
                  Claude Haiku · Gemini Flash · Claude Sonnet · Live Web Search · Multi-Model Synthesis
                </p>
              </div>

            </div>
          )}

          {/* ── Checking state (classify + first question loading) ──── */}
          <AnimatePresence>
            {appState === 'checking' && (
              <motion.div
                key="checking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center justify-center min-h-full gap-4"
              >
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#6b8cae' }} />
                <p className="text-[11px] font-mono tracking-[0.18em]" style={{ color: '#94a3b8' }}>
                  ANALYZING QUERY…
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Questioning state ───────────────────────────────────── */}
          <AnimatePresence>
            {appState === 'questioning' && (
              <motion.div
                key="questioning"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center justify-center min-h-full px-8 py-16"
              >
                <div className="w-full max-w-xl space-y-4">
                  <div>
                    {expertTitle && (
                      <p className="text-[9px] font-mono tracking-[0.15em] uppercase mb-1" style={{ color: '#6b8cae' }}>
                        Consulting Expert · {expertTitle}
                      </p>
                    )}
                    <p className="text-[14px] font-semibold" style={{ color: '#111827' }}>
                      {`Question ${questionIndex + 1} of ${Math.max(totalQuestions, questionIndex + 1)}`}
                    </p>
                  </div>

                  {questionHistory.length > 0 && (
                    <div className="space-y-1.5">
                      {questionHistory.map((entry, i) => (
                        <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg" style={{ background: '#f0f7f0', border: '1px solid #c8dcc8' }}>
                          <Check className="h-3 w-3 shrink-0" style={{ color: '#2d6a2d' }} />
                          <span className="text-[12px] truncate flex-1" style={{ color: '#64748b' }}>{entry.question.question}</span>
                          <span className="text-[11px] font-semibold shrink-0" style={{ color: '#2d6a2d' }}>{entry.answer}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <AnimatePresence mode="wait">
                    {fetchingNext ? (
                      <motion.div key="fetching" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-3 py-10 justify-center">
                        <Loader2 className="h-4 w-4 animate-spin" style={{ color: '#6b8cae' }} />
                        <span className="text-[11px] font-mono tracking-[0.18em]" style={{ color: '#94a3b8' }}>
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

                  <div className="flex items-center gap-4 pt-1">
                    <button
                      onClick={handleSubmitAnswer}
                      disabled={!pendingAnswer || fetchingNext}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{ background: '#1e3a5f', color: 'white' }}
                    >
                      Continue
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={handleSkipToResearch}
                      disabled={fetchingNext}
                      className="text-[11px] font-mono transition-colors disabled:opacity-40"
                      style={{ color: '#94a3b8' }}
                    >
                      {questionHistory.length > 0 ? 'Start research now' : 'Skip questions'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Chat history (previous turns) ────────────────────────── */}
          {chatHistory.map((entry, i) => (
            <div key={i} className="px-8 py-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1" style={{ background: '#e8e2d9' }} />
                <span className="text-[10px] font-mono shrink-0 truncate max-w-[300px]" style={{ color: '#94a3b8' }}>
                  {entry.prompt}
                </span>
                <div className="h-px flex-1" style={{ background: '#e8e2d9' }} />
              </div>
              <OutputErrorBoundary>
                <StructuredOutputView data={entry.result} isLoading={false} onGoDeeper={handleGoDeeper} />
              </OutputErrorBoundary>
            </div>
          ))}

          {/* ── Research Loading ─────────────────────────────────────── */}
          {appState === 'researching' && !outputData?.executiveBrief && (
            <div className="px-8 py-8 max-w-2xl mx-auto w-full">
              <ResearchLoadingScreen
                prompt={prompt}
                isActive={true}
              />
            </div>
          )}

          {/* ── Results ─────────────────────────────────────────────── */}
          <AnimatePresence>
            {(isResearching || appState === 'done') && outputData && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="px-8 py-6"
              >
                {chatHistory.length > 0 && (
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-px flex-1" style={{ background: '#e8e2d9' }} />
                    <span className="text-[10px] font-mono shrink-0" style={{ color: '#94a3b8' }}>{currentPromptLabel}</span>
                    <div className="h-px flex-1" style={{ background: '#e8e2d9' }} />
                  </div>
                )}

                {/* Report header */}
                {appState === 'done' && (
                  <div className="flex items-center justify-between mb-5 pb-4" style={{ borderBottom: '1px solid #e8e2d9' }}>
                    <div className="flex items-center gap-2">
                      {(() => { const Icon = MODE_CONFIG[mode]?.icon; return Icon ? <Icon className="h-3.5 w-3.5" style={{ color: '#6b8cae' }} /> : null })()}
                      <span className="text-[11px] font-bold tracking-[0.08em] uppercase" style={{ color: '#1e3a5f' }}>
                        {MODE_CONFIG[mode]?.label ?? mode} Report
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono" style={{ color: '#94a3b8' }}>
                      <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>
                )}

                <OutputErrorBoundary>
                  <StructuredOutputView
                    data={outputData as Partial<EliteResearchOutput>}
                    isLoading={isLoading}
                    onGoDeeper={handleGoDeeper}
                  />
                </OutputErrorBoundary>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Post-result actions ──────────────────────────────────── */}
          <AnimatePresence>
            {appState === 'done' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="px-8 pb-12 space-y-3"
              >
                <AnimatePresence>
                  {showFollowUp && (
                    <motion.div
                      key="followup"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="rounded-xl overflow-hidden"
                      style={{ border: '1px solid #e8e2d9', background: 'white' }}
                    >
                      <div className="p-4 space-y-3">
                        <p className="text-[10px] font-mono tracking-[0.15em]" style={{ color: '#6b8cae' }}>
                          FOLLOW-UP · CONTEXT CARRIED FORWARD
                        </p>
                        <textarea
                          autoFocus
                          value={followUpText}
                          onChange={e => setFollowUpText(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleContinueResearch() } }}
                          placeholder="Ask a follow-up question about this topic…"
                          rows={3}
                          className="w-full rounded-lg p-3 text-[14px] leading-relaxed placeholder:text-[#94a3b8] resize-none focus:outline-none"
                          style={{ fontFamily: 'Georgia, serif', color: '#1e293b', background: '#fafaf8', border: '1px solid #e8e2d9', caretColor: '#1e3a5f' }}
                        />
                        <div className="flex items-center gap-3">
                          <button
                            onClick={handleContinueResearch}
                            disabled={!followUpText.trim()}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            style={{ background: '#1e3a5f', color: 'white' }}
                          >
                            <Send className="h-3.5 w-3.5" />
                            Research this
                          </button>
                          <button
                            onClick={() => { setShowFollowUp(false); setFollowUpText('') }}
                            className="text-[11px] font-mono transition-colors"
                            style={{ color: '#94a3b8' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!showFollowUp && (
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => setShowFollowUp(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium transition-colors"
                      style={{ border: '1px solid #1e3a5f', color: '#1e3a5f', background: 'transparent' }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Continue Chat
                    </button>
                    <button
                      onClick={onNewChat}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium transition-colors"
                      style={{ border: '1px solid #e8e2d9', color: '#64748b' }}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Start New Chat
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>{/* end scrollable */}
      </main>

      {/* ── Sources Rail (done state only, desktop only) ─────────── */}
      <div className="hidden md:block">
      <AnimatePresence>
        {appState === 'done' && outputData?.sourceRegistry && outputData.sourceRegistry.length > 0 && (
          <motion.div
            key="sources-rail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <SourcesRail sources={outputData!.sourceRegistry as NonNullable<EliteResearchOutput['sourceRegistry']>} />
          </motion.div>
        )}
      </AnimatePresence>
      </div>{/* end hidden md:block */}

    </div>
  )
}
