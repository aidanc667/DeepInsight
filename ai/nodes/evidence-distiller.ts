// ─── Evidence Distillation Node ──────────────────────────────────────────────
// Runs after research retrieval (Phase 2.5) and before synthesis (Phase 3).
// Haiku call: extracts structured claims from raw model outputs so Sonnet
// consumes a compact evidence package instead of unstructured text dumps.
//
// Token benefit: replaces ~3200–4400 chars of raw text with ~800 chars of
// pre-extracted, verified claims → leaner Sonnet prompt, lower hallucination risk.
//
// Used by: ai/graphs/research-pipeline.ts (Phase 2.75)

import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import type { Citation } from '@/ai/schemas'
import type { SourceSnippet } from '@/ai/nodes/models'

export interface DistilledEvidence {
  keyClaims: string[]        // 4–6 specific factual claims with figures/dates/names
  supportedBy: string[]      // domains that actually appear cited in the research
  contradictions: string[]   // real conflicts between sources or hedged claims
  coverageNote: string       // 1 sentence: what's well-covered vs what's thin
}

export async function distillEvidence(
  geminiText: string,
  claudeText: string,
  citations: Array<Pick<Citation, 'url' | 'domain'>>,
  snippets: SourceSnippet[],
  qualityScore: number,
): Promise<DistilledEvidence> {
  const domains = [...new Set(citations.map(c => c.domain))].slice(0, 8).join(', ')

  // Include up to 2 extracted snippets for grounding — keeps input lean
  const snippetBlock = snippets.length > 0
    ? `\nExtracted page content:\n${snippets.slice(0, 2).map(s => `[${s.domain}]: "${s.snippet.slice(0, 200)}"`).join('\n')}`
    : ''

  const result = await generateText({
    model: anthropic('claude-haiku-4-5'),
    system: `Extract and structure research evidence. Output ONLY valid JSON:
{
  "keyClaims": ["Specific factual claim with any figures/dates/names — 4 to 6 claims"],
  "supportedBy": ["domain.com — only domains you actually saw cited in the text"],
  "contradictions": ["Real conflict or hedged claim — empty array if none"],
  "coverageNote": "One sentence on what is well-covered and what is thin"
}

Rules:
- keyClaims: concrete facts only. No vague statements. Include numbers, dates, names.
- supportedBy: only domains you saw actually referenced — never invent sources.
- contradictions: only genuine conflicts or stated uncertainty. Leave empty if clean.
- coverageNote: be specific. "Strong on X, thin on Y" is better than "adequate coverage".`,
    prompt: `Sources found (${citations.length}): ${domains || 'none'}
Quality score: ${qualityScore}/100${snippetBlock}

[GEMINI — web search results]
${geminiText.slice(0, 1200)}

[CLAUDE — analysis]
${claudeText.slice(0, 400)}

Distill the evidence now.`,
    maxOutputTokens: 380,
  })

  const match = result.text.trim().match(/\{[\s\S]*\}/)
  if (!match) throw new Error('distillEvidence: no JSON in response')

  const parsed = JSON.parse(match[0])
  return {
    keyClaims:      Array.isArray(parsed.keyClaims)
      ? parsed.keyClaims.filter((s: unknown) => typeof s === 'string').slice(0, 6)
      : [],
    supportedBy:    Array.isArray(parsed.supportedBy)
      ? parsed.supportedBy.filter((s: unknown) => typeof s === 'string').slice(0, 8)
      : [],
    contradictions: Array.isArray(parsed.contradictions)
      ? parsed.contradictions.filter((s: unknown) => typeof s === 'string').slice(0, 4)
      : [],
    coverageNote:   typeof parsed.coverageNote === 'string' ? parsed.coverageNote : '',
  }
}

// ─── Formatter ────────────────────────────────────────────────────────────────
// Renders a DistilledEvidence object into a compact prompt block consumed by
// buildSynthesizerPrompt when distillation succeeded.

export function formatDistilledEvidence(
  evidence: DistilledEvidence,
  iterationCount: number,
): string {
  const claimsBlock = evidence.keyClaims.length > 0
    ? `Key claims:\n${evidence.keyClaims.map((c, i) => `${i + 1}. ${c}`).join('\n')}`
    : 'Key claims: none extracted'

  const sourcesBlock = evidence.supportedBy.length > 0
    ? `Supporting sources: ${evidence.supportedBy.join(', ')}`
    : ''

  const contradictionsBlock = evidence.contradictions.length > 0
    ? `Conflicts/uncertainty:\n${evidence.contradictions.map(c => `- ${c}`).join('\n')}`
    : ''

  const parts = [claimsBlock, sourcesBlock, contradictionsBlock, `Coverage: ${evidence.coverageNote}`]
    .filter(Boolean)
    .join('\n\n')

  return `[DISTILLED EVIDENCE — ${iterationCount} research pass${iterationCount > 1 ? 'es' : ''}]\n${parts}`
}
