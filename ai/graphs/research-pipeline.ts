// ─── Research Pipeline Graph ──────────────────────────────────────────────────
// Orchestrates the full multi-phase research workflow.
// Called by: app/api/research/route.ts
//
// Pipeline phases:
//   Phase 1  — Classify query mode + Plan search queries (parallel Haiku calls)
//   Phase 1.5— Context enrichment: combine mode + plan + clarification into structured prompts
//   Phase 2  — Claude deep reasoning + Gemini live web search (parallel)
//   Phase 2.5— Source extraction (non-blocking, 1.5s cap)
//   Phase 3  — Claude Sonnet streams structured JSON output
//
// Design principles:
//   • All expensive calls run in parallel where possible
//   • Source extraction is non-blocking — waits max 1.5s then proceeds
//   • Graceful degradation: any single node failure does not abort the pipeline

import { streamText, generateText, Output } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import {
  callClaude,
  callGemini,
  planResearch,
  buildAnnotatedSourceBlock,
  extractSourceSnippets,
  type SourceExtractionResult,
} from '@/ai/nodes/models'
import { enrichResearchContext } from '@/ai/nodes/context-enricher'
import { QueryClassifierSchema, QUERY_MODES, getSchemaForMode } from '@/ai/schemas'
import type { QueryMode } from '@/ai/schemas'
import { getSynthesizerSystem, buildSynthesizerPrompt } from '@/ai/prompts/synthesizer'
import { CLASSIFIER_SYSTEM_PROMPT, buildClassifierPrompt } from '@/ai/prompts/classifier'
import { findRelatedSessions, buildPriorContextBlock } from '@/ai/services/research-memory'
import type { ResearchSession } from '@/ai/services/research-memory'

// ─── Internal: classify query mode ───────────────────────────────────────────
// Haiku classifies the query into one of 6 modes. Defaults to 'research' on error.

async function classifyQuery(prompt: string): Promise<{ mode: QueryMode; confidence: number }> {
  try {
    const result = await generateText({
      model: anthropic('claude-haiku-4-5'),
      system: CLASSIFIER_SYSTEM_PROMPT,
      prompt: buildClassifierPrompt(prompt),
      output: Output.object({ schema: QueryClassifierSchema }),
      maxOutputTokens: 150,
    })
    const out = result.output as { mode?: string; confidence?: number } | null
    const mode = out?.mode
    const confidence = out?.confidence ?? 50
    if (mode && QUERY_MODES.includes(mode as QueryMode)) {
      return { mode: mode as QueryMode, confidence }
    }
    return { mode: 'research', confidence: 50 }
  } catch {
    return { mode: 'research', confidence: 50 }
  }
}

// ─── Pipeline input ───────────────────────────────────────────────────────────

export interface ResearchPipelineInput {
  prompt: string
  clarificationContext?: string
  forceProceed?: boolean
  mode?: string               // client-side mode hint (overrides classifier if valid)
  priorSessions?: ResearchSession[]
  prefetchedGemini?: { rawText: string; citations: import('@/ai/schemas').Citation[] } | null
}

// ─── Main pipeline ────────────────────────────────────────────────────────────

export async function runResearchPipeline(input: ResearchPipelineInput): Promise<Response> {
  const { prompt, forceProceed, mode: clientMode, priorSessions, prefetchedGemini } = input
  const clarificationContext = forceProceed ? undefined : input.clarificationContext


  // ── Pre-Phase 1: Start Gemini on raw query immediately ───────────────────
  // Fire before classify resolves to eliminate the sequential Phase1→Phase2 gap.
  // If the classified mode doesn't use Gemini (SAGE/ECHO), the result is discarded.
  // Cost: occasional wasted Gemini call. Benefit: saves ~1–2s on all other runs.
  const emptyClaudeResponse  = { modelId: 'claude' as const, rawText: '', citations: [], latencyMs: 0 }
  const emptyGeminiResponse  = { modelId: 'gemini' as const, rawText: '', citations: [], latencyMs: 0 }

  const earlyGeminiPromise = (!clientMode && !prefetchedGemini)
    ? callGemini(prompt).catch(() => emptyGeminiResponse)
    : null

  // ── Phase 1: Classify + Plan in parallel (both Haiku — fast) ──────────────
  const [{ mode, confidence: modeConfidence }, plan] = await Promise.all([
    clientMode && QUERY_MODES.includes(clientMode as QueryMode)
      ? Promise.resolve({ mode: clientMode as QueryMode, confidence: 90 })
      : classifyQuery(prompt),
    // Skip planner when agent selected (mode already known) or clarification
    // context already scopes the search.
    (clientMode || clarificationContext)
      ? Promise.resolve(null)
      : planResearch(prompt).catch(err => {
          console.warn('[research] planner failed:', err)
          return null
        }),
  ])

  // ── Phase 1.5: Context enrichment ─────────────────────────────────────────
  // Combines mode + plan + clarification context into structured prompts for
  // the Claude and Gemini nodes. Falls back to inline construction on failure.
  let researchPrompt = plan?.enrichedPrompt ?? prompt
  let searchQueries  = plan?.searchQueries  ?? []
  let geminiPrompt: string

  try {
    const enriched = enrichResearchContext(prompt, mode, plan ?? null, clarificationContext)
    researchPrompt = enriched.researchPrompt
    searchQueries  = enriched.searchQueries
    geminiPrompt   = enriched.geminiPrompt
  } catch (err) {
    console.warn('[research] context enrichment failed — using fallback:', err)
    geminiPrompt = searchQueries.length > 0
      ? `${researchPrompt}\n\nSearch specifically for:\n${searchQueries.slice(0, 3).map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}`
      : researchPrompt
  }


  // Claude pre-pass: only for decision modes that need multi-angle reasoning.
  // perspectives (ECHO) removed — structured perspectiveSides output doesn't need it.
  const CLAUDE_REASONING_MODES = new Set(['decision', 'competitive'])

  // Gemini live search: skip for SAGE (explainer) and ECHO (perspectives) —
  // they need reasoning over knowledge, not real-time web data.
  const GEMINI_SEARCH_MODES = new Set(['decision', 'research', 'intelligence', 'competitive', 'action', 'forecast'])
  // If the client pre-fired Gemini during clarification, reuse those results
  // instead of calling Gemini again — saves 3–8s on the critical path.
  const prefetchedGeminiResponse = prefetchedGemini
    ? { modelId: 'gemini' as const, rawText: prefetchedGemini.rawText, citations: prefetchedGemini.citations, latencyMs: 0 }
    : null

  const agentSelected = !!clientMode

  // ── Phase 2 + 2.5: Model calls and source extraction in parallel ───────────
  // When prefetched Gemini is available we already have citation URLs, so we can
  // kick off source extraction immediately alongside Phase 2 rather than waiting
  // for Phase 2 to complete first. This saves up to 1.5s on the critical path.
  //
  // Agent path: skip source extraction entirely — snippets aren't needed for
  // focused single-role output, and skipping saves 1.5s.

  const prefetchedCitationRefs = prefetchedGeminiResponse
    ? prefetchedGeminiResponse.citations.map((c: { url: string; domain: string }) => ({ url: c.url, domain: c.domain }))
    : null

  const emptyExtraction: SourceExtractionResult = { snippets: [], failedUrls: new Set<string>() }

  // Start source extraction early only when we have citations from presearch
  const earlySnippetsPromise = (!agentSelected && prefetchedCitationRefs && prefetchedCitationRefs.length > 0)
    ? Promise.race([
        extractSourceSnippets(prefetchedCitationRefs).catch(() => emptyExtraction),
        new Promise<typeof emptyExtraction>(resolve => setTimeout(() => resolve(emptyExtraction), 1000)),
      ])
    : null

  const [claudeResult, geminiResult] = await Promise.allSettled([
    CLAUDE_REASONING_MODES.has(mode) ? callClaude(researchPrompt) : Promise.resolve(emptyClaudeResponse),
    GEMINI_SEARCH_MODES.has(mode)
      ? (prefetchedGeminiResponse
          ? Promise.resolve(prefetchedGeminiResponse)
          : (earlyGeminiPromise ?? callGemini(geminiPrompt)))
      : Promise.resolve(emptyGeminiResponse),
  ])

  const claudeText = claudeResult.status === 'fulfilled'
    ? claudeResult.value.rawText
    : 'No response from Claude'

  const geminiText = geminiResult.status === 'fulfilled'
    ? geminiResult.value.rawText
    : ''

  const geminiCitations = geminiResult.status === 'fulfilled'
    ? geminiResult.value.citations
    : []

  // Only fail if at least one model was actually called and both returned nothing.
  // explainer + perspectives intentionally skip both pre-passes and rely solely
  // on the synthesizer — so empty claudeText + geminiText is expected for them.
  const eitherAttempted = CLAUDE_REASONING_MODES.has(mode) || GEMINI_SEARCH_MODES.has(mode)
  if (eitherAttempted && !claudeText && !geminiText) {
    return Response.json(
      { error: 'All model calls failed. Please check your API keys and try again.' },
      { status: 503 },
    )
  }

  const allCitations = geminiCitations
  const citationRefs = allCitations.map(c => ({ url: c.url, domain: c.domain }))

  // ── Phase 2.5: Source extraction ──────────────────────────────────────────
  // If early extraction already ran in parallel with Phase 2, reuse those results.
  // Otherwise fall back to the standard post-Phase-2 extraction with a 1s cap.
  let sourceExtraction = emptyExtraction
  if (!agentSelected && geminiText) {
    if (earlySnippetsPromise) {
      sourceExtraction = await earlySnippetsPromise
    } else {
      const snippetsPromise = extractSourceSnippets(citationRefs).catch(() => emptyExtraction)
      sourceExtraction = await Promise.race([snippetsPromise, new Promise<typeof emptyExtraction>(resolve => setTimeout(() => resolve(emptyExtraction), 1000))])
    }
  }


  // ── Prior Research Context ─────────────────────────────────────────────────
  // Skip for agent queries — prior context rarely helps focused single-role output.
  let priorContextBlock = ''
  if (!agentSelected && priorSessions && Array.isArray(priorSessions) && priorSessions.length > 0) {
    const related = findRelatedSessions(prompt, priorSessions, 3)
    priorContextBlock = buildPriorContextBlock(related)
  }

  // ── Phase 3: Synthesize ────────────────────────────────────────────────────
  // Agent → Haiku, lean source block, tight token cap.
  // Deep research → Sonnet, full source block, mode-tuned token cap.
  const annotatedSources = buildAnnotatedSourceBlock(
    agentSelected ? citationRefs.slice(0, 4) : citationRefs,
    sourceExtraction.snippets,
    sourceExtraction.failedUrls,
  )

  const synthesisModel = agentSelected
    ? anthropic('claude-haiku-4-5')
    : anthropic('claude-sonnet-4-5')

  const maxTokens = mode === 'decision' ? 3000
    : mode === 'forecast' ? 2000
    : agentSelected ? 900
    : mode === 'research' || mode === 'intelligence' || mode === 'explainer' ? 1300
    : 1500

  const synthesisResult = streamText({
    model: synthesisModel,
    system: getSynthesizerSystem(mode),
    prompt: buildSynthesizerPrompt(
      mode,
      prompt,
      claudeText,
      geminiText || 'No web search results available',
      annotatedSources,
      clarificationContext,
      priorContextBlock,
    ),
    output: Output.object({ schema: getSchemaForMode(mode) }),
    maxOutputTokens: maxTokens,
  })

  return synthesisResult.toTextStreamResponse()
}
