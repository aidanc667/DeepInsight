import type { TrustScore, EliteResearchOutput } from '@/ai/schemas'

export function computeTrustScore(result: Partial<EliteResearchOutput> | undefined): TrustScore {
  const sourcesCount    = result?.sourceRegistry?.filter(s => s?.url)?.length ?? 0
  const highCredSources = result?.sourceRegistry?.filter(s => s?.credibilityTier === 'high')?.length ?? 0
  const medCredSources  = result?.sourceRegistry?.filter(s => s?.credibilityTier === 'medium')?.length ?? 0

  // Clamp modelConfidence to [0, 100] — AI output may occasionally exceed range
  const modelConfidence = Math.min(100, Math.max(0, result?.confidence ?? 70))

  const rawQuality    = (highCredSources * 1.0) + (medCredSources * 0.6) +
                        ((sourcesCount - highCredSources - medCredSources) * 0.3)
  const citationScore = sourcesCount > 0 ? Math.min(rawQuality / sourcesCount, 1) : 0.5
  // 5 sources = full coverage score — don't penalise concise, high-quality reports
  const coverageScore = Math.min(sourcesCount / 5, 1)
  const credRatio     = sourcesCount > 0 ? highCredSources / sourcesCount : 0.5
  const recencyScore  = 0.6 + credRatio * 0.35

  const raw = (0.45 * modelConfidence) +
              (0.28 * citationScore * 100) +
              (0.15 * coverageScore * 100) +
              (0.12 * recencyScore  * 100)

  const rawScore = Math.round(Math.min(100, Math.max(0, raw)))
  // When the model is confident (≥70) and sources exist, floor at 70
  const finalScore = modelConfidence >= 70 && sourcesCount >= 1
    ? Math.max(rawScore, 70)
    : rawScore

  const alertLevel = finalScore >= 72 ? 'green' : finalScore >= 50 ? 'orange' : 'red'

  return {
    modelConfidence: Math.round(modelConfidence),
    citationScore,
    recencyScore,
    coverageScore: Math.round(coverageScore * 100),
    finalScore,
    alertLevel,
  }
}
