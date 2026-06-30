import type { TrustScore, EliteResearchOutput } from '@/ai/schemas'

const CONFIDENCE_WEIGHT  = 0.30
const CITATION_WEIGHT    = 0.30
const COVERAGE_WEIGHT    = 0.25
const RECENCY_WEIGHT     = 0.15

export function computeTrustScore(result: Partial<EliteResearchOutput> | undefined): TrustScore {
  const sourcesCount    = result?.sourceRegistry?.filter(s => s?.url)?.length ?? 0
  const highCredSources = result?.sourceRegistry?.filter(s => s?.credibilityTier === 'high')?.length ?? 0
  const medCredSources  = result?.sourceRegistry?.filter(s => s?.credibilityTier === 'medium')?.length ?? 0

  // Clamp modelConfidence to [0, 100] before use — AI output may exceed range
  const modelConfidence = Math.min(100, Math.max(0, result?.confidence ?? 50))

  const rawQuality    = (highCredSources * 1.0) + (medCredSources * 0.6) +
                        ((sourcesCount - highCredSources - medCredSources) * 0.2)
  const citationScore = sourcesCount > 0 ? Math.min(rawQuality / sourcesCount, 1) : 0.3
  const coverageScore = Math.min(sourcesCount / 10, 1)
  const credRatio     = sourcesCount > 0 ? highCredSources / sourcesCount : 0
  const recencyScore  = 0.45 + credRatio * 0.45

  const T = (CONFIDENCE_WEIGHT * modelConfidence) +
            (CITATION_WEIGHT   * citationScore * 100) +
            (COVERAGE_WEIGHT   * coverageScore * 100) +
            (RECENCY_WEIGHT    * recencyScore  * 100)

  const finalScore = Math.round(Math.min(100, Math.max(0, T)))
  const alertLevel = finalScore >= 72 ? 'green' : finalScore >= 45 ? 'orange' : 'red'

  return {
    modelConfidence: Math.round(modelConfidence),
    citationScore,
    recencyScore,
    coverageScore: Math.round(coverageScore * 100),
    finalScore,
    alertLevel,
  }
}
