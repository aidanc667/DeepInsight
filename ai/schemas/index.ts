// ─── AI Schemas ────────────────────────────────────────────────────────────────
// Single source of truth for all Zod schemas and inferred TypeScript types.
// Import from here, not from lib/schemas.ts (which re-exports this).

import { z } from 'zod'

// ─── Shared ───────────────────────────────────────────────────────────────────

export const CitationSchema = z.object({
  url: z.string(),
  domain: z.string(),
  domainType: z.enum(['gov', 'edu', 'news', 'other', 'social']),
  publishedAt: z.string().nullable(),
})

export const ClarificationQuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()),
  fieldTargeted: z.string(), // descriptive key e.g. "budget", "use_case", "timeline"
})

export const GatekeeperResultSchema = z.object({
  proceed: z.boolean(),
  confidenceScore: z.number(),
  questions: z.array(ClarificationQuestionSchema),
})

export const TrustScoreSchema = z.object({
  modelConfidence: z.number(),   // synthesizer's self-assessed certainty 0–100
  citationScore: z.number(),     // weighted source quality ratio 0–1
  recencyScore: z.number(),      // recency proxy 0–1
  coverageScore: z.number(),     // normalized source count 0–100
  finalScore: z.number(),
  alertLevel: z.enum(['green', 'orange', 'red']),
})

// ─── Query Classification ─────────────────────────────────────────────────────

export const QUERY_MODES = ['decision', 'research', 'intelligence', 'perspectives', 'competitive', 'explainer', 'action', 'forecast'] as const
export type QueryMode = typeof QUERY_MODES[number]

export const QueryClassifierSchema = z.object({
  mode: z.enum(QUERY_MODES),
  confidence: z.number(),
  reasoning: z.string(),
  modeLabel: z.string(),
})

// ─── Research Plan ────────────────────────────────────────────────────────────

export const ResearchPlanSchema = z.object({
  enrichedPrompt: z.string(),
  searchQueries: z.array(z.string()),
  dataPointsToFind: z.array(z.string()),
  successCriteria: z.string(),
})

// ─── Model Response ───────────────────────────────────────────────────────────

export const ModelResponseSchema = z.object({
  modelId: z.enum(['claude', 'gemini']),
  rawText: z.string(),
  citations: z.array(CitationSchema),
  latencyMs: z.number(),
})

// ─── Elite Research Output ────────────────────────────────────────────────────

export const PerspectiveSideSchema = z.object({
  label: z.string(),
  points: z.array(z.string()),
})

export const ExecutionStepSchema = z.object({
  step: z.string(),
  detail: z.string(),
})

export const DecisionCriterionSchema = z.object({
  name: z.string(),
  weight: z.number(),
  rationale: z.string(),
})

export const CriterionScoreSchema = z.object({
  criterion: z.string(),
  score: z.number(),
})

export const DecisionOptionSchema = z.object({
  name: z.string(),
  compositeScore: z.number(),
  confidence: z.number(),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
  summary: z.string(),
  criterionScores: z.array(CriterionScoreSchema),
})

export const ResearchFindingSchema = z.object({
  finding: z.string(),
  sourceContext: z.string(),
  confidence: z.enum(['high', 'medium', 'low']),
  // Domains from sourceRegistry that directly support this specific claim
  attributedSources: z.array(z.string()).optional(),
})

export const SourceRegistryItemSchema = z.object({
  url: z.string(),
  domain: z.string(),
  credibilityTier: z.enum(['high', 'medium', 'low']),
  keyInsight: z.string(),
  // Optional extracted snippet from the actual page content
  extractedSnippet: z.string().optional(),
})

export const EliteResearchOutputSchema = z.object({
  // Universal — all modes
  queryMode: z.enum(QUERY_MODES),
  executiveBrief: z.string(),
  confidence: z.number(),
  adversarialReview: z.string(),
  actionableNextSteps: z.array(z.string()),
  risks: z.array(z.string()).optional(),   // practical risks/caveats — populated by all modes
  sourceRegistry: z.array(SourceRegistryItemSchema),

  // Decision mode
  decisionCriteria: z.array(DecisionCriterionSchema).optional(),
  decisionOptions: z.array(DecisionOptionSchema).optional(),
  winner: z.string().optional(),
  winnerRationale: z.string().optional(),
  tradeoff: z.string().optional(),
  contraryPick: z.string().optional(),
  killConditions: z.array(z.string()).optional(),

  // Research / all other modes
  overview: z.string().optional(),
  keyFindings: z.array(ResearchFindingSchema).optional(),
  expertConsensus: z.string().optional(),
  misconceptions: z.array(z.string()).optional(),
  implications: z.string().optional(),
  goDeeper: z.array(z.string()).optional(),

  // Perspectives — ECHO
  perspectiveSides: z.array(PerspectiveSideSchema).optional(),
  commonGround: z.string().optional(),

  // Challenge — CRITIC
  blindSpots: z.array(z.string()).optional(),
  verdict: z.string().optional(),

  // Execution — FORGE
  executionSteps: z.array(ExecutionStepSchema).optional(),
  resourcesNeeded: z.string().optional(),
  potentialBlockers: z.array(z.string()).optional(),

  // Understanding — SAGE
  analogy: z.string().optional(),
  keyTakeaway: z.string().optional(),

  // Analysis — CIPHER
  patterns: z.array(z.string()).optional(),

})

// Alias for API compatibility
export const ResearchOutputSchema = EliteResearchOutputSchema

// ─── Per-mode lean schemas (backend only) ────────────────────────────────────
// Used in streamText Output.object() to keep grammar size within API limits.
// Each schema only includes the fields that mode actually outputs.

const BASE_FIELDS = {
  queryMode:            z.enum(QUERY_MODES),
  executiveBrief:       z.string(),
  confidence:           z.number(),
  adversarialReview:    z.string(),
  actionableNextSteps:  z.array(z.string()),
  sourceRegistry:       z.array(SourceRegistryItemSchema),
}

export const DecisionModeSchema = z.object({
  ...BASE_FIELDS,
  decisionCriteria: z.array(DecisionCriterionSchema),
  decisionOptions:  z.array(DecisionOptionSchema),
  winner:           z.string(),
  winnerRationale:  z.string(),
  tradeoff:         z.string(),
  contraryPick:     z.string(),
  killConditions:   z.array(z.string()),
  risks:            z.array(z.string()),
})

export const ResearchModeSchema = z.object({
  ...BASE_FIELDS,
  overview:        z.string(),
  keyFindings:     z.array(ResearchFindingSchema),
  expertConsensus: z.string(),
  misconceptions:  z.array(z.string()),
  implications:    z.string(),
  goDeeper:        z.array(z.string()),
  risks:           z.array(z.string()),
})

export const IntelligenceModeSchema = z.object({
  ...BASE_FIELDS,
  overview:     z.string(),
  keyFindings:  z.array(ResearchFindingSchema),
  patterns:     z.array(z.string()),
  implications: z.string(),
})

export const PerspectivesModeSchema = z.object({
  ...BASE_FIELDS,
  perspectiveSides: z.array(PerspectiveSideSchema),
  commonGround:     z.string(),
})

export const ChallengeModeSchema = z.object({
  ...BASE_FIELDS,
  risks:          z.array(z.string()),
  blindSpots:     z.array(z.string()),
  misconceptions: z.array(z.string()),
  verdict:        z.string(),
})

export const ActionModeSchema = z.object({
  ...BASE_FIELDS,
  executionSteps:    z.array(ExecutionStepSchema),
  resourcesNeeded:   z.string(),
  potentialBlockers: z.array(z.string()),
})

export const ExplainerModeSchema = z.object({
  ...BASE_FIELDS,
  overview:       z.string(),
  keyFindings:    z.array(ResearchFindingSchema),
  analogy:        z.string(),
  keyTakeaway:    z.string(),
  misconceptions: z.array(z.string()),
})

export const ForecastTrendSchema = z.object({
  signal:      z.string(),   // the trend or signal name
  direction:   z.enum(['accelerating', 'emerging', 'peaking', 'declining']),
  timeHorizon: z.string(),   // e.g. "6–12 months", "2–3 years"
  confidence:  z.enum(['high', 'medium', 'low']),
  evidence:    z.string(),   // specific data points supporting this signal
})

export const ForecastModeSchema = z.object({
  ...BASE_FIELDS,
  headline:        z.string(),   // one bold forward-looking statement
  keyTrends:       z.array(ForecastTrendSchema),
  wildCard:        z.string(),   // the unexpected scenario most people aren't pricing in
  consensus:       z.string(),   // what mainstream forecasters expect
  contrarian:      z.string(),   // where the consensus is likely wrong
  implications:    z.string(),   // what this means for decisions right now
  goDeeper:        z.array(z.string()),
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSchemaForMode(mode: string): z.ZodObject<any> {
  switch (mode) {
    case 'decision':     return DecisionModeSchema
    case 'intelligence': return IntelligenceModeSchema
    case 'perspectives': return PerspectivesModeSchema
    case 'competitive':  return ChallengeModeSchema
    case 'action':       return ActionModeSchema
    case 'explainer':    return ExplainerModeSchema
    case 'forecast':     return ForecastModeSchema
    default:             return ResearchModeSchema
  }
}

// Legacy (keep for trust engine compat)
export const ConflictItemSchema = z.object({
  topic: z.string(),
  modelA: z.string(),
  modelB: z.string(),
  severity: z.enum(['low', 'medium', 'high']),
})

// ─── Type Exports ─────────────────────────────────────────────────────────────

export type Citation = z.infer<typeof CitationSchema>
export type ClarificationQuestion = z.infer<typeof ClarificationQuestionSchema>
export type GatekeeperResult = z.infer<typeof GatekeeperResultSchema>
export type TrustScore = z.infer<typeof TrustScoreSchema>
export type QueryClassifier = z.infer<typeof QueryClassifierSchema>
export type ResearchPlan = z.infer<typeof ResearchPlanSchema>
export type ModelResponse = z.infer<typeof ModelResponseSchema>
export type DecisionCriterion = z.infer<typeof DecisionCriterionSchema>
export type DecisionOption = z.infer<typeof DecisionOptionSchema>
export type ResearchFinding = z.infer<typeof ResearchFindingSchema>
export type SourceRegistryItem = z.infer<typeof SourceRegistryItemSchema>
export type EliteResearchOutput = z.infer<typeof EliteResearchOutputSchema>
export type ConflictItem = z.infer<typeof ConflictItemSchema>
export type PerspectiveSide = z.infer<typeof PerspectiveSideSchema>
export type ExecutionStep = z.infer<typeof ExecutionStepSchema>
