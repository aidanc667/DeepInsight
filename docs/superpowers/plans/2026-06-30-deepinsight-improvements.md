# DeepInsight AI Quality & Speed Improvements

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 5 Opus-advisor recommendations: AI-selected expert personas, adaptive clarification dimensions, steelman-first in TITAN, parallel Gemini prefetch, and trimmed/differentiated NOVA/CIPHER.

**Architecture:** Mostly prompt + config changes; one pipeline change (fire Gemini alongside Phase 1); one schema change (drop expertConsensus from NOVA); no new routes needed.

**Tech Stack:** Next.js App Router, Claude Haiku (classify + clarify), Claude Sonnet (synthesize), Gemini Flash (web search), AI SDK v6, Zod schemas

---

## Task 1: AI-selected expert persona (replace keyword routing)

Currently `getExpertPersona(prompt)` does brittle keyword matching across 13 domains before the model sees the query. Fix: add a `domain` field to the classifier output so Haiku picks the domain, then pass it to the clarify routes.

**Files:**
- Modify: `ai/schemas/index.ts` — add `domain` + `DOMAIN_NAMES` to `QueryClassifierSchema`
- Modify: `ai/prompts/classifier.ts` — add DOMAIN section to classifier prompt
- Modify: `app/page.tsx` — pass `domain` from classify result to clarify/plan and clarify/next
- Modify: `app/api/clarify/plan/route.ts` — accept `domain` param, use it instead of keyword detection
- Modify: `app/api/clarify/next/route.ts` — accept `domain` param, use it instead of keyword detection

**Steps:**

- [ ] **Step 1: Add `DOMAIN_NAMES` and `domain` field to QueryClassifierSchema**

In `ai/schemas/index.ts`, before `QueryClassifierSchema`:

```ts
export const DOMAIN_NAMES = [
  'automotive', 'finance', 'real_estate', 'health', 'technology', 'legal',
  'career', 'nutrition', 'business', 'travel', 'education', 'parenting', 'general',
] as const
export type DomainName = typeof DOMAIN_NAMES[number]
```

Then update `QueryClassifierSchema`:

```ts
export const QueryClassifierSchema = z.object({
  mode: z.enum(QUERY_MODES),
  confidence: z.number(),
  reasoning: z.string(),
  modeLabel: z.string(),
  domain: z.enum(DOMAIN_NAMES).default('general'),
})
```

And add the type export at the bottom:

```ts
export type QueryClassifier = z.infer<typeof QueryClassifierSchema>
```

- [ ] **Step 2: Update classifier prompt to output domain**

In `ai/prompts/classifier.ts`, add a DOMAIN block to `CLASSIFIER_SYSTEM_PROMPT` after the MODES section and before "Rules:", then update "Return JSON only." to include domain:

```
DOMAIN — pick the single best match for the expert who should answer this:
- automotive: cars, vehicles, buying/leasing, EV, reliability
- finance: investing, stocks, crypto, retirement, budgeting, wealth
- real_estate: buying/renting homes, mortgages, property investment
- health: medical symptoms, treatments, medications, mental health
- technology: software, hardware, programming, AI, cloud, devices
- legal: law, contracts, rights, compliance, immigration, estate planning
- career: jobs, salary negotiation, resumes, promotions, career change
- nutrition: diet, weight loss, meal planning, supplements, macros
- business: startups, entrepreneurship, marketing, growth, fundraising
- travel: flights, hotels, destinations, itineraries, points/miles
- education: college admissions, degrees, certifications
- parenting: kids, babies, child development, family decisions
- general: cross-domain or anything that doesn't fit a single domain above
```

- [ ] **Step 3: Read app/page.tsx to find where domain should be passed**

```bash
grep -n "clarify/plan\|clarify/next\|classif" app/page.tsx | head -30
```

Find the fetch calls for `/api/clarify/plan` and `/api/clarify/next`, and the classify result destructuring. Then edit to pass `domain` from the classify result through both clarify calls.

- [ ] **Step 4: Update clarify/plan to use AI-selected domain**

In `app/api/clarify/plan/route.ts`, destructure `domain` from request body:

```ts
const { prompt: rawPrompt, mode: modeHint, domain } = await req.json() as {
  prompt: string; mode?: string; domain?: string
}
```

Replace the `getExpertPersona` call:

```ts
import { EXPERT_PERSONAS } from '@/ai/prompts/expert-personas'
import type { DomainName } from '@/ai/schemas'

// OLD: const { title, description } = getExpertPersona(prompt)
// NEW:
const persona = EXPERT_PERSONAS[(domain as DomainName) ?? 'general'] ?? EXPERT_PERSONAS.general
const { title, description } = persona
```

Remove the `getExpertPersona` import.

- [ ] **Step 5: Update clarify/next to use AI-selected domain**

Same pattern in `app/api/clarify/next/route.ts`. Add `domain` to destructuring, update `buildSystem()` signature to accept `domain?: string`, look up persona by domain key instead of calling `getExpertPersona`.

- [ ] **Step 6: Commit**

```bash
git add ai/schemas/index.ts ai/prompts/classifier.ts app/page.tsx app/api/clarify/plan/route.ts app/api/clarify/next/route.ts
git commit -m "feat: AI-selected expert domain replaces keyword persona routing"
```

---

## Task 2: Adaptive clarification dimensions (skip inapplicable, reorder by query)

Mode instructions list dimensions in a fixed priority order — decision always asks budget first, even for non-purchase decisions. Fix: change prompt framing from "ask in this order" to "consider these dimensions; skip inapplicable ones; prioritize by what would most change your answer for THIS specific query."

**Files:**
- Modify: `ai/config/modes.ts` — update `getModeInstructions()` for decision and action modes (these two have the most rigid ordering; the others are already reasonably flexible)

**Steps:**

- [ ] **Step 1: Update decision mode instructions**

In `getModeInstructions()`, replace the `case 'decision':` return value. Change the opening from:

```
Ask ${cap} questions covering these dimensions (highest-impact first):
1. BUDGET / PRICE RANGE — ...
```

To:

```
Consider these dimensions and ask about the ones MOST CRITICAL for THIS specific query.
Skip any that clearly don't apply (e.g. skip BUDGET for personal/health/career decisions that have no purchase), and lead with whichever dimension would most change your recommendation:

- BUDGET / PRICE RANGE — Essential for purchases; skip for non-purchase decisions
- PRIMARY USE CASE — What will this actually be used for day-to-day?
- MUST-HAVES vs. NICE-TO-HAVES — What are their non-negotiables?
- CURRENT SITUATION — What do they have now / where are they starting from?
- RISK / PRIORITY — Reliability vs. performance vs. value vs. relationships?
- TIMELINE / URGENCY — When do they need to act or decide?

Ask up to ${cap} questions. Only ask fewer if those dimensions are already clearly stated.
```

- [ ] **Step 2: Update action mode instructions**

Same pattern for `case 'action':`. Change from fixed-order "1. CURRENT STARTING POINT" list to:

```
Consider these dimensions and ask about the ones most critical for THIS specific plan.
Lead with whichever dimension is least clear from the query:

- CURRENT STARTING POINT — Where are they right now? This determines step 1.
- GOAL / SUCCESS METRIC — What does "done" look like, and by when?
- AVAILABLE RESOURCES — Time per week + budget (skip budget if irrelevant for this type of task)
- BIGGEST OBSTACLE — What's the hardest part for them specifically?
- CONSTRAINTS — Hard limits: tools they can't use, things they must avoid

Ask up to ${cap} questions. Start with whichever of starting-point or goal is less clear.
```

- [ ] **Step 3: Commit**

```bash
git add ai/config/modes.ts
git commit -m "refactor: clarification dimensions adaptive per query, not scripted order"
```

---

## Task 3: Steelman first in TITAN (reorder ChallengeView)

The TITAN mode already has a steelman — `adversarialReview` renders with the label "Steelman" in ChallengeView. But it appears at the bottom, after the critique. A challenge without first stating the strongest form of the argument is less credible. Fix: move steelman to the top, and update the synthesis prompt to reinforce the ordering.

**Files:**
- Modify: `components/research/views/ChallengeView.tsx` — move `adversarialReview` block to render first
- Modify: `ai/prompts/synthesizer/challenge.ts` — update `adversarialReview` description to say "state strongest form first"

**Steps:**

- [ ] **Step 1: Reorder ChallengeView sections**

In `ChallengeView.tsx`, the current render order is:
1. verdict
2. risks
3. blindSpots + misconceptions
4. adversarialReview (Steelman) ← move this to position 1

Move the `adversarialReview` motion.div block to be the first child inside `<div className="space-y-3.5">`.

Update its animation delay from `delay + 0.06` to `delay` (it's now first).
Shift the other sections' delays: verdict → `delay + 0.02`, risks → `delay + 0.04`, blindSpots/misconceptions → `delay + 0.06`.

- [ ] **Step 2: Update CHALLENGE_SYSTEM prompt**

In `ai/prompts/synthesizer/challenge.ts`, update the `adversarialReview` field description:

```
// Change:
"adversarialReview": "1-2 sentences. Steelman — what's actually defensible or correct here.",

// To:
"adversarialReview": "1-2 sentences. Steel-man the position being challenged: state its STRONGEST version — the best argument in its favor, what's genuinely right or defensible about it. This appears before the critique.",
```

Also add a note to RULES: "Steelman goes first — you must acknowledge what's right before dissecting what's wrong."

- [ ] **Step 3: Commit**

```bash
git add components/research/views/ChallengeView.tsx ai/prompts/synthesizer/challenge.ts
git commit -m "fix: steelman renders first in TITAN before critique sections"
```

---

## Task 4: Parallelize Gemini web search with Phase 1

Currently classify + plan (Phase 1) must fully resolve before Gemini search starts (Phase 2). This is ~1–2s of dead time on every research run. Fix: fire Gemini on the raw query at the start of the pipeline alongside Phase 1. If the resulting mode doesn't use Gemini (SAGE/ECHO), discard the result.

**Files:**
- Modify: `ai/graphs/research-pipeline.ts` — fire early Gemini promise before Phase 1 await

**Steps:**

- [ ] **Step 1: Read research-pipeline.ts to find exact locations**

```bash
grep -n "emptyClaudeResponse\|emptyGeminiResponse\|Phase 1\|Promise.all\|callGemini" ai/graphs/research-pipeline.ts
```

Find where `emptyClaudeResponse` and `emptyGeminiResponse` are defined, and where Phase 1 `await Promise.all([...])` is.

- [ ] **Step 2: Move empty response constants before Phase 1**

These constants are referenced in the early Gemini promise. Move their definitions to just after the `const { prompt, ... } = input` destructuring — before the Phase 1 block. Their current values don't change:

```ts
const emptyClaudeResponse = { modelId: 'claude' as const, rawText: '', citations: [], latencyMs: 0 }
const emptyGeminiResponse = { modelId: 'gemini' as const, rawText: '', citations: [], latencyMs: 0 }
```

- [ ] **Step 3: Fire early Gemini promise before Phase 1**

Immediately after the constants (and before `await Promise.all([classifyQuery, planResearch])`), add:

```ts
// ── Pre-Phase 1: Start Gemini on raw query to overlap with classify + plan ─
// Discarded if the classified mode doesn't use Gemini (SAGE/ECHO).
// Cost: occasional wasted Gemini call. Saves ~1–2s on all other runs.
const earlyGeminiPromise = (!clientMode && !prefetchedGemini)
  ? callGemini(prompt).catch(() => emptyGeminiResponse)
  : null
```

- [ ] **Step 4: Use earlyGeminiPromise in Phase 2**

In the Phase 2 model call block, update the Gemini branch to prefer the early promise:

```ts
// Find the line that determines the gemini call and replace:
// OLD:
GEMINI_SEARCH_MODES.has(mode)
  ? (prefetchedGeminiResponse ? Promise.resolve(prefetchedGeminiResponse) : callGemini(geminiPrompt))
  : Promise.resolve(emptyGeminiResponse),

// NEW:
GEMINI_SEARCH_MODES.has(mode)
  ? (prefetchedGeminiResponse
      ? Promise.resolve(prefetchedGeminiResponse)
      : (earlyGeminiPromise ?? callGemini(geminiPrompt))
    )
  : Promise.resolve(emptyGeminiResponse),
```

The `CLAUDE_REASONING_MODES`, `GEMINI_SEARCH_MODES` Sets, `prefetchedGeminiResponse`, and other existing logic stay unchanged.

- [ ] **Step 5: Commit**

```bash
git add ai/graphs/research-pipeline.ts
git commit -m "perf: fire Gemini web search in parallel with Phase 1 — removes ~1-2s sequential gap"
```

---

## Task 5: Trim NOVA sections + differentiate NOVA/CIPHER + adjust caps

NOVA (research) has 9+ bento sections with heavy overlap — `expertConsensus` largely duplicates `keyFindings` and `overview`. CIPHER (intelligence) is nearly a NOVA subset. Also: research cap 3→4 (better for the fallback mode), forecast cap 3→2 (time horizon + decision context is enough).

**Files:**
- Modify: `ai/config/modes.ts` — research cap 3→4, forecast cap 3→2
- Modify: `ai/prompts/synthesizer/research.ts` — remove `expertConsensus` from JSON template
- Modify: `ai/schemas/index.ts` — remove `expertConsensus` from `ResearchModeSchema`
- Modify: `ai/output/structured-output.ts` — remove from `EvidenceAndInsights` interface + transformer
- Modify: `components/research/views/EvidenceAndInsights.tsx` — remove expertConsensus render block
- Modify: `components/research/views/AnalysisView.tsx` — make `patterns` visually prominent (card style, not bullet list)

**Steps:**

- [ ] **Step 1: Update mode caps**

In `ai/config/modes.ts`, in the `MODES` record:

```ts
// Change research cap:
research: {
  cap: 4,
  stopCondition: 'You know their objective AND at least two key context factors (background, constraints, use case, or scope)',
},

// Change forecast cap:
forecast: {
  cap: 2,
  stopCondition: 'You know the time horizon AND the decision context — both are required to give a grounded forecast',
},
```

- [ ] **Step 2: Remove expertConsensus from RESEARCH_SYSTEM prompt**

In `ai/prompts/synthesizer/research.ts`, remove the line:

```
  "expertConsensus": "2-3 sentences on what experts agree on.",
```

from the JSON template. Do not add a replacement — the content naturally folds into `overview` and `keyFindings`.

- [ ] **Step 3: Remove expertConsensus from ResearchModeSchema**

In `ai/schemas/index.ts`, in `ResearchModeSchema`, remove:

```ts
expertConsensus: z.string(),
```

The `EliteResearchOutputSchema` has `expertConsensus` as optional — leave it there (not a breaking change, just unused by NOVA streaming).

- [ ] **Step 4: Remove expertConsensus from structured-output.ts**

In `ai/output/structured-output.ts`:

Remove from `EvidenceAndInsights` interface:
```ts
// Remove this line:
expertConsensus: string
```

Remove from the transformer:
```ts
// Remove this line in the evidenceAndInsights object:
expertConsensus: raw.expertConsensus ?? '',
```

- [ ] **Step 5: Remove expertConsensus from EvidenceAndInsights view**

Read `components/research/views/EvidenceAndInsights.tsx`. Find the JSX block that renders `expertConsensus` (likely a Card with label "Expert Consensus"). Remove it entirely.

Verify no TypeScript error by checking the component's `data` prop type matches the updated `EvidenceAndInsights` interface.

- [ ] **Step 6: Make patterns prominent in AnalysisView (CIPHER)**

Read `components/research/views/AnalysisView.tsx`. Find where `patterns` renders. If it's currently a plain list, upgrade each pattern to a styled card to differentiate CIPHER from NOVA visually:

```tsx
{patterns.map((pattern, i) => (
  <div key={i} className="p-3.5 rounded-xl" style={{ background: '#f8f5f0', border: '1px solid #e8e2d9' }}>
    <div className="flex items-start gap-3">
      <span className="font-mono text-[10px] font-bold text-indigo-600 mt-1 shrink-0">→</span>
      <p className="text-[13.5px] text-slate-700 leading-[1.65]">{pattern}</p>
    </div>
  </div>
))}
```

- [ ] **Step 7: Grep for remaining expertConsensus references**

```bash
grep -rn "expertConsensus" components/ app/ ai/ --include="*.ts" --include="*.tsx"
```

Remove or update any remaining references. The field can stay in `EliteResearchOutputSchema` as optional — just remove any *rendering* of it.

- [ ] **Step 8: Type check**

```bash
npx tsc --noEmit 2>&1 | grep -v "node_modules"
```

Fix any errors before committing.

- [ ] **Step 9: Commit**

```bash
git add ai/config/modes.ts ai/prompts/synthesizer/research.ts ai/schemas/index.ts ai/output/structured-output.ts components/research/views/EvidenceAndInsights.tsx components/research/views/AnalysisView.tsx
git commit -m "refactor: trim NOVA expertConsensus, differentiate CIPHER patterns, bump research cap to 4"
```
