// ─── Context Enrichment Node ──────────────────────────────────────────────────
// Pure transformation step between Phase 1 (classify+plan) and Phase 2 (search).
// Combines mode, plan output, clarification context, and user prompt into a
// structured EnrichedResearchContext object consumed by callClaude and callGemini.
//
// Design: pure function — no I/O, no model calls. Safe to call synchronously.
// Used by: ai/graphs/research-pipeline.ts

import type { QueryMode, ResearchPlan } from '@/ai/schemas'

export interface EnrichedResearchContext {
  researchPrompt: string   // base prompt for Claude reasoning node
  geminiPrompt: string     // search-augmented prompt for Gemini web search node
  searchQueries: string[]  // preserved for gap iteration in Phase 2.5
}

// Mode-specific focus hints injected into the Gemini search prompt.
// Steers the live search toward the evidence type most useful for each mode.
const MODE_FOCUS: Partial<Record<QueryMode, string>> = {
  decision:     'Focus on comparison data, user reviews, pricing, and expert recommendations.',
  intelligence: 'Focus on the most recent developments, key players, and current state as of today.',
  competitive:  'Focus on market share, competitive positioning, and recent competitive moves.',
  perspectives: 'Focus on different expert opinions, counterarguments, and nuanced positions.',
  explainer:    'Focus on mechanisms, causal chains, and concrete real-world examples.',
}

export function enrichResearchContext(
  prompt: string,
  mode: QueryMode,
  plan: ResearchPlan | null,
  clarificationContext?: string,
): EnrichedResearchContext {
  const researchPrompt = plan?.enrichedPrompt ?? prompt
  const searchQueries  = plan?.searchQueries  ?? []

  const searchBlock = searchQueries.length > 0
    ? `\n\nSearch specifically for:\n${searchQueries.slice(0, 3).map((q, i) => `${i + 1}. ${q}`).join('\n')}`
    : ''

  const focusHint  = MODE_FOCUS[mode]
  const focusBlock = focusHint ? `\n\n${focusHint}` : ''

  // Inject clarification answers into the Gemini prompt so searches are
  // scoped to the user's actual constraints (budget, use case, timeline, etc.)
  const clarificationBlock = clarificationContext
    ? `\n\nUser context (factor this into your searches):\n${clarificationContext}`
    : ''

  return {
    researchPrompt,
    geminiPrompt: `${researchPrompt}${searchBlock}${focusBlock}${clarificationBlock}`,
    searchQueries,
  }
}
