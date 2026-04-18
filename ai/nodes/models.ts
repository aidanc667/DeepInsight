// ─── AI Model Nodes ───────────────────────────────────────────────────────────
// Individual AI model call wrappers — each function is one "node" in the pipeline.
// Used by: ai/graphs/research-pipeline.ts
//
// Node overview:
//   planResearch()              — Haiku: generate search queries & research plan
//   evaluateResearchQuality()   — Haiku: quality gate (score 0–100, iterate if <60)
//   callClaude()                — Haiku: deep reasoning analyst
//   callGemini()                — Gemini Flash: live web search with grounding
//   extractSourceSnippets()     — HTTP fetch: extract clean text from top sources
//   buildAnnotatedSourceBlock() — Formatter: assemble credibility-ranked source block
//   getSourceQuality()          — Classifier: score a domain's credibility tier

import { generateText, stepCountIs, Output } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { google } from '@ai-sdk/google'
import type { Citation, ModelResponse, ResearchPlan } from '@/ai/schemas'
import { ResearchPlanSchema } from '@/ai/schemas'
import { PLANNER_SYSTEM_PROMPT, buildPlannerPrompt } from '@/ai/prompts/planner'

// ─── Domain Classification & Source Quality ───────────────────────────────────

function extractDomain(url: string): string {
  try { return new URL(url).hostname.replace('www.', '') } catch { return url }
}

const TIER1_NEWS = new Set([
  'reuters.com', 'apnews.com', 'bbc.com', 'bbc.co.uk', 'nytimes.com', 'wsj.com',
  'theguardian.com', 'bloomberg.com', 'ft.com', 'economist.com', 'nature.com',
  'science.org', 'nejm.org', 'thelancet.com', 'bmj.com', 'who.int', 'cdc.gov',
  'nih.gov', 'fda.gov', 'sec.gov', 'federalreserve.gov', 'imf.org', 'worldbank.org',
  'un.org', 'europa.eu',
])

const TIER2_INDUSTRY = new Set([
  'techcrunch.com', 'wired.com', 'arstechnica.com', 'theverge.com', 'venturebeat.com',
  'hbr.org', 'mckinsey.com', 'bcg.com', 'deloitte.com', 'gartner.com', 'forrester.com',
  'statista.com', 'cbinsights.com', 'crunchbase.com', 'pitchbook.com',
  'investopedia.com', 'marketwatch.com', 'cnbc.com', 'forbes.com', 'businessinsider.com',
  'healthline.com', 'webmd.com', 'mayoclinic.org', 'clevelandclinic.org',
  'stackoverflow.com', 'github.com', 'arxiv.org', 'ssrn.com', 'pubmed.ncbi.nlm.nih.gov',
  'sciencedirect.com', 'jstor.org', 'researchgate.net',
])

const SOCIAL_DOMAINS = new Set([
  'twitter.com', 'x.com', 'reddit.com', 'facebook.com', 'instagram.com',
  'tiktok.com', 'youtube.com', 'linkedin.com', 'quora.com', 'pinterest.com',
])

export interface SourceQuality {
  domainType: Citation['domainType']
  credibilityTier: 'high' | 'medium' | 'low'
  credibilityScore: number  // 1–5
  tierLabel: string
}

export function getSourceQuality(domain: string): SourceQuality {
  if (domain.endsWith('.gov') || domain.endsWith('.mil')) {
    return { domainType: 'gov', credibilityTier: 'high', credibilityScore: 5, tierLabel: 'Government' }
  }
  if (domain.endsWith('.edu')) {
    return { domainType: 'edu', credibilityTier: 'high', credibilityScore: 5, tierLabel: 'Academic' }
  }
  if (TIER1_NEWS.has(domain) || Array.from(TIER1_NEWS).some(d => domain.endsWith('.' + d) || domain.includes('.' + d))) {
    return { domainType: 'news', credibilityTier: 'high', credibilityScore: 4, tierLabel: 'Major News/Research' }
  }
  if (SOCIAL_DOMAINS.has(domain)) {
    return { domainType: 'social', credibilityTier: 'low', credibilityScore: 1, tierLabel: 'Social Media' }
  }
  if (TIER2_INDUSTRY.has(domain)) {
    return { domainType: 'news', credibilityTier: 'medium', credibilityScore: 3, tierLabel: 'Industry Publication' }
  }
  return { domainType: 'other', credibilityTier: 'medium', credibilityScore: 2, tierLabel: 'Web Source' }
}

// ─── Node: Plan research ──────────────────────────────────────────────────────
// Haiku generates search queries, enriched prompt, data points, and success criteria.

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
// Single Haiku call that scores research quality AND generates gap queries.
// Replaces always-on gap detection — only iterates when research is weak (score < 60).

export interface QualityEvaluation {
  score: number          // 0–100
  shouldIterate: boolean // true only if score < 60
  gaps: string[]         // targeted search queries to fill critical holes
  reason: string         // one-sentence explanation
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
      // Double-guard: only iterate if score is actually low (prevent hallucinated shouldIterate=true)
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
// Haiku as a structured reasoning analyst — produces key facts, inconsistencies,
// and areas of uncertainty to feed into the Sonnet synthesizer.

export async function callClaude(prompt: string): Promise<ModelResponse> {
  const start = Date.now()
  const result = await generateText({
    model: anthropic('claude-haiku-4-5'),
    system: 'You are an expert research analyst. Give structured analysis: key facts, logical inconsistencies, areas of uncertainty. Be specific — numbers, names, dates. Be concise.',
    prompt,
    maxOutputTokens: 900,
  })
  return {
    modelId: 'claude',
    rawText: result.text,
    citations: [],
    latencyMs: Date.now() - start,
  }
}

// ─── Node: Gemini live web search ─────────────────────────────────────────────
// Gemini Flash with Google Search tool — provides real-time citations and grounding.
// Source priority enforced via system prompt: gov > edu > major news > industry.

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

  // Extract citations from Google Search grounding metadata
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

// ─── Node: Source content extraction ─────────────────────────────────────────
// Fetches top credible sources and extracts clean text snippets.
// Runs in parallel with the quality gate — completely non-blocking on failure.
// Skips paywalled and social domains automatically.

// Domains that reliably block bots or require login to see content
const SKIP_FETCH_DOMAINS = new Set([
  ...Array.from(SOCIAL_DOMAINS),
  'wsj.com', 'ft.com', 'nytimes.com', 'bloomberg.com', 'thelancet.com',
  'nejm.org', 'sciencedirect.com', 'jstor.org', 'nature.com', 'science.org',
])

export interface SourceSnippet {
  url: string
  domain: string
  title: string
  snippet: string
}

export async function extractSourceSnippets(
  citations: Array<{ url: string; domain: string }>,
  totalBudgetMs = 4500,
): Promise<SourceSnippet[]> {
  const candidates = [...citations]
    .filter(c => !SKIP_FETCH_DOMAINS.has(c.domain) && c.url.startsWith('http'))
    .sort((a, b) => getSourceQuality(b.domain).credibilityScore - getSourceQuality(a.domain).credibilityScore)
    .slice(0, 4)

  if (candidates.length === 0) return []

  const deadline = Date.now() + totalBudgetMs

  const results = await Promise.allSettled(
    candidates.map(async ({ url, domain }) => {
      const remaining = deadline - Date.now()
      if (remaining < 400) return null

      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), Math.min(remaining - 200, 2500))
      try {
        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        })
        clearTimeout(timer)
        if (!res.ok) return null
        const ct = res.headers.get('content-type') ?? ''
        if (!ct.includes('html')) return null

        const html = await res.text()
        const title = html.match(/<title[^>]*>([^<]{1,120})<\/title>/i)?.[1]?.trim() ?? domain
        const clean = html
          .replace(/<script[\s\S]*?<\/script>/gi, ' ')
          .replace(/<style[\s\S]*?<\/style>/gi, ' ')
          .replace(/<!--[\s\S]*?-->/g, ' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&[a-z#0-9]+;/gi, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 1400)

        if (clean.length < 120) return null
        return { url, domain, title, snippet: clean } as SourceSnippet
      } catch {
        clearTimeout(timer)
        return null
      }
    }),
  )

  return results
    .filter((r): r is PromiseFulfilledResult<SourceSnippet | null> => r.status === 'fulfilled')
    .map(r => r.value)
    .filter((s): s is SourceSnippet => s !== null)
}

// ─── Formatter: Annotated source block ───────────────────────────────────────
// Sorted highest credibility first so the synthesizer weighs them accordingly.
// When snippets are available, embeds the first 280 chars of real page content
// so the synthesizer can quote directly and attribute claims to specific sources.

export function buildAnnotatedSourceBlock(
  citations: Array<{ url: string; domain: string }>,
  snippets: SourceSnippet[] = [],
): string {
  if (citations.length === 0) return ''

  const snippetMap = new Map(snippets.map(s => [s.url, s]))

  // Cap at 8 sources — Sonnet attribution rarely uses more than that,
  // and reducing the block saves ~400 input tokens.
  const scored = citations.slice(0, 8).map(c => {
    const quality  = getSourceQuality(c.domain)
    const stars    = '★'.repeat(quality.credibilityScore) + '☆'.repeat(5 - quality.credibilityScore)
    const snippet  = snippetMap.get(c.url)
    const extra    = snippet
      ? `\n  └─ EXTRACTED: "${snippet.snippet.slice(0, 150)}"`
      : ''
    return {
      ...c, quality,
      label: `- [${c.domain}] ${c.url} [${stars} ${quality.tierLabel}]${extra}`,
    }
  })

  // Best sources first — synthesizer sees top-tier sources before it starts writing
  scored.sort((a, b) => b.quality.credibilityScore - a.quality.credibilityScore)

  const tierGroups = {
    high:   scored.filter(s => s.quality.credibilityTier === 'high'),
    medium: scored.filter(s => s.quality.credibilityTier === 'medium'),
    low:    scored.filter(s => s.quality.credibilityTier === 'low'),
  }

  const summary = [
    tierGroups.high.length   > 0 && `${tierGroups.high.length} high-credibility`,
    tierGroups.medium.length > 0 && `${tierGroups.medium.length} medium`,
    tierGroups.low.length    > 0 && `${tierGroups.low.length} low`,
  ].filter(Boolean).join(', ')

  const snippetNote = snippets.length > 0
    ? ` | ${snippets.length} sources with extracted page content`
    : ''

  return `\n\nSources from Gemini web search (${summary}${snippetNote}) — include ALL in sourceRegistry. For each keyFinding, set attributedSources to the domain names of sources that directly support that specific claim:\n${scored.map(s => s.label).join('\n')}`
}
