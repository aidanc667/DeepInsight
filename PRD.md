# Product Requirements Document: The Elite Research Agent

**Version**: 2.0
**Date**: 2026-04-03
**Stack**: Next.js 16 (App Router) · TypeScript · Vercel AI SDK v6 · AI Gateway (OIDC)
**Status**: Draft

---

## 1. Product Overview

### 1.1 Vision

The Elite Research Agent is a multi-model AI intelligence platform that aggregates, cross-validates, and synthesizes responses from three distinct AI systems — **Gemini 3.1 Pro**, **Claude 4.6 Opus**, and **Perplexity Sonar Reasoning** — into a single, structured research report. It eliminates AI noise by exposing contradictions, consensus, and hallucination risk as first-class UI elements.

### 1.2 Problem Statement

A single AI model gives a confident answer with no visibility into blind spots or source bias. Querying three models manually leaves the user to reconcile conflicting outputs themselves. The Elite Research Agent acts as a "meta-layer" above all three models — doing the reconciliation automatically and surfacing conflicts, consensus, and a quantified Trust Score.

### 1.3 Target Users

- Research analysts and knowledge workers
- Executives needing rapid, vetted intelligence
- Developers and technical leads doing technology due diligence
- Legal, medical, and policy professionals requiring source-cited answers

---

## 2. Architecture Overview

### 2.1 System Flow

```
Browser (Next.js UI)
        │
        ▼
┌─────────────────────────────┐
│  POST /api/clarify          │  Route Handler
│  Gatekeeper (Zod schema)    │  Checks prompt for Context/Goal/Audience
│  AI SDK generateText        │  Returns confidence score + questions
└──────────────┬──────────────┘
               │ confidence > 0.85 OR force_proceed=true
               ▼
┌─────────────────────────────┐
│  POST /api/research         │  Route Handler (streaming)
│  Promise.all([...])         │  Fires 3 model calls in parallel
└──────────────┬──────────────┘
       ┌───────┼───────┐
       ▼       ▼       ▼
  Perplexity  Claude  Gemini
  Sonar       4.6     3.1 Pro
  Reasoning   Opus    (synthesis)
  (citations)  (conflict/blindspot)
       └───────┼───────┘
               ▼
┌─────────────────────────────┐
│  Master Synthesizer         │  AI SDK streamText + Output.object()
│  5-Box Extractor            │  Produces ResearchOutput schema
│  TrustEngine                │  Calculates T score
└──────────────┬──────────────┘
               ▼
     useChat / useObject (streaming)
     5-Box UI · Trust Score Badge · Blindspot color alert
```

### 2.2 Deployment

Single Next.js app deployed to Vercel — no separate backend service needed.

```
elite-research-agent/
├── app/
│   ├── page.tsx              # Main UI
│   └── api/
│       ├── clarify/route.ts  # Gatekeeper endpoint
│       └── research/route.ts # Research + synthesis endpoint (streaming)
├── components/research/      # 5-box UI components
├── lib/
│   ├── schemas.ts            # Zod schemas
│   ├── trust-engine.ts       # TrustEngine class
│   ├── models.ts             # AI model call wrappers
│   └── synthesizer.ts        # Master synthesizer prompt + orchestration
└── next.config.ts
```

All three AI providers route through the **Vercel AI Gateway** using OIDC auth — no raw API keys.

---

## 3. Technical Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Server Components) |
| Language | TypeScript 5.x |
| UI Components | shadcn/ui + Tailwind CSS v4 |
| Icons | Lucide React |
| Animations | Motion (Framer Motion v12) |
| AI Orchestration | Vercel AI SDK v6 (`generateText`, `streamText`, `Output.object()`) |
| AI Providers | Vercel AI Gateway — Perplexity, Claude, Gemini via OIDC |
| Schema Validation | Zod |
| Markdown Rendering | AI Elements (`<MessageResponse>`) |
| Deployment | Vercel (single Next.js app) |

---

## 4. Zod Schemas (`lib/schemas.ts`)

```typescript
import { z } from 'zod'

export const CitationSchema = z.object({
  url: z.string().url(),
  domain: z.string(),
  domainType: z.enum(['gov', 'edu', 'news', 'other', 'social']),
  publishedAt: z.string().datetime().nullable(), // ISO 8601
})

export const RequirementSchema = z.object({
  context: z.string().nullable(),   // What domain/situation?
  goal: z.string().nullable(),      // What outcome does the user want?
  audience: z.string().nullable(),  // Who is this research for?
  confidenceScore: z.number().min(0).max(1), // >0.85 = silent execution
  missingFields: z.array(z.enum(['context', 'goal', 'audience'])),
})

export const ClarificationQuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).min(2).max(4),
  fieldTargeted: z.enum(['context', 'goal', 'audience']),
})

export const GatekeeperResultSchema = z.object({
  proceed: z.boolean(),
  questions: z.array(ClarificationQuestionSchema), // empty if proceed=true
})

export const ModelResponseSchema = z.object({
  modelId: z.enum(['perplexity', 'claude', 'gemini']),
  rawText: z.string(),
  citations: z.array(CitationSchema),
  latencyMs: z.number(),
})

export const ConflictItemSchema = z.object({
  topic: z.string(),
  modelA: z.string(),   // e.g. "Claude suggests X"
  modelB: z.string(),   // e.g. "Perplexity's sources indicate Y"
  severity: z.enum(['low', 'medium', 'high']),
})

export const TrustScoreSchema = z.object({
  agreementScore: z.number(),       // A: 0–100
  citationScore: z.number(),        // C: 0–1.0
  recencyScore: z.number(),         // R: 0–1.0
  hallucinationPenalty: z.number(), // Ph: 0 | 10 | 20...
  finalScore: z.number(),           // T = (0.4·A) + (0.3·C·100) + (0.2·R·100) - Ph
  alertLevel: z.enum(['green', 'orange', 'red']),
})

export const ResearchOutputSchema = z.object({
  executiveSynthesis: z.string(),
  unifiedVerdict: z.array(z.string()),      // consensus bullet points
  conflictZone: z.array(ConflictItemSchema),
  blindspot: z.string(),                    // Red Team analysis
  gamePlan: z.array(z.string()),            // 3–5 personalized next steps
  trustScore: TrustScoreSchema,
})

// Inferred types
export type Citation = z.infer<typeof CitationSchema>
export type RequirementSchema = z.infer<typeof RequirementSchema>
export type GatekeeperResult = z.infer<typeof GatekeeperResultSchema>
export type ModelResponse = z.infer<typeof ModelResponseSchema>
export type ConflictItem = z.infer<typeof ConflictItemSchema>
export type TrustScore = z.infer<typeof TrustScoreSchema>
export type ResearchOutput = z.infer<typeof ResearchOutputSchema>
```

---

## 5. Backend: Route Handlers

### 5.1 `POST /api/clarify` — Gatekeeper

Analyzes the user's prompt and returns either a proceed signal or 2–3 clarification questions.

**Request:**
```typescript
{ prompt: string }
```

**Response:** `GatekeeperResult`

**Logic:**
1. Call AI Gateway (`'anthropic/claude-sonnet-4.6'`) with the Gatekeeper system prompt.
2. Use `generateText` + `Output.object(GatekeeperResultSchema)` to get structured output.
3. If `confidenceScore > 0.85` → return `{ proceed: true, questions: [] }`.
4. Otherwise → return `{ proceed: false, questions: [...] }` (max 3 questions, one per missing field).

**Gatekeeper system prompt (`lib/prompts/gatekeeper.ts`):**
```
Extract three fields from the user's prompt: context (domain/situation),
goal (desired outcome), and audience (who this is for).

Score confidence from 0.0–1.0 based on completeness. A prompt that clearly
states all three fields scores ≥0.85. A vague one-line prompt scores <0.5.

For each missing or ambiguous field, generate exactly ONE multiple-choice
question (2–4 options) targeting that field. Maximum 3 questions total.
Prioritize: goal > context > audience.
```

### 5.2 `POST /api/research` — Research Engine (Streaming)

Fires three parallel model calls, synthesizes results, calculates trust score, and streams the `ResearchOutput` to the client.

**Request:**
```typescript
{
  prompt: string
  clarificationAnswers?: { context?: string; goal?: string; audience?: string }
  forceProceed?: boolean
}
```

**Response:** Streaming `ResearchOutput` via AI SDK `toUIMessageStreamResponse()`

**Implementation outline:**

```typescript
// app/api/research/route.ts

export async function POST(req: Request) {
  const body = await req.json()

  // 1. Fire all three model calls in parallel
  const [perplexityRes, claudeRes, geminiRes] = await Promise.allSettled([
    callPerplexity(body.prompt),
    callClaude(body.prompt),
    callGemini(body.prompt),
  ])

  const modelResponses = [perplexityRes, claudeRes, geminiRes]
    .filter(r => r.status === 'fulfilled')
    .map(r => (r as PromiseFulfilledResult<ModelResponse>).value)

  // 2. Run Master Synthesizer to extract 5-box content
  const synthesis = await runSynthesizer(body.prompt, modelResponses)

  // 3. Calculate Trust Score
  const trustScore = new TrustEngine().calculate(modelResponses, synthesis.conflictZone)

  // 4. Stream the combined output
  const result = streamText({
    model: gateway('google/gemini-3.1-pro'),
    system: SYNTHESIZER_PROMPT,
    prompt: buildSynthesizerPrompt(body.prompt, modelResponses),
    experimental_output: Output.object({ schema: ResearchOutputSchema }),
  })

  return result.toUIMessageStreamResponse()
}
```

### 5.3 Model Call Wrappers (`lib/models.ts`)

Each wrapper calls its model via AI Gateway and returns a typed `ModelResponse`.

```typescript
// All models route through AI Gateway — OIDC auth, no raw API keys
// Model strings: 'perplexity/sonar-reasoning', 'anthropic/claude-opus-4.6', 'google/gemini-3.1-pro'

export async function callPerplexity(prompt: string): Promise<ModelResponse>
export async function callClaude(prompt: string): Promise<ModelResponse>
export async function callGemini(prompt: string): Promise<ModelResponse>
```

**Model assignments and roles:**

| Model | Gateway String | Role |
|---|---|---|
| Perplexity Sonar Reasoning | `'perplexity/sonar-reasoning'` | Real-time web citations, recency data. Primary source for Trust Engine `R` and `C` scores. |
| Claude 4.6 Opus | `'anthropic/claude-opus-4.6'` | Conflict Zone analysis + Blindspot / Red Team critique. |
| Gemini 3.1 Pro | `'google/gemini-3.1-pro'` | Long-context Executive Synthesis — given all three raw responses. |

### 5.4 Master Synthesizer Prompt (`lib/prompts/synthesizer.ts`)

```
You are the Master Synthesizer for an elite research platform.
You receive three raw AI responses labeled [PERPLEXITY], [CLAUDE], and [GEMINI].

Extract exactly five non-redundant sections:

1. EXECUTIVE_SYNTHESIS: A 2-paragraph narrative blending all inputs.
   CRITICAL RULE: Do NOT repeat consensus facts here. Consensus belongs in
   UNIFIED_VERDICT only. Focus on narrative, implications, and nuance.

2. UNIFIED_VERDICT: Bullet points of facts where ALL three models agree
   (100% consensus only — be conservative).

3. CONFLICT_ZONE: For each point of contention, state:
   "[Model A] suggests [X], but [Model B] indicates [Y]."
   Assign severity: low | medium | high.

4. BLINDSPOT: Red Team analysis identifying:
   - Potential hallucinations (confident claims unsupported by citations)
   - Source biases (e.g. over-reliance on one domain type)
   - Logical flaws or circular reasoning
   - Notable omissions — what no model addressed

5. GAME_PLAN: 3–5 personalized next steps based on the user's clarified
   goal and audience. Be specific and actionable. No generic advice.

Output valid JSON matching the ResearchOutput schema. No text outside the JSON.
```

---

## 6. TrustEngine (`lib/trust-engine.ts`)

```typescript
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
  if (days <= 1)   return 1.0
  if (days <= 7)   return 0.9
  if (days <= 30)  return 0.8
  if (days <= 365) return 0.6
  return 0.4
}

export class TrustEngine {
  calculate(
    responses: ModelResponse[],
    conflicts: ConflictItem[],
  ): TrustScore {
    // A — Agreement
    const A = responses.length === 3 ? 100 : responses.length === 2 ? 60 : 20

    // Flatten all citations
    const citations = responses.flatMap(r => r.citations)

    // C — Citation quality (weighted average domain score)
    const C = citations.length
      ? citations.reduce((sum, c) => sum + (DOMAIN_WEIGHTS[c.domainType] ?? 0.5), 0) / citations.length
      : 0.5

    // R — Recency (average across all citations)
    const R = citations.length
      ? citations.reduce((sum, c) => sum + recencyScore(c.publishedAt), 0) / citations.length
      : 0.5

    // Ph — Penalty: 10 pts per high-severity conflict
    const Ph = conflicts.filter(c => c.severity === 'high').length * 10

    // T — Final score, clamped 0–100
    const T = Math.min(100, Math.max(0, 0.4 * A + 0.3 * C * 100 + 0.2 * R * 100 - Ph))

    const alertLevel = T >= 65 ? 'green' : T >= 40 ? 'orange' : 'red'

    return { agreementScore: A, citationScore: C, recencyScore: R, hallucinationPenalty: Ph, finalScore: T, alertLevel }
  }
}
```

**Trust Score Formula:**
```
T = (0.4 × A) + (0.3 × C) + (0.2 × R) − Ph

A  = Agreement:    3/3 models = 100 pts | 2/3 = 60 pts
C  = Citation:     Weighted avg domain score (0–1.0) × 100
R  = Recency:      Weighted avg source age (0–1.0) × 100
Ph = Penalty:      −10 per high-severity logical contradiction
```

---

## 7. Frontend Specification

### 7.1 Theme & Design System

- **Mode**: Dark (default). Background `zinc-950`, cards `zinc-900`, border `zinc-800`.
- **Accent**: `indigo-500` (single accent color, no rainbow).
- **Typography**: Geist Sans (UI text), Geist Mono (scores, IDs, citations, code).
- **Components**: shadcn/ui primitives + Tailwind v4.
- **Icons**: Lucide React.
- **Animations**: Motion (Framer Motion v12) — box entrance animations, skeleton shimmer, score dial.

### 7.2 Page Layout (`app/page.tsx`)

```
┌─────────────────────────────────────────────────┐
│  Header: "Elite Research Agent"  [Trust Badge]  │
├─────────────────────────────────────────────────┤
│                                                  │
│  Prompt Textarea                                 │
│  [Analyze Prompt]  [Research Now →]              │
│                                                  │
│  ── Clarification Cards (if needed) ──           │
│  Q1: [○ Opt A] [○ Opt B] [○ Opt C]              │
│  Q2: [○ Opt A] [○ Opt B]                         │
│  [Run Research →]                                │
│                                                  │
│  ── Model Status (while loading) ──              │
│  ● Querying Perplexity...                        │
│  ● Querying Claude...                            │
│  ● Querying Gemini...                            │
├─────────────────────────────────────────────────┤
│  BOX 1: Executive Synthesis         (full width) │
├────────────────────┬────────────────────────────┤
│  BOX 2: Unified    │  BOX 3: Conflict Zone       │
│  Verdict           │                             │
├────────────────────┼────────────────────────────┤
│  BOX 4: Blindspot  │  BOX 5: Game Plan           │
│  [color-coded]     │                             │
└────────────────────┴────────────────────────────┘
```

### 7.3 Component Inventory

| Component | File | Description |
|---|---|---|
| `PromptForm` | `components/research/PromptForm.tsx` | Textarea + Analyze + Research Now buttons |
| `ClarificationCard` | `components/research/ClarificationCard.tsx` | Single question with chip-style radio options |
| `ModelStatusDots` | `components/research/ModelStatusDots.tsx` | Per-model loading indicators |
| `ResearchResults` | `components/research/ResearchResults.tsx` | 5-box CSS Grid container |
| `ExecutiveSynthesis` | `components/research/ExecutiveSynthesis.tsx` | Box 1 — full width, AI Elements `<MessageResponse>` |
| `UnifiedVerdict` | `components/research/UnifiedVerdict.tsx` | Box 2 — bullet list |
| `ConflictZone` | `components/research/ConflictZone.tsx` | Box 3 — conflict items with severity badge |
| `Blindspot` | `components/research/Blindspot.tsx` | Box 4 — color changes with trust score |
| `GamePlan` | `components/research/GamePlan.tsx` | Box 5 — numbered action steps |
| `TrustScoreBadge` | `components/research/TrustScoreBadge.tsx` | Circular dial, Geist Mono score, tooltip breakdown |

### 7.4 Gatekeeper UX Flow

```
User types prompt
       │
       ▼
[Analyze Prompt] ──► POST /api/clarify
       │
       ├── confidence > 0.85 ──► skip questions, auto-start research
       │
       └── confidence ≤ 0.85 ──► show ClarificationCards (2–3 questions)
                                         │
                           User answers  ├── [Run Research →]
                                         │
                           User skips    └── [Research Now] (always visible)
                                              (forceProceed = true)
```

### 7.5 Box 4 — Blindspot Color Logic

```typescript
// lib/trust-colors.ts
export function blindspotStyles(alertLevel: 'green' | 'orange' | 'red') {
  return {
    green:  'border-zinc-700',
    orange: 'border-orange-500 bg-orange-950/30',
    red:    'border-red-500 bg-red-950/30',
  }[alertLevel]
}
```

### 7.6 AI Markdown Rendering

All AI-generated text (Executive Synthesis, Blindspot) must be rendered with **AI Elements `<MessageResponse>`** — never raw `{text}` or `<p>` tags. This handles streaming markdown, code blocks, math, and mermaid diagrams.

```bash
npx ai-elements@latest
```

```tsx
import { MessageResponse } from '@/components/ai-elements/message'

<MessageResponse content={executiveSynthesis} />
```

### 7.7 Progressive Streaming

The 5 boxes render progressively as the SSE stream delivers each section:
- Skeleton loader shown per box while section is pending
- Boxes animate in with Motion `fadeInUp` as data arrives
- Trust Score badge updates live as the score is computed
- Model status dots (`● Querying...`) shown while `Promise.all` is in-flight

---

## 8. Environment Variables

**Auth strategy:** All three AI providers (Perplexity, Claude, Gemini) route through the **Vercel AI Gateway with OIDC**. No raw API keys are stored or committed.

**Setup:**
```bash
vercel link                  # Connect to Vercel project
# Enable AI Gateway in Vercel Dashboard
vercel env pull              # Provisions VERCEL_OIDC_TOKEN to .env.local
```

| Variable | Source | Description |
|---|---|---|
| `VERCEL_OIDC_TOKEN` | `vercel env pull` (auto-provisioned) | Short-lived JWT for AI Gateway. Never set manually. Auto-refreshed on Vercel. Re-run pull locally if expired (~24h). |

Add `.env.local` to `.gitignore` — it contains the provisioned OIDC token.

---

## 9. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Parallel model latency | < 8s total (`Promise.all` — slowest model sets the ceiling) |
| Single model timeout | 15s max; continue with remaining 2 on failure |
| Trust score calculation | < 10ms (pure computation) |
| First box visible | < 3s (streaming — Executive Synthesis renders progressively) |
| Gatekeeper response | < 2s |
| Partial model failure | Surface gracefully — note failure in Blindspot; Agreement drops to 60 pts |

---

## 10. Error Handling

| Scenario | Behavior |
|---|---|
| 1 model API fails | Continue with 2 remaining; surface note in Blindspot box; Trust Score adjusts (A = 60) |
| 2 models fail | Surface error state; prompt to retry |
| Synthesizer output fails schema validation | Retry once; show structured error in UI |
| Gatekeeper timeout | Fall through to `forceProceed = true` silently |
| Stream disconnected | Client retries once with exponential backoff |

---

## 11. Security

- No raw API keys in code or `.env` files — OIDC only.
- Prompt inputs sanitized before forwarding to model APIs.
- Route handlers rate-limited via Vercel Firewall (10 req/min per IP).
- CORS restricted to deployment domain via Next.js config.

---

## 12. Implementation Order

1. **Scaffold Next.js project** — `npx create-next-app@latest`, shadcn init, `npx ai-elements@latest`
2. **Define Zod schemas** — `lib/schemas.ts` — all types before any logic
3. **Implement TrustEngine** — `lib/trust-engine.ts` — standalone, unit-testable
4. **Implement model wrappers** — `lib/models.ts` — verify AI Gateway OIDC works for all 3
5. **Implement Gatekeeper** — `app/api/clarify/route.ts` + system prompt
6. **Implement research endpoint** — `app/api/research/route.ts` — `Promise.all` + synthesizer
7. **Build 5-box layout** — static/mocked `ResearchOutput` data first
8. **Wire streaming** — connect frontend `useObject`/`useChat` to live stream
9. **Implement progressive loading** — skeletons, model status dots, Motion animations
10. **Trust Score Badge** — circular dial, live updates, tooltip breakdown
11. **Deploy to Vercel** — `vercel deploy`, smoke test all 3 model calls

---

## 13. Out of Scope (v1.0)

- User authentication / saved sessions
- Research history / export to PDF
- Multi-turn follow-up research (single-shot only)
- Custom model weighting via UI
- Quality feedback / rating mechanism
