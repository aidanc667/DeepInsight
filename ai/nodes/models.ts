// ─── AI Model Call Wrappers ───────────────────────────────────────────────────
// One function per model node in the pipeline.
// Source-related utilities live in ai/nodes/sources.ts.

import { generateText, stepCountIs, Output } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { google } from '@ai-sdk/google'
import type { Citation, ModelResponse, ResearchPlan } from '@/ai/schemas'
import { ResearchPlanSchema } from '@/ai/schemas'
import { PLANNER_SYSTEM_PROMPT, buildPlannerPrompt } from '@/ai/prompts/planner'
import { extractDomain, getSourceQuality } from '@/ai/nodes/sources'

// Re-export source utilities so pipeline imports stay in one place
export { getSourceQuality, extractSourceSnippets, buildAnnotatedSourceBlock } from '@/ai/nodes/sources'
export type { SourceSnippet, SourceQuality } from '@/ai/nodes/sources'

// ─── Node: Plan research ──────────────────────────────────────────────────────

export async function planResearch(
  prompt: string,
  clarificationContext?: string,
): Promise<ResearchPlan> {
  const result = await generateText({
    model: anthropic('claude-haiku-4-5'),
    system: PLANNER_SYSTEM_PROMPT,
    prompt: buildPlannerPrompt(prompt, clarificationContext),
    output: Output.object({ schema: ResearchPlanSchema }),
    maxOutputTokens: 600,
  })
  return result.output as ResearchPlan
}

// ─── Node: Quality gate ───────────────────────────────────────────────────────

export interface QualityEvaluation {
  score: number
  shouldIterate: boolean
  gaps: string[]
  reason: string
}

export async function evaluateResearchQuality(
  prompt: string,
  claudeText: string,
  geminiText: string,
  citationCount: number,
): Promise<QualityEvaluation> {
  try {
    const result = await generateText({
      model: anthropic('claude-haiku-4-5'),
      system: `You evaluate research quality and decide whether another search pass is needed.
Output ONLY valid JSON: { "score": 0-100, "shouldIterate": boolean, "gaps": ["search query"], "reason": "one sentence" }

Scoring (start at 60):
• Citations: 0 = −30, 1-3 = −10, 4-7 = +0, 8+ = +15
• Directly answers the question: No = −25, Partial = +0, Yes = +20
• Has specific facts/numbers/dates: None = −15, Some = +0, Many = +15
• Coverage depth: Thin = −15, Adequate = +0, Comprehensive = +15

Set shouldIterate=true ONLY if score < 60.
If shouldIterate=true, gaps must contain 2-3 specific search queries to fix the weakest areas.
If shouldIterate=false, gaps should be [].`,
      prompt: `Question: "${prompt}"
Web sources found: ${citationCount}

Claude analysis:
${claudeText.slice(0, 400)}

Gemini web search:
${geminiText.slice(0, 400)}

Evaluate.`,
      maxOutputTokens: 200,
    })

    const text = result.text.trim()
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return { score: 70, shouldIterate: false, gaps: [], reason: 'Parse failed — skipping iteration' }

    const parsed = JSON.parse(match[0])
    const score = Math.min(100, Math.max(0, Number(parsed.score) || 60))
    return {
      score,
      shouldIterate: Boolean(parsed.shouldIterate) && score < 65,
      gaps: Array.isArray(parsed.gaps)
        ? parsed.gaps.filter((g: unknown) => typeof g === 'string').slice(0, 3)
        : [],
      reason: String(parsed.reason || ''),
    }
  } catch {
    return { score: 70, shouldIterate: false, gaps: [], reason: 'Evaluation error — skipping iteration' }
  }
}

// ─── Node: Claude deep reasoning ──────────────────────────────────────────────

export async function callClaude(prompt: string): Promise<ModelResponse> {
  const start = Date.now()
  const result = await generateText({
    model: anthropic('claude-sonnet-4-5'),
    system: 'You are an expert research analyst. Give structured analysis: key facts, causal relationships, logical inconsistencies, and areas of genuine uncertainty. Be specific — cite numbers, names, dates. Flag anything the user should verify. Be thorough but concise.',
    prompt,
    maxOutputTokens: 1100,
  })
  return {
    modelId: 'claude',
    rawText: result.text,
    citations: [],
    latencyMs: Date.now() - start,
  }
}

// ─── Node: Gemini live web search ─────────────────────────────────────────────

export async function callGemini(prompt: string): Promise<ModelResponse> {
  const start = Date.now()
  const result = await generateText({
    model: google('gemini-3-flash-preview'),
    system: `You are a real-time research analyst with live Google web search. Today's date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.

RECENCY — this is critical:
• Always search for the most current year's data (${new Date().getFullYear()} first, then ${new Date().getFullYear() - 1})
• For vehicles/products: explicitly search for "${new Date().getFullYear()} model year" — never default to older models
• For prices, stats, rankings: find the most recent published figures, note the date
• If you find only older data, say so explicitly and flag it as potentially outdated

SOURCE PRIORITY — always prefer in this order:
1. Government agencies (.gov, .mil, official regulatory bodies)
2. Academic institutions (.edu) and peer-reviewed journals (PubMed, Nature, Science, NEJM, Lancet, JSTOR, arXiv)
3. Major international news (Reuters, AP, BBC, NYT, WSJ, Bloomberg, FT, The Guardian, The Economist)
4. Industry authorities (WHO, IMF, World Bank, OECD, major think tanks)
5. Established industry publications (TechCrunch, Wired, Harvard Business Review, McKinsey, Gartner)

Only fall back to blogs, forums, or social media if no authoritative source covers the topic.

Always cite specific statistics, dates, names, and direct quotes. State the source domain when referencing a fact.`,
    prompt,
    tools: {
      google_search: google.tools.googleSearch({}),
    },
    stopWhen: stepCountIs(1),
    maxOutputTokens: 1500,
  })

  type GGMeta = { groundingMetadata?: { groundingChunks?: Array<{ web?: { uri?: string; title?: string } }> } }
  const meta = result.providerMetadata?.google as GGMeta | undefined
  const chunks = meta?.groundingMetadata?.groundingChunks ?? []

  const citations: Citation[] = chunks
    .map(c => c.web?.uri)
    .filter((uri): uri is string => !!uri)
    .slice(0, 12)
    .map(url => {
      const domain = extractDomain(url)
      const quality = getSourceQuality(domain)
      return {
        url,
        domain,
        domainType: quality.domainType,
        publishedAt: null,
      }
    })

  return {
    modelId: 'gemini',
    rawText: result.text,
    citations,
    latencyMs: Date.now() - start,
  }
}
