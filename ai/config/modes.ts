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
  return 'research'
}

// ─── Mode-aware clarification question instructions ───────────────────────────
// Used by clarify/plan to shape what dimensions the expert asks about.
export function getModeInstructions(mode: string, cap: number): string {
  switch (mode) {
    case 'decision':
      return `When questions ARE needed, prioritise these dimensions in order:
1. OPTIONS — What specific choices are they deciding between? (only ask if not stated)
2. CONSTRAINTS — Budget, must-haves, absolute deal-breakers
3. CONTEXT — Current situation that shapes the decision (who it's for, what they already have)
4. SUCCESS CRITERIA — What does making the right choice look like in practice?
5. RISK TOLERANCE — How much downside can they absorb if the choice is wrong?

OPTION RULES for decision mode:
- For budget questions: use domain-specific realistic price ranges (e.g. car budget ≠ SaaS budget)
- For choice questions: list the actual leading real-world contenders, not generic tiers
- Always span the full realistic range for this specific domain

0–${cap} questions maximum. Zero is correct when the options and constraints are already clear.`

    case 'action':
      return `When questions ARE needed, prioritise these dimensions in order:
1. STARTING POINT — What have they already done? Where are they right now?
2. RESOURCES — Available budget, time per week, team size, existing skills
3. TIMELINE — When does this need to be done or live?
4. OBJECTIVE — What specific measurable outcome defines success?
5. CONSTRAINTS — Hard limits (technical, legal, financial, regulatory)

OPTION RULES for action mode:
- Starting point options should span realistic experience levels for this domain
- Timeline options should be specific and realistic: "2 weeks", "1–3 months", "3–6 months", "6–12 months", "No deadline"
- Resource options should reflect realistic ranges for this specific domain

0–${cap} questions maximum. Zero is correct when the starting point and objective are already clear.`

    case 'explainer':
      return `When questions ARE needed, prioritise these dimensions in order:
1. BACKGROUND — How familiar are they with this topic? This shapes depth, analogies, and assumed knowledge.
2. ANGLE — What specific aspect or application matters most to them?

For BACKGROUND, always use these 4 options exactly:
- "Complete beginner — no prior knowledge"
- "Some familiarity — know the basics"
- "Intermediate — understand core concepts"
- "Advanced — looking for nuance and depth"

For ANGLE, generate 4–5 concrete options specific to this exact topic.

0–${cap} questions maximum. If the topic is general enough to explain at a standard level, ask nothing.`

    case 'perspectives':
      return `When questions ARE needed, prioritise these dimensions in order:
1. STAKES — What's prompting this? Are they making a decision, or purely exploring the debate?
2. DIMENSION — Which specific aspect of this debate matters most to them?
3. POSITION — Do they currently lean one way, or are they genuinely undecided?

OPTION RULES: Options should be specific to this exact debate — not generic.

0–${cap} questions maximum. Zero is correct when the debate topic is clear and general exploration is the goal.`

    case 'intelligence':
      return `When questions ARE needed, prioritise these dimensions in order:
1. ANGLE — Which sector, region, or dimension of this topic matters most?
2. USE CASE — Why do they need this intelligence? (investment decision, academic research, professional context, general curiosity)
3. TIMEFRAME — Focus on recent developments, historical trajectory, or both?

OPTION RULES: Options for angle and sector should be specific to this exact topic.

0–${cap} questions maximum. Zero is correct when the topic is specific enough to research without further context.`

    case 'competitive':
      return `When questions ARE needed, prioritise these dimensions in order:
1. SPECIFIC CLAIM — What exactly is being challenged, pressure-tested, or scrutinised?
2. STAKES — What decision or action rides on this analysis?
3. ANGLE — Which type of risk or weakness is most important to explore?

OPTION RULES: Options should be concrete and specific to the subject being challenged.

0–${cap} questions maximum. Zero is correct when the claim and stakes are already clear.`

    default: // research + general
      return `When questions ARE needed, prioritise these dimensions in order:
1. OBJECTIVE — What are they ultimately trying to achieve with this research?
2. CONTEXT — What is their current situation or starting point?
3. CONSTRAINTS — Budget, timeline, or hard limits that shape the answer?

OPTION RULES:
- Options must be TOP REAL-WORLD choices — specific and concrete with real numbers/scenarios
- Span the complete realistic range for this specific domain
- 4–5 options per question

0–${cap} questions maximum. Zero is correct when the query already implies the objective and context.`
  }
}
