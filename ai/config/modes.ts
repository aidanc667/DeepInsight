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
    cap: 3,
    stopCondition: 'You know the topic domain AND their time horizon or decision context',
  },
  decision: {
    cap: 5,
    stopCondition: 'You know the specific options being compared AND at least one key constraint (budget, must-haves)',
  },
  action: {
    cap: 5,
    stopCondition: 'You know their starting point AND available resources or timeline',
  },
  explainer: {
    cap: 2,
    stopCondition: 'You know their background level — that alone shapes the entire explanation',
  },
  perspectives: {
    cap: 3,
    stopCondition: 'The debate topic and their stakes are clear',
  },
  intelligence: {
    cap: 3,
    stopCondition: 'The angle and use case are clear',
  },
  competitive: {
    cap: 3,
    stopCondition: 'The specific claim being challenged is clear',
  },
  research: {
    cap: 3,
    stopCondition: 'You know their objective AND at least one key constraint or context factor',
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
      return `DECISION MODE — The user needs a concrete recommendation. You must know enough to give one.

Ask ${cap} questions covering these dimensions (highest-impact first):
1. BUDGET / PRICE RANGE — Without this, any recommendation could be completely wrong for them
2. PRIMARY USE CASE — What will this actually be used for day-to-day?
3. MUST-HAVES vs. NICE-TO-HAVES — What are their non-negotiables?
4. CURRENT SITUATION — What do they have now? What are they replacing or upgrading from?
5. RISK / PRIORITY — Do they prioritise reliability, performance, value, prestige?

OPTION RULES — these are critical:
- Budget: always use SPECIFIC dollar ranges spanning low to high for this exact domain
  e.g. cars: "$15k–$25k", "$25k–$40k", "$40k–$60k", "$60k+"
  e.g. software: "Under $50/mo", "$50–$200/mo", "$200–$500/mo", "Enterprise/custom"
- Use case: list REAL scenarios, not abstract categories
  e.g. cars: "Daily commuting under 30 miles", "Road trips & highway driving", "Family hauler with kids/cargo", "Weekend performance/fun"
- Must-haves: list CONCRETE features with real terms, not vague descriptors
- Never ask about options/choices the user already stated in their query

Aim for ${cap} questions. Only ask fewer if the user already stated those dimensions clearly.`

    case 'action':
      return `ACTION MODE — The user needs a personalized step-by-step plan. You must know their starting point and constraints.

Ask ${cap} questions covering these dimensions (highest-impact first):
1. CURRENT STARTING POINT — Where are they RIGHT NOW? This determines step 1.
2. AVAILABLE RESOURCES — Budget + time per week. Both shape the entire plan.
3. SPECIFIC GOAL / SUCCESS METRIC — What does "done" look like? By when?
4. BIGGEST OBSTACLE — What's the hardest part for them specifically?
5. CONSTRAINTS — Hard limits: tools they can't use, things they must avoid

OPTION RULES:
- Starting point: span beginner → advanced with realistic milestones for this domain
- Timeline: specific durations ("Within 2 weeks", "1–3 months", "3–6 months", "6–12 months", "No hard deadline")
- Budget: SPECIFIC dollar ranges appropriate to this domain
- Goals: concrete, measurable outcomes — not vague aspirations

Aim for ${cap} questions. Only ask fewer if starting point + goal + timeline are already stated.`

    case 'explainer':
      return `EXPLAINER MODE — The explanation needs to match their background perfectly.

Ask up to ${cap} questions:
1. BACKGROUND LEVEL — This is ALWAYS worth asking. Shapes every analogy, term, and depth level.
   Use EXACTLY these 4 options:
   - "Complete beginner — no prior knowledge"
   - "Some familiarity — I know the basics"
   - "Intermediate — I understand the core concepts"
   - "Advanced — looking for nuance and edge cases"

2. SPECIFIC ANGLE (if the topic is broad) — What aspect matters most to them?
   Generate 4 concrete, topic-specific options (not generic categories)

Only ask the angle question if the topic is genuinely multi-faceted. If it's narrow, just ask background.`

    case 'perspectives':
      return `PERSPECTIVES MODE — The user wants to understand a debate or contested topic.

Ask up to ${cap} questions:
1. STAKES — Why do they need this? Are they making a decision, writing/arguing something, or just curious?
   Options: "Making a personal decision based on this", "Forming my own informed opinion", "Academic research or debate", "Understanding both sides before choosing a side"

2. SPECIFIC DIMENSION — Which aspect of this debate is most relevant to them?
   Generate 4 concrete options specific to THIS exact debate topic.

3. CURRENT LEAN — Do they already have a leaning they want challenged, or are they genuinely open?
   Options: "I lean [one side] but want to understand the counterarguments", "I'm genuinely undecided", "I think I know my view but want it stress-tested", "I disagree with mainstream opinion and want support"

OPTION RULES: All options must be tailored to the specific topic — no generic placeholders.`

    case 'intelligence':
      return `INTELLIGENCE MODE — The user wants current, specific insights on a topic.

Ask up to ${cap} questions:
1. SPECIFIC ANGLE / LENS — Which dimension of this topic matters most?
   Generate 4 concrete, domain-specific angles (sector, geography, time horizon, stakeholder type)

2. USE CASE — Why do they need this intelligence right now?
   Options: "Evaluating an investment or financial decision", "Professional context — work/industry research", "Academic or journalistic research", "Personal curiosity and general understanding"

3. RECENCY vs. DEPTH — What balance do they need?
   Options: "Latest developments in the past 3–6 months", "The past 1–2 years of meaningful change", "Historical trajectory to understand the present", "Both current state AND historical context"

OPTION RULES: Angle options must be specific to the exact topic, not generic categories.`

    case 'competitive':
      return `COMPETITIVE / CHALLENGE MODE — The user wants something pressure-tested or critically examined.

Ask up to ${cap} questions:
1. SPECIFIC CLAIM OR POSITION — What exactly needs to be challenged?
   Generate 4 concrete options based on the most common positions on this exact topic.

2. STAKES — What decision or action depends on this analysis?
   Options: "I'm about to commit to this — want to find flaws first", "I'm debating someone who holds this view", "I'm writing/presenting and need the strongest counterarguments", "I want to understand if this is as good/bad as people say"

3. ANGLE OF ATTACK — Which type of weakness to focus on?
   Options: "Factual errors or misleading statistics", "Hidden assumptions that might not hold", "What gets left out of this argument", "Real-world failure cases and exceptions"

OPTION RULES: Claim options must reflect REAL positions people actually hold on this topic.`

    case 'forecast':
      return `FORECAST MODE — The user wants forward-looking predictions, not current state.

Ask up to ${cap} questions:
1. TIME HORIZON — How far out are they looking?
   Options: "Next 3–6 months", "1–2 years out", "3–5 year view", "Long-term / 5–10 years"

2. DECISION CONTEXT — What will they DO with this forecast? This shapes which signals matter.
   Options: "Investment or financial decision", "Business strategy or product roadmap", "Career or personal planning", "General intelligence and curiosity"

3. ANGLE (if the topic is broad) — Which aspect of this topic's future matters most?
   Generate 4 concrete, topic-specific options.

OPTION RULES: Time horizon and decision context options should always be specific. Angle options must be tailored to the exact topic.

Only ask fewer if the time horizon and decision context are already stated in the query.`

    default: // research + general
      return `RESEARCH MODE — The user wants thorough, expert-level information.

Ask up to ${cap} questions covering the highest-impact unknowns:
1. SPECIFIC OBJECTIVE — What will they DO with this information?
   Generate 4 concrete, realistic end-goals specific to this exact topic.

2. RELEVANT CONTEXT — What's their current situation that shapes what's relevant?
   Generate 4 concrete options covering the most common real-world contexts for this topic.

3. CONSTRAINTS / SCOPE — What limits the answer? Budget, geography, timeline, expertise level?
   Generate 4 concrete options with real values/ranges for this domain.

OPTION RULES:
- Every option must be a REAL scenario or value — no vague tiers or catch-alls
- Use actual numbers, names, and domain-specific terminology
- Span the full realistic range — don't cluster options together
- Phrase like a knowledgeable friend, not a form field

Aim for ${cap} questions. Fewer only if objective and context are already clear from the query.`
  }
}
