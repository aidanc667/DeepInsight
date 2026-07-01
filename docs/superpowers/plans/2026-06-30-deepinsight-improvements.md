# DeepInsight Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the DeepInsight research pipeline against five identified failure modes — stale dates in prompts, orphaned follow-up submissions, untested trust score math, incomplete SSRF protection, and a 1,268-LOC rendering monolith.

**Architecture:** Five independent, sequenced fixes in order of blast radius. Tasks 1, 2, and 5 are surgical one-function changes. Task 3 introduces a new `lib/trust-score.ts` module with tests. Task 4 splits `StructuredOutputView.tsx` into `components/research/views/` sub-files with a thin orchestrator shell. No changes to the AI pipeline or API routes.

**Tech Stack:** Next.js 15 App Router, TypeScript, Vitest (for unit tests), React, `@ai-sdk/react`

---

## File Map

| File | Change |
|---|---|
| `ai/prompts/synthesizer/preamble.ts` | Convert module constants → function |
| `ai/prompts/synthesizer/forecast.ts` | Remove module-level `CURRENT_YEAR`, call inline |
| `ai/prompts/synthesizer/action.ts` + 6 others | Call `getMethodologyPreamble()` instead of referencing constant |
| `app/page.tsx` | Extract trust score inline → `computeTrustScore()`; fix `.then()` → `await` |
| `lib/trust-score.ts` | **NEW** — pure `computeTrustScore` function + `TrustScore` type |
| `lib/trust-score.test.ts` | **NEW** — four unit tests |
| `ai/nodes/sources.ts` | Harden `isSafeUrl` with CGNAT + decimal IP + localhost checks |
| `components/research/StructuredOutputView.tsx` | Reduce to <100 LOC orchestrator shell |
| `components/research/views/primitives.tsx` | **NEW** — `Label`, `ConfidencePip`, `CredibilityPip`, `Card`, `scoreColor` |
| `components/research/views/ExecutiveAnswer.tsx` | **NEW** — extracted component |
| `components/research/views/DecisionBreakdown.tsx` | **NEW** — extracted component |
| `components/research/views/EvidenceAndInsights.tsx` | **NEW** — extracted component |
| `components/research/views/Risks.tsx` | **NEW** — extracted component |
| `components/research/views/WhatThisMisses.tsx` | **NEW** — extracted component |
| `components/research/views/ActionPlan.tsx` | **NEW** — extracted component |
| `components/research/views/GoDeeperCard.tsx` | **NEW** — extracted component |
| `components/research/views/Sources.tsx` | **NEW** — extracted component |
| `components/research/views/PerspectivesView.tsx` | **NEW** — extracted component |
| `components/research/views/ChallengeView.tsx` | **NEW** — extracted component |
| `components/research/views/ExecutionView.tsx` | **NEW** — extracted component |
| `components/research/views/AnalysisView.tsx` | **NEW** — extracted component |
| `components/research/views/UnderstandingView.tsx` | **NEW** — extracted component |
| `components/research/views/ForecastView.tsx` | **NEW** — extracted component |

---

## Task 1: Fix Stale Date in Preamble

**Why:** `METHODOLOGY_PREAMBLE` is evaluated once at module load. On a warm Vercel instance spanning midnight, every prompt tells the model "Today is yesterday." All 8 synthesizer modes are affected because they all import this constant.

**Files:**
- Modify: `ai/prompts/synthesizer/preamble.ts`
- Modify: `ai/prompts/synthesizer/forecast.ts`
- Modify: `ai/prompts/synthesizer/action.ts`
- Modify: `ai/prompts/synthesizer/challenge.ts`
- Modify: `ai/prompts/synthesizer/decision.ts`
- Modify: `ai/prompts/synthesizer/explainer.ts`
- Modify: `ai/prompts/synthesizer/intelligence.ts`
- Modify: `ai/prompts/synthesizer/perspectives.ts`
- Modify: `ai/prompts/synthesizer/research.ts`

- [ ] **Step 1: Rewrite `preamble.ts` as a function**

Replace the entire contents of `ai/prompts/synthesizer/preamble.ts` with:

```typescript
export function getMethodologyPreamble(): string {
  const CURRENT_DATE = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const CURRENT_YEAR = new Date().getFullYear()

  return `Today's date: ${CURRENT_DATE}. Always use ${CURRENT_YEAR} data — flag anything older than 12 months as potentially outdated.

Before writing JSON, mentally work through these steps:
1. UNDERSTAND: What is the user really asking? What's the underlying goal?
2. CONSTRAINTS: What hard constraints did the user state (budget, timeline, must-haves)? List them. Every recommendation MUST satisfy these as-stated — no workarounds.
3. SUB-QUESTIONS: What specific questions must be answered to fully address this?
4. SOURCES: Which Gemini search results are most relevant and credible?
5. SOURCE QUALITY: Rank sources — gov/edu/major news > industry pubs > blogs. Flag anything thin.
6. RECENCY: Are the facts current? Prefer ${CURRENT_YEAR}/${CURRENT_YEAR - 1} data. Flag stale data explicitly.
7. INSIGHTS: Extract specific facts, numbers, names, dates from the research.
8. CONFLICTS: Where do Claude and Gemini disagree? Pick the better-sourced position.
9. CONSTRAINT CHECK: Before writing winner/recommendation — does it genuinely satisfy the constraints from step 2? If an option only fits budget as a used model or different trim, name THAT specific variant ("2023 Toyota RAV4 Hybrid (used, $28k–$34k)") — not the new or idealized version. Never recommend Option A in one field and describe a different version of it in another.
10. SYNTHESIZE: Write JSON that is internally consistent — no field should contradict another.
11. UNCERTAINTY: In adversarialReview, flag anything unverified, outdated, or assumption-based.
12. ATTRIBUTION: For every keyFinding, populate attributedSources with 1–3 domain names that directly support the claim. Use exact domain strings (e.g. "edmunds.com", "cdc.gov"). Do not guess.

Only THEN output the JSON. Be concise and specific throughout.\n\n`
}
```

- [ ] **Step 2: Update all 8 synthesizer imports**

In each of these files — `action.ts`, `challenge.ts`, `decision.ts`, `explainer.ts`, `intelligence.ts`, `perspectives.ts`, `research.ts` — update the import and usage:

```typescript
// Before:
import { METHODOLOGY_PREAMBLE } from './preamble'
export const SOME_SYSTEM = `${METHODOLOGY_PREAMBLE}...`

// After:
import { getMethodologyPreamble } from './preamble'
export const SOME_SYSTEM = `${getMethodologyPreamble()}...`
```

- [ ] **Step 3: Fix `forecast.ts` — remove its own module-level `CURRENT_YEAR`**

In `ai/prompts/synthesizer/forecast.ts`, remove the line:
```typescript
const CURRENT_YEAR = new Date().getFullYear()
```
The `getMethodologyPreamble()` call already embeds `CURRENT_YEAR` in the returned string. If `forecast.ts` uses `CURRENT_YEAR` elsewhere in its template, inline the call: replace `${CURRENT_YEAR}` with `${new Date().getFullYear()}`.

- [ ] **Step 4: Verify no module-level date constants remain**

Run:
```bash
grep -rn "const CURRENT_DATE\|const CURRENT_YEAR" ai/prompts/synthesizer/
```
Expected: no output (all cleared).

- [ ] **Step 5: Verify the server still builds**

```bash
npx tsc --noEmit
```
Expected: no type errors.

- [ ] **Step 6: Commit**

```bash
git add ai/prompts/synthesizer/
git commit -m "fix: compute preamble date at call time, not module load"
```

---

## Task 2: Fix Follow-Up Research Orphaned Promise

**Why:** `handleContinueResearch` fires `loadSessions().then(prior => submit(...))` — a floating promise on a non-async callback. If `loadSessions` is slow or throws (e.g. IndexedDB on mobile), the submit either never fires or fires with empty prior sessions, silently breaking multi-turn research continuity.

**Files:**
- Modify: `app/page.tsx` — `handleContinueResearch` callback (lines 346–396)

- [ ] **Step 1: Convert `handleContinueResearch` to async and await session load**

Find the `handleContinueResearch` callback (currently `useCallback(() => {`). Change it to `useCallback(async () => {`. Then replace the `.then()` block:

```typescript
// Before:
loadSessions().then(prior => {
  submit({
    prompt:               newPrompt,
    clarificationContext: prevParts,
    forceProceed:         true,
    mode:                 detectedMode,
    priorSessions:        prior.slice(0, 10),
  })
})

// After:
try {
  const prior = await loadSessions()
  submit({
    prompt:               newPrompt,
    clarificationContext: prevParts,
    forceProceed:         true,
    mode:                 detectedMode,
    priorSessions:        prior.slice(0, 10),
  })
} catch {
  submit({
    prompt:               newPrompt,
    clarificationContext: prevParts,
    forceProceed:         true,
    mode:                 detectedMode,
    priorSessions:        [],
  })
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "fix: await loadSessions in handleContinueResearch, add fallback submit"
```

---

## Task 3: Extract Trust Score into a Tested Pure Function

**Why:** The trust score formula is embedded inline in the `onFinish` callback with no `modelConfidence` clamping (the audit notes that `result?.confidence ?? 50` flows directly into multiplication — the final `Math.min(100, Math.max(0, T))` clamps the output but not the input coefficients individually). Extracting it enables unit testing and prevents coefficient drift as new modes are added.

**Files:**
- Create: `lib/trust-score.ts`
- Create: `lib/trust-score.test.ts`
- Modify: `app/page.tsx` — `onFinish` callback (lines 136–184)

- [ ] **Step 1: Create `lib/trust-score.ts`**

```typescript
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
```

- [ ] **Step 2: Create `lib/trust-score.test.ts`**

```typescript
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
      domainType: 'gov' as const,
      credibilityScore: 5,
      tierLabel: 'Government',
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
```

- [ ] **Step 3: Run tests — verify they pass**

```bash
npx vitest run lib/trust-score.test.ts
```
Expected: 4 tests pass.

- [ ] **Step 4: Replace inline trust score in `app/page.tsx`**

Add the import at the top of `app/page.tsx`:
```typescript
import { computeTrustScore } from '@/lib/trust-score'
```

In the `onFinish` callback, remove the inline trust score block (lines ~140–168) and replace it with:
```typescript
setTrustScore(computeTrustScore(result ?? undefined))
```

The `if (result)` block for `saveSession` and `deepResearch` stays unchanged below that line.

- [ ] **Step 5: Type-check and run tests again**

```bash
npx tsc --noEmit && npx vitest run lib/trust-score.test.ts
```
Expected: no type errors, 4 tests pass.

- [ ] **Step 6: Commit**

```bash
git add lib/trust-score.ts lib/trust-score.test.ts app/page.tsx
git commit -m "feat: extract trust score to tested pure function with confidence clamping"
```

---

## Task 4: Harden SSRF Filter in Source Extraction

**Why:** `isSafeUrl` in `ai/nodes/sources.ts` misses the CGNAT range (`100.64.0.0/10`), decimal-encoded IPs (e.g. `http://2130706433/` = `127.0.0.1`), and `0.0.0.0`. Gemini citation URLs are externally-supplied inputs — an incomplete blocklist is an SSRF vulnerability.

**Files:**
- Modify: `ai/nodes/sources.ts` — `isSafeUrl` function (lines 81–90)

- [ ] **Step 1: Replace `isSafeUrl` with hardened version**

In `ai/nodes/sources.ts`, replace the `isSafeUrl` function (lines 81–90) with:

```typescript
// Private/reserved hostname patterns for SSRF protection.
// Each named constant covers a specific RFC-defined block.
const LOOPBACK        = /^(localhost|127\.)/i
const PRIVATE_10      = /^10\./
const PRIVATE_172     = /^172\.(1[6-9]|2\d|3[01])\./
const PRIVATE_192     = /^192\.168\./
const LINK_LOCAL      = /^169\.254\./
const CGNAT           = /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./  // 100.64.0.0/10
const IPV6_LOOPBACK   = /^::1$/
const IPV6_UNIQUE_LOCAL = /^fc[0-9a-f][0-9a-f]:/i
const IPV6_LINK_LOCAL = /^fe[89ab][0-9a-f]:/i
const ANY_ADDR        = /^0\.0\.0\.0/

function isSafeUrl(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url)
    if (protocol !== 'https:' && protocol !== 'http:') return false
    // Reject decimal-encoded IPs (e.g. http://2130706433/ → 127.0.0.1)
    if (/^\d+$/.test(hostname)) return false
    // Reject hostnames with no dot (catches 'localhost' and similar bare names)
    if (!hostname.includes('.') && !hostname.startsWith('[')) return false
    if (
      LOOPBACK.test(hostname) ||
      PRIVATE_10.test(hostname) ||
      PRIVATE_172.test(hostname) ||
      PRIVATE_192.test(hostname) ||
      LINK_LOCAL.test(hostname) ||
      CGNAT.test(hostname) ||
      ANY_ADDR.test(hostname) ||
      IPV6_LOOPBACK.test(hostname) ||
      IPV6_UNIQUE_LOCAL.test(hostname) ||
      IPV6_LINK_LOCAL.test(hostname)
    ) return false
    return true
  } catch {
    return false
  }
}
```

- [ ] **Step 2: Manually verify the four cases from the audit**

Add a temporary test script at the bottom of the file (delete after checking), or just run this in a Node REPL:

```typescript
// These should all return false:
isSafeUrl('http://0.0.0.0/')         // ANY_ADDR
isSafeUrl('http://100.64.0.1/')      // CGNAT
isSafeUrl('http://2130706433/')      // decimal 127.0.0.1
isSafeUrl('http://localhost/')       // no dot check
// These should return true:
isSafeUrl('https://reuters.com/article')
isSafeUrl('https://cdc.gov/page')
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add ai/nodes/sources.ts
git commit -m "fix: harden isSafeUrl — add CGNAT, decimal IP, and 0.0.0.0 SSRF blocks"
```

---

## Task 5: Split StructuredOutputView into Per-Mode Files

**Why:** `components/research/StructuredOutputView.tsx` is 1,268 LOC with cyclomatic complexity 51. It houses 14 named components plus the mode-dispatch orchestrator in a single file. Any schema change or rendering fix requires reading the entire file. This task is a **pure file-split** — zero logic changes.

**Files:**
- Create: `components/research/views/primitives.tsx`
- Create: `components/research/views/ExecutiveAnswer.tsx`
- Create: `components/research/views/DecisionBreakdown.tsx`
- Create: `components/research/views/EvidenceAndInsights.tsx`
- Create: `components/research/views/Risks.tsx`
- Create: `components/research/views/WhatThisMisses.tsx`
- Create: `components/research/views/ActionPlan.tsx`
- Create: `components/research/views/GoDeeperCard.tsx`
- Create: `components/research/views/Sources.tsx`
- Create: `components/research/views/PerspectivesView.tsx`
- Create: `components/research/views/ChallengeView.tsx`
- Create: `components/research/views/ExecutionView.tsx`
- Create: `components/research/views/AnalysisView.tsx`
- Create: `components/research/views/UnderstandingView.tsx`
- Create: `components/research/views/ForecastView.tsx`
- Modify: `components/research/StructuredOutputView.tsx` → keep only the mode-dispatch + `Props` interface

- [ ] **Step 1: Read the full current file**

```bash
wc -l components/research/StructuredOutputView.tsx
cat components/research/StructuredOutputView.tsx
```

Read it completely before touching anything. Note every named component, every import, and every import that shared primitives need.

- [ ] **Step 2: Create `components/research/views/primitives.tsx`**

Move into this file: `Label`, `ConfidencePip`, `CredibilityPip`, `Card` (with its `CardProps` interface), and `scoreColor`. Add any imports they need (motion, React types). Export all of them named.

```typescript
'use client'

import { motion } from 'motion/react'

export function Label({ children }: { children: React.ReactNode }) { /* ... */ }
export function ConfidencePip({ level }: { level: string }) { /* ... */ }
export function CredibilityPip({ tier }: { tier?: string }) { /* ... */ }
export interface CardProps { /* ... */ }
export function Card({ children, delay, accentColor, className, style }: CardProps) { /* ... */ }
export function scoreColor(score: number) { /* ... */ }
```

(Copy the exact implementation from the original file — no logic changes.)

- [ ] **Step 3: Create each view file**

For each of the 14 components, create `components/research/views/<ComponentName>.tsx` with:
- `'use client'` directive
- Imports from `./primitives` for any shared primitive it uses
- Imports from `@/ai/output/structured-output` or `@/ai/schemas` for any types it needs
- The exact component implementation copied from `StructuredOutputView.tsx`
- A named export of the component

Example for `ExecutiveAnswer.tsx`:
```typescript
'use client'

import { Label, ConfidencePip } from './primitives'
import type { StructuredOutput } from '@/ai/output/structured-output'

export function ExecutiveAnswer({ data }: { data: StructuredOutput }) {
  // exact copy of ExecutiveAnswer from StructuredOutputView.tsx
}
```

Repeat this pattern for all 14 components. Do not change any JSX or logic.

- [ ] **Step 4: Rewrite `StructuredOutputView.tsx` as orchestrator shell**

Replace the file contents with only the mode-dispatch logic and `Props` interface:

```typescript
'use client'

import { toStructuredOutput } from '@/ai/output/structured-output'
import type { EliteResearchOutput } from '@/ai/schemas'
import { ExecutiveAnswer }      from './views/ExecutiveAnswer'
import { DecisionBreakdown }    from './views/DecisionBreakdown'
import { EvidenceAndInsights }  from './views/EvidenceAndInsights'
import { Risks }                from './views/Risks'
import { WhatThisMisses }       from './views/WhatThisMisses'
import { ActionPlan }           from './views/ActionPlan'
import { GoDeeperCard }         from './views/GoDeeperCard'
import { Sources }              from './views/Sources'
import { PerspectivesView }     from './views/PerspectivesView'
import { ChallengeView }        from './views/ChallengeView'
import { ExecutionView }        from './views/ExecutionView'
import { AnalysisView }         from './views/AnalysisView'
import { UnderstandingView }    from './views/UnderstandingView'
import { ForecastView }         from './views/ForecastView'

interface Props {
  data: Partial<EliteResearchOutput>
  isLoading: boolean
  onGoDeeper?: (question: string) => void
}

export function StructuredOutputView({ data, isLoading, onGoDeeper }: Props) {
  const structured = toStructuredOutput(data)
  // ... existing mode-dispatch logic, now using imported sub-components
}
```

- [ ] **Step 5: Verify line count**

```bash
wc -l components/research/StructuredOutputView.tsx
```
Expected: fewer than 100 lines.

- [ ] **Step 6: Type-check**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 7: Start the dev server and verify all 8 modes render**

```bash
npm run dev
```

Open the app, run a research query for at least one of: `decision`, `research`, `forecast`, `perspectives`, `competitive` modes. Confirm the output renders without visual regression.

- [ ] **Step 8: Commit**

```bash
git add components/research/
git commit -m "refactor: split StructuredOutputView into per-mode view files"
```

---

## Self-Review

### Spec coverage

| Audit finding | Task |
|---|---|
| Stale `METHODOLOGY_PREAMBLE` date | Task 1 |
| `forecast.ts` module-level `CURRENT_YEAR` | Task 1 step 3 |
| Orphaned `.then()` in `handleContinueResearch` | Task 2 |
| Untested inline trust score with no confidence clamping | Task 3 |
| Incomplete SSRF filter (missing CGNAT, decimal IP, 0.0.0.0) | Task 4 |
| 1,268 LOC `StructuredOutputView.tsx` monolith | Task 5 |

All 5 production failure scenarios from the audit are covered by Tasks 1–3.

### Not in scope (separate work)

- Splitting `runResearchPipeline` (Risk 2 in audit) — deferred; higher blast radius, needs integration testing
- Streaming truncation detection (Scenario 2 in audit) — requires API route changes + schema changes
