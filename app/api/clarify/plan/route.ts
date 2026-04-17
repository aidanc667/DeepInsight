import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { getExpertPersona } from '@/ai/prompts/expert-personas'

export const maxDuration = 12

// Hard fast-path for obvious definitional/factual lookups — skip the model call entirely.
const PURELY_FACTUAL = /^(what is |what are |who is |who are |when did |when was |where is |where are |how does |how do |how did |explain |define |describe |tell me about |why does |why is |why are )/i

// Lightweight mode detection for when no mode hint is passed (deep research path).
// The full classifier runs in parallel — this is just enough to pick the right priority list.
function inferMode(prompt: string): string {
  if (/\b(should i|should we|which.*(better|best|right)|what.*(should|recommend|buy|get|choose|pick|use)|help me (choose|decide|pick|select)|best .*(for me|option|choice)|vs\.?\s|versus)\b/i.test(prompt)) return 'decision'
  if (/\b(how (do i|to|can i)|step.?by.?step|plan to|roadmap|how to (launch|build|create|start|set up|implement|run))\b/i.test(prompt)) return 'action'
  if (/\b(explain|understand|how does|why does|analogy|break.?down|eli5|in simple terms|for (a )?beginner)\b/i.test(prompt)) return 'explainer'
  if (/\b(pros and cons|arguments? (for|against)|different (views|perspectives|sides)|debate|both sides|case for|case against)\b/i.test(prompt)) return 'perspectives'
  if (/\b(latest|current state|what.?s happening|trend|news about|state of|in 202[0-9])\b/i.test(prompt)) return 'intelligence'
  if (/\b(vs\.?\s|versus|compare|difference between|better than|x vs y)\b/i.test(prompt)) return 'competitive'
  return 'research'
}

// ─── Mode-specific question caps ─────────────────────────────────────────────
// AXIOM + FORGE need more context to personalise high-stakes output.
// SAGE needs almost none — explaining a concept doesn't require much context.
function getQuestionCap(mode: string): number {
  if (mode === 'decision' || mode === 'action') return 5
  if (mode === 'explainer') return 2
  return 3
}

// ─── Mode-aware priority dimensions ──────────────────────────────────────────
function getModeInstructions(mode: string, cap: number): string {
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

export async function POST(req: Request) {
  try {
    const { prompt: rawPrompt, mode: modeHint } = await req.json() as { prompt: string; mode?: string }
    if (!rawPrompt?.trim()) return Response.json({ expertTitle: '', questions: [] })
    const prompt = rawPrompt.trim().slice(0, 2000).replace(/[\x00-\x1F\x7F]/g, '')

    // Fast path — pure factual lookup needs no clarification
    if (PURELY_FACTUAL.test(prompt.trim())) {
      return Response.json({ expertTitle: '', questions: [] })
    }

    const { title, description } = getExpertPersona(prompt)
    const mode = modeHint ?? inferMode(prompt)
    const cap = getQuestionCap(mode)
    const modeInstructions = getModeInstructions(mode, cap)

    const result = await generateText({
      model: anthropic('claude-haiku-4-5'),
      system: `${description}

You are helping a user get a precisely targeted expert answer. Only ask questions when the answer would meaningfully change the research direction.

First ask: can you already infer the user's key context from the query itself? If so, return an empty questions array — zero questions is the right answer when the query is already clear.

${modeInstructions}

Output ONLY valid JSON — nothing else:
{
  "questions": [
    {
      "question": "Your most important question here?",
      "options": ["Specific option 1", "Specific option 2", "Specific option 3", "Specific option 4"],
      "fieldTargeted": "snake_case_field_name",
      "why": "One sentence: how this changes your recommendation"
    }
  ]
}

UNIVERSAL RULES:
- Only ask if not knowing the answer would significantly change the research output
- Priority order: highest-impact unknown first, each covering a different dimension
- Do NOT include: "Other", "It depends", "Flexible", "Not sure", or any vague catch-all
- Do NOT ask about anything already stated in the user's message
- Do NOT ask about the same dimension twice`,
      prompt: `User's question: "${prompt}"\n\nGenerate 0–${cap} strategic clarifying questions, or return an empty array if the query is already clear enough to research directly.`,
      maxOutputTokens: cap > 3 ? 900 : 600,
    })

    const match = result.text.trim().match(/\{[\s\S]*\}/)
    if (!match) {
      console.warn('[clarify/plan] no JSON found in response, returning empty')
      return Response.json({ expertTitle: title, questions: [] })
    }

    const parsed = JSON.parse(match[0])
    const questions = (Array.isArray(parsed.questions) ? parsed.questions : [])
      .slice(0, cap)
      .map((q: Record<string, unknown>) => ({
        question:      String(q.question      ?? ''),
        options:       Array.isArray(q.options) ? q.options.map(String).slice(0, 6) : [],
        fieldTargeted: String(q.fieldTargeted  ?? `q_${Math.random().toString(36).slice(2, 6)}`),
        why:           String(q.why            ?? ''),
      }))
      .filter((q: { question: string; options: string[] }) => q.question && q.options.length >= 2)

    return Response.json({ expertTitle: title, questions })
  } catch (err) {
    console.error('[clarify/plan]', err)
    return Response.json({ expertTitle: '', questions: [], error: true }, { status: 200 })
  }
}
