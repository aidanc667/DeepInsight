// ─── Trust Engine ─────────────────────────────────────────────────────────────
// Calculates a composite Trust Score (T) from model agreement, citation quality,
// and source recency. Used in ai/graphs/research-pipeline.ts after synthesis.
//
// Formula: T = (0.4 × A) + (0.3 × C × 100) + (0.2 × R × 100) − Ph
//   A  = Agreement score   (1 model=20 | 2 models=60 | 3 models=100)
//   C  = Citation quality  (weighted avg domain score, 0–1)
//   R  = Recency score     (weighted avg citation age, 0–1)
//   Ph = Penalty           (−10 per high-severity conflict)
//
// Alert levels: green ≥65 | orange ≥40 | red <40

import type { Citation, ConflictItem, ModelResponse, TrustScore } from '@/ai/schemas'

const DOMAIN_WEIGHTS: Record<string, number> = {
  gov: 1.0,
  edu: 1.0,
  news: 0.7,
  other: 0.5,
  social: 0.3,
}

function recencyScore(publishedAt: string | null): number {
  if (!publishedAt) return 0.5
  const ageMs = Date.now() - new Date(publishedAt).getTime()
  const days = ageMs / 86_400_000
  if (days <= 1) return 1.0
  if (days <= 7) return 0.9
  if (days <= 30) return 0.8
  if (days <= 365) return 0.6
  return 0.4
}

function citationWeight(c: Citation): number {
  return DOMAIN_WEIGHTS[c.domainType] ?? 0.5
}

export class TrustEngine {
  calculate(responses: ModelResponse[], conflicts: ConflictItem[]): TrustScore {
    // A — Agreement score
    const n = responses.length
    const A = n === 3 ? 100 : n === 2 ? 60 : 20

    // Flatten all citations
    const citations = responses.flatMap(r => r.citations)

    // C — Citation quality (weighted average domain score, 0–1)
    const C =
      citations.length > 0
        ? citations.reduce((sum, c) => sum + citationWeight(c), 0) / citations.length
        : 0.5

    // R — Recency (average across all citations, 0–1)
    const R =
      citations.length > 0
        ? citations.reduce((sum, c) => sum + recencyScore(c.publishedAt), 0) / citations.length
        : 0.5

    // Ph — Penalty: 10 pts per high-severity conflict
    const Ph = conflicts.filter(c => c.severity === 'high').length * 10

    // T = (0.4 × A) + (0.3 × C × 100) + (0.2 × R × 100) − Ph, clamped 0–100
    const T = Math.min(100, Math.max(0, 0.4 * A + 0.3 * C * 100 + 0.2 * R * 100 - Ph))

    const alertLevel: TrustScore['alertLevel'] = T >= 65 ? 'green' : T >= 40 ? 'orange' : 'red'

    return {
      agreementScore: A,
      citationScore: C,
      recencyScore: R,
      hallucinationPenalty: Ph,
      finalScore: Math.round(T),
      alertLevel,
    }
  }
}
