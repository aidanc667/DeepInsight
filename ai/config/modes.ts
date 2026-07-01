// ─── Mode Configuration ───────────────────────────────────────────────────────
// Single source of truth for all mode-specific rules:
//   • question caps          (used by clarify/plan, clarify/next, page.tsx)
//   • stop conditions        (used by clarify/next)
//   • clarification prompts  (used by clarify/plan)
//   • lightweight inference  (used by clarify/plan as fallback)

import type { QueryMode } from '@/ai/schemas'

export interface ModeConfig {
  cap: number
  stopCondition: string
}

export const MODES: Record<QueryMode, ModeConfig> = {
  forecast: {
    cap: 2,
    stopCondition: 'You know their time horizon AND decision context — both are required to give a grounded forecast',
  },
  decision: {
    cap: 5,
    stopCondition: 'You know the specific options being compared AND at least one key constraint (budget, must-haves, or priorities)',
  },
  action: {
    cap: 5,
    stopCondition: 'You know their starting point AND at least one of: goal/timeline, available resources, or biggest obstacle',
  },
  explainer: {
    cap: 2,
    stopCondition: 'You know their background level — that alone shapes every analogy, term, and depth level',
  },
  perspectives: {
    cap: 3,
    stopCondition: 'The debate topic is clear AND you know why they need this (decision, forming opinion, research, or debate)',
  },
  intelligence: {
    cap: 3,
    stopCondition: 'The angle and use case are clear — you know what dimension matters and why they need it',
  },
  competitive: {
    cap: 3,
    stopCondition: 'The specific claim or position being challenged is clear',
  },
  research: {
    cap: 4,
    stopCondition: 'You know their objective AND at least two key context factors (background, constraints, use case, or scope)',
  },
}

export function getModeCap(mode: string): number {
  return MODES[mode as QueryMode]?.cap ?? 3
}

export function getModeStopCondition(mode: string): string {
  return MODES[mode as QueryMode]?.stopCondition ?? MODES.research.stopCondition
}

// ─── Lightweight mode inference ───────────────────────────────────────────────
// Used by clarify/plan when no mode hint is passed from the client.
// The full AI classifier runs in parallel — this is only a regex fallback.
export function inferMode(prompt: string): QueryMode {
  if (/\b(should i|should we|which.*(better|best|right)|what.*(should|recommend|buy|get|choose|pick|use)|help me (choose|decide|pick|select)|best .*(for me|option|choice)|vs\.?\s|versus)\b/i.test(prompt)) return 'decision'
  if (/\b(how (do i|to|can i)|step.?by.?step|plan to|roadmap|how to (launch|build|create|start|set up|implement|run))\b/i.test(prompt)) return 'action'
  if (/\b(explain|understand|how does|why does|analogy|break.?down|eli5|in simple terms|for (a )?beginner)\b/i.test(prompt)) return 'explainer'
  if (/\b(pros and cons|arguments? (for|against)|different (views|perspectives|sides)|debate|both sides|case for|case against)\b/i.test(prompt)) return 'perspectives'
  if (/\b(latest|current state|what.?s happening|trend|news about|state of|in 202[0-9])\b/i.test(prompt)) return 'intelligence'
  if (/\b(vs\.?\s|versus|compare|difference between|better than|x vs y)\b/i.test(prompt)) return 'competitive'
  if (/\b(what will|where is .* headed|future of|predictions? for|in the next \d|what.?s coming|outlook for|forecast|by 20[2-9]\d)\b/i.test(prompt)) return 'forecast'
  return 'research'
}

// ─── Mode-aware clarification question instructions ───────────────────────────
// Used by clarify/plan to shape what dimensions the expert asks about.
export function getModeInstructions(mode: string, cap: number): string {
  switch (mode) {
    case 'decision':
      return `DECISION MODE — The user needs a concrete, personalized recommendation.

Consider these dimensions and ask about the ones most critical for THIS specific query.
Reorder by what would most change your recommendation — and SKIP any that don't apply:
- BUDGET / PRICE RANGE — Essential for purchases; skip entirely for non-purchase decisions (health choices, career moves, relationships)
- PRIMARY USE CASE — What will this actually be used for day-to-day?
- MUST-HAVES vs. NICE-TO-HAVES — What are their hard non-negotiables?
- CURRENT SITUATION — What do they have now / what are they coming from?
- RISK / PRIORITY — Reliability vs. performance vs. value vs. prestige vs. simplicity?
- TIMELINE / URGENCY — When do they need to decide or have this in place?

Ask up to ${cap} questions. Lead with whichever dimension is MOST missing from the query — not always budget. Never ask about something the user already stated.

OPTION RULES — critical for making answers feel expert:
- Budget: SPECIFIC dollar ranges spanning low to high for this domain
  e.g. cars: "$15k–$25k", "$25k–$40k", "$40k–$60k", "$60k+"
  e.g. SaaS tools: "Under $50/mo", "$50–$200/mo", "$200–$500/mo", "Enterprise pricing"
- Use case: real, named scenarios from this domain — not abstract categories
  e.g. cars: "Daily commute under 30 miles", "Family hauler with 2+ kids", "Long road trips", "Weekend driving fun"
- Must-haves: concrete domain-specific features, not vague descriptors
- Span the full realistic range — don't cluster options in the middle`

    case 'action':
      return `ACTION MODE — The user needs a step-by-step plan tailored to their exact situation.

Consider these dimensions and lead with whichever is LEAST clear from the query:
- CURRENT STARTING POINT — Where are they right now? This determines step 1.
- GOAL / SUCCESS METRIC — What does "done" look like? By when?
- AVAILABLE RESOURCES — Time per week AND budget (skip budget if clearly irrelevant to this type of task)
- BIGGEST OBSTACLE — What's the hardest part for them specifically?
- CONSTRAINTS — Hard limits: tools they can't use, things they must avoid

Ask up to ${cap} questions. Skip any dimension already clearly stated.

OPTION RULES:
- Starting point: span beginner → experienced with realistic domain-specific milestones
- Timeline: specific durations, never vague ("Within 2 weeks", "1–3 months", "3–6 months", "6–12 months", "No deadline")
- Budget: SPECIFIC dollar ranges for this domain; skip the question entirely if budget is irrelevant
- Goals: concrete, measurable outcomes tied to this specific task — not generic aspirations`

    case 'explainer':
      return `EXPLAINER MODE — The explanation must be calibrated to their exact background level.

Ask up to ${cap} questions:
1. BACKGROUND LEVEL — Always ask this first. It shapes every analogy, term choice, and depth level.
   Use EXACTLY these 4 options (verbatim):
   - "Complete beginner — I have no prior knowledge of this"
   - "Some familiarity — I know the basics but not the details"
   - "Intermediate — I understand the core concepts"
   - "Advanced — I want nuance, edge cases, and depth"

2. SPECIFIC ANGLE (only if the topic is genuinely multi-faceted) — What aspect matters most?
   Generate 4 concrete, topic-specific options that represent meaningfully different sub-topics.
   Skip this question if the topic is already narrow and focused.`

    case 'perspectives':
      return `PERSPECTIVES MODE — The user wants to understand a genuinely contested debate.

Ask up to ${cap} questions — tailor every option to THIS exact topic:
1. PURPOSE — Why do they need this? What will they do with it?
   Options: "Making a personal decision that depends on this", "Forming my own informed opinion", "Academic research or structured debate", "I need to argue one side effectively"

2. SPECIFIC DIMENSION — Which aspect of this debate matters most to them?
   Generate 4 concrete options specific to THIS exact controversy — not generic sub-topics.
   e.g. for "nuclear energy": "Safety and accident risk", "Cost vs. other clean energy", "Role in climate change strategy", "Waste storage and long-term risk"

3. CURRENT LEAN — What's their starting position?
   Options tailored to the specific debate — e.g. "I support [X] but want to understand the strongest counterarguments", "Genuinely undecided", "Skeptical of the mainstream view", "I want my current view stress-tested"`

    case 'intelligence':
      return `INTELLIGENCE MODE — The user wants current, specific insights, not a general overview.

Ask up to ${cap} questions — all options must be specific to THIS exact topic:
1. SPECIFIC ANGLE — Which dimension of this topic matters most right now?
   Generate 4 concrete angles tied to this exact subject (sector, geography, stakeholder, technology, regulatory dimension)

2. USE CASE — Why do they need this intelligence?
   Options: "Evaluating an investment or financial decision", "Professional context — industry or competitive research", "Academic or journalistic research", "Personal curiosity and general understanding"

3. RECENCY vs. DEPTH — What balance matters most?
   Options: "Latest developments in the past 3–6 months only", "Past 1–2 years of meaningful change", "Historical trajectory that explains the present state", "Both: where it is now AND how it got there"`

    case 'competitive':
      return `COMPETITIVE / CHALLENGE MODE — The user wants rigorous pressure-testing of a claim or position.

Ask up to ${cap} questions:
1. SPECIFIC CLAIM — What exactly needs to be challenged or stress-tested?
   Generate 4 concrete options based on the most common positions held on THIS exact topic.
   These must be real stances people actually take — not abstract categories.

2. WHAT'S AT STAKE — What decision or action depends on this analysis?
   Options: "I'm about to commit to this — I need to find the flaws first", "I need to counter this argument in a debate or discussion", "I'm writing about this and need the strongest opposing case", "I want to know if this is as good/risky/important as claimed"

3. ANGLE OF ATTACK — What type of weakness should the challenge focus on?
   Options: "Factual errors or misleading statistics in the argument", "Hidden assumptions that break down under scrutiny", "What the argument omits or deliberately ignores", "Real-world cases where this failed or backfired"`

    case 'forecast':
      return `FORECAST MODE — The user wants forward-looking predictions, not current state.

Ask up to ${cap} questions:
1. TIME HORIZON — How far out are they looking?
   Options: "Next 3–6 months", "1–2 years out", "3–5 year view", "5–10+ years"

2. DECISION CONTEXT — What will they DO with this forecast? This shapes which signals matter most.
   Options: "Investment or financial decision I need to make", "Business strategy or product roadmap planning", "Career or personal life planning", "General intelligence — I want to understand where this is heading"

OPTION RULES: Both questions are always relevant. Only skip one if the answer is explicitly stated in the query.`

    default: // research + general
      return `RESEARCH MODE — The user wants thorough, expert-level information on a specific topic.

Ask up to ${cap} questions covering the highest-impact gaps. For each, generate options that are REAL and SPECIFIC to this exact topic:

1. SPECIFIC OBJECTIVE — What will they DO with this information?
   Generate 4 concrete, realistic end-goals specific to this exact topic and domain.

2. CONTEXT / SITUATION — What's their current situation that makes certain angles more relevant?
   Generate 4 concrete options representing the most common real-world starting points for this topic.

3. SCOPE / CONSTRAINTS — What should shape the depth and focus of the answer?
   Generate 4 concrete options with real values — geography, budget range, expertise level, time horizon, or domain sub-scope.

4. SPECIFIC ANGLE (only if the topic is broad) — Which sub-topic matters most?
   Generate 4 concrete sub-topics specific to this subject. Skip if the query is already focused.

OPTION RULES — non-negotiable:
- Every option must be a real, specific value — no vague tiers ("budget-friendly", "mid-range") or catch-alls
- Use domain-specific terminology, real numbers, and named examples where possible
- Span the full realistic range — don't cluster options together in the middle
- Phrase naturally, like a knowledgeable expert talking to a peer

Ask up to ${cap} questions. Fewer only if objective and context are already clearly stated.`
  }
}
