// ─── Structured Output Transformer ───────────────────────────────────────────
// Maps the raw EliteResearchOutput (flat schema optimised for streaming) into
// a structured object with named sections matching the target UI layout.
//
// Universal sections (all modes):
//   1. Executive Answer   — brief + confidence + mode
//   7. Sources            — sourceRegistry
//
// Mode-specific primary sections:
//   decision     → DecisionBreakdown  (AXIOM)
//   perspectives → PerspectivesSection (ECHO)
//   competitive  → ChallengeSection    (CRITIC)
//   action       → ExecutionSection    (FORGE)
//   intelligence → AnalysisSection     (CIPHER)
//   research     → EvidenceAndInsights (SCOUT)
//   explainer    → UnderstandingSection (SAGE)
//
// Secondary / universal sections rendered per-mode:
//   risks, whatThisMisses, actionPlan (see StructuredOutputView for which modes show which)

import type {
  EliteResearchOutput,
  QueryMode,
  DecisionCriterion,
  DecisionOption,
  ResearchFinding,
  SourceRegistryItem,
} from '@/ai/schemas'

// ─── Section types ────────────────────────────────────────────────────────────

export interface ExecutiveAnswer {
  brief: string
  confidence: number
  queryMode: QueryMode
}

export interface DecisionBreakdown {
  criteria: DecisionCriterion[]
  options: DecisionOption[]
  winner: string
  winnerRationale: string
  tradeoff: string
  contraryPick: string
}

export interface EvidenceAndInsights {
  overview: string
  keyFindings: ResearchFinding[]
  expertConsensus: string
}

export interface WhatThisMisses {
  adversarialReview: string
  misconceptions: string[]
}

export interface ActionPlan {
  steps: string[]
  goDeeper: string[]
  implications: string
}

// ─── Agent-specific section types ─────────────────────────────────────────────

export interface PerspectivesSection {
  sides: { label: string; points: string[] }[]
  commonGround: string
}

export interface ChallengeSection {
  verdict: string
  risks: string[]
  blindSpots: string[]
  misconceptions: string[]
  adversarialReview: string
}

export interface ExecutionSection {
  steps: { step: string; detail: string }[]
  resourcesNeeded: string
  potentialBlockers: string[]
  firstActions: string[]
  adversarialReview: string
}

export interface AnalysisSection {
  overview: string
  keyFindings: ResearchFinding[]
  patterns: string[]
}

export interface UnderstandingSection {
  overview: string
  analogy: string
  keyTakeaway: string
  mechanisms: ResearchFinding[]
  misconceptions: string[]
}

// ─── Root structured output ───────────────────────────────────────────────────

export interface StructuredOutput {
  executiveAnswer:     ExecutiveAnswer
  // Universal secondary
  risks:               string[]
  whatThisMisses:      WhatThisMisses
  actionPlan:          ActionPlan
  sources:             SourceRegistryItem[]
  // Mode-specific primary (only one will be non-null per response)
  decisionBreakdown:   DecisionBreakdown | null
  evidenceAndInsights: EvidenceAndInsights
  perspectives:        PerspectivesSection | null
  challenge:           ChallengeSection | null
  execution:           ExecutionSection | null
  analysis:            AnalysisSection | null
  understanding:       UnderstandingSection | null
}

// ─── Transformer ──────────────────────────────────────────────────────────────
// Safe to call on partial streaming output — every field defaults gracefully.

export function toStructuredOutput(raw: Partial<EliteResearchOutput>): StructuredOutput {
  const mode = (raw.queryMode ?? 'research') as QueryMode
  const isDecisionMode = mode === 'decision'

  const hasDecisionData =
    ((raw.decisionCriteria as unknown[])?.length ?? 0) > 0 ||
    ((raw.decisionOptions  as unknown[])?.length ?? 0) > 0

  return {
    // ── 1. Executive Answer ─────────────────────────────────────────────────
    executiveAnswer: {
      brief:      raw.executiveBrief ?? '',
      confidence: raw.confidence     ?? 0,
      queryMode:  mode,
    },

    // ── 2. Risks ────────────────────────────────────────────────────────────
    risks: raw.risks?.filter(Boolean)
      ?? (isDecisionMode ? raw.killConditions?.filter(Boolean) : undefined)
      ?? [],

    // ── 3. What This Misses ─────────────────────────────────────────────────
    whatThisMisses: {
      adversarialReview: raw.adversarialReview ?? '',
      misconceptions:    raw.misconceptions?.filter((m): m is string => !!m) ?? [],
    },

    // ── 4. Action Plan ──────────────────────────────────────────────────────
    actionPlan: {
      steps:       raw.actionableNextSteps?.filter((s): s is string => !!s) ?? [],
      goDeeper:    raw.goDeeper?.filter((g): g is string => !!g)             ?? [],
      implications: raw.implications ?? '',
    },

    // ── 5. Sources ──────────────────────────────────────────────────────────
    sources: raw.sourceRegistry?.filter((s): s is SourceRegistryItem => !!s?.url) ?? [],

    // ── Decision (AXIOM) ────────────────────────────────────────────────────
    decisionBreakdown: isDecisionMode && hasDecisionData ? {
      criteria:        raw.decisionCriteria?.filter((c): c is DecisionCriterion => !!c?.name) ?? [],
      options:         raw.decisionOptions?.filter((o): o is DecisionOption => !!o?.name)     ?? [],
      winner:          raw.winner          ?? '',
      winnerRationale: raw.winnerRationale ?? '',
      tradeoff:        raw.tradeoff        ?? '',
      contraryPick:    raw.contraryPick    ?? '',
    } : null,

    // ── Research (SCOUT) ────────────────────────────────────────────────────
    evidenceAndInsights: {
      overview:        raw.overview        ?? '',
      keyFindings:     raw.keyFindings?.filter((f): f is ResearchFinding => !!f?.finding) ?? [],
      expertConsensus: raw.expertConsensus ?? '',
    },

    // ── Perspectives (ECHO) ─────────────────────────────────────────────────
    perspectives: mode === 'perspectives' ? {
      sides: raw.perspectiveSides
        ?.filter(s => !!s?.label)
        .map(s => ({ label: s.label, points: s.points?.filter(Boolean) ?? [] }))
        ?? [],
      commonGround: raw.commonGround ?? '',
    } : null,

    // ── Challenge (CRITIC) ──────────────────────────────────────────────────
    challenge: mode === 'competitive' ? {
      verdict:          raw.verdict          ?? '',
      risks:            raw.risks?.filter(Boolean) ?? [],
      blindSpots:       raw.blindSpots?.filter(Boolean) ?? [],
      misconceptions:   raw.misconceptions?.filter((m): m is string => !!m) ?? [],
      adversarialReview: raw.adversarialReview ?? '',
    } : null,

    // ── Execution (FORGE) ───────────────────────────────────────────────────
    execution: mode === 'action' ? {
      steps: raw.executionSteps
        ?.filter(s => !!s?.step)
        .map(s => ({ step: s.step, detail: s.detail }))
        ?? [],
      resourcesNeeded:  raw.resourcesNeeded  ?? '',
      potentialBlockers: raw.potentialBlockers?.filter(Boolean) ?? [],
      firstActions:     raw.actionableNextSteps?.filter(Boolean) ?? [],
      adversarialReview: raw.adversarialReview ?? '',
    } : null,

    // ── Analysis (CIPHER) ───────────────────────────────────────────────────
    analysis: mode === 'intelligence' ? {
      overview:    raw.overview ?? '',
      keyFindings: raw.keyFindings?.filter((f): f is ResearchFinding => !!f?.finding) ?? [],
      patterns:    raw.patterns?.filter(Boolean) ?? [],
    } : null,

    // ── Understanding (SAGE) ────────────────────────────────────────────────
    understanding: mode === 'explainer' ? {
      overview:       raw.overview    ?? '',
      analogy:        raw.analogy     ?? '',
      keyTakeaway:    raw.keyTakeaway ?? '',
      mechanisms:     raw.keyFindings?.filter((f): f is ResearchFinding => !!f?.finding) ?? [],
      misconceptions: raw.misconceptions?.filter((m): m is string => !!m) ?? [],
    } : null,
  }
}
