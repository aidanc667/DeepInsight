// ─── Source Quality, Fetching & Formatting ────────────────────────────────────
// Everything source-related, isolated from model call wrappers.
// SSRF protection, domain credibility scoring, snippet extraction, source block.

import type { Citation } from '@/ai/schemas'

// ─── Domain Classification ────────────────────────────────────────────────────

export function extractDomain(url: string): string {
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

export const SOCIAL_DOMAINS = new Set([
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

// ─── Source Extraction ────────────────────────────────────────────────────────
// Fetches top credible sources and extracts clean text snippets.
// Skips paywalled and social domains. SSRF-protected.

// Domains that reliably block bots or require login
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

// Block fetches to private/loopback/link-local ranges to prevent SSRF
function isSafeUrl(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url)
    if (protocol !== 'https:' && protocol !== 'http:') return false
    if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|::1$|fc00:|fe80:)/i.test(hostname)) return false
    return true
  } catch {
    return false
  }
}

export async function extractSourceSnippets(
  citations: Array<{ url: string; domain: string }>,
  totalBudgetMs = 4500,
): Promise<SourceSnippet[]> {
  const candidates = [...citations]
    .filter(c => !SKIP_FETCH_DOMAINS.has(c.domain) && isSafeUrl(c.url))
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
            'User-Agent': 'DeepInsightBot/1.0 (+https://deepinsight-agent.vercel.app)',
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

// ─── Source Block Formatter ───────────────────────────────────────────────────
// Sorts highest credibility first so the synthesizer weighs them accordingly.
// Embeds extracted page content when available for direct attribution.

export function buildAnnotatedSourceBlock(
  citations: Array<{ url: string; domain: string }>,
  snippets: SourceSnippet[] = [],
): string {
  if (citations.length === 0) return ''

  const snippetMap = new Map(snippets.map(s => [s.url, s]))

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
