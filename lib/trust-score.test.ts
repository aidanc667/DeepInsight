import { describe, it, expect } from 'vitest'
import { computeTrustScore } from './trust-score'

describe('computeTrustScore', () => {
  it('returns alertLevel red when no sources', () => {
    const score = computeTrustScore({ confidence: 50, sourceRegistry: [] })
    expect(score.alertLevel).toBe('red')
    expect(score.finalScore).toBeGreaterThanOrEqual(0)
  })

  it('returns alertLevel green with 10 high-credibility sources', () => {
    const highSources = Array.from({ length: 10 }, (_, i) => ({
      url: `https://example${i}.gov/page`,
      domain: `example${i}.gov`,
      credibilityTier: 'high' as const,
      keyInsight: 'Authoritative source',
    }))
    const score = computeTrustScore({ confidence: 85, sourceRegistry: highSources })
    expect(score.alertLevel).toBe('green')
    expect(score.finalScore).toBeLessThanOrEqual(100)
  })

  it('clamps out-of-range confidence: 150 does not produce finalScore > 100', () => {
    const score = computeTrustScore({ confidence: 150, sourceRegistry: [] })
    expect(score.finalScore).toBeLessThanOrEqual(100)
    expect(score.modelConfidence).toBe(100)
  })

  it('clamps out-of-range confidence: -10 does not produce negative finalScore', () => {
    const score = computeTrustScore({ confidence: -10, sourceRegistry: [] })
    expect(score.finalScore).toBeGreaterThanOrEqual(0)
    expect(score.modelConfidence).toBe(0)
  })
})
