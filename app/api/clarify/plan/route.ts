import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { getExpertPersona } from '@/ai/prompts/expert-personas'

export const maxDuration = 12

// Hard fast-path for obvious definitional/factual lookups — skip the model call entirely.
// The model prompt also returns [] for queries that are clear enough without these patterns.
const PURELY_FACTUAL = /^(what is |what are |who is |who are |when did |when was |where is |where are |how does |how do |how did |explain |define |describe |tell me about |why does |why is |why are )/i

export async function POST(req: Request) {
  try {
    const { prompt: rawPrompt } = await req.json() as { prompt: string }
    if (!rawPrompt?.trim()) return Response.json({ expertTitle: '', questions: [] })
    const prompt = rawPrompt.trim().slice(0, 2000).replace(/[\x00-\x1F\x7F]/g, '')

    // Fast path — pure factual lookup needs no clarification
    if (PURELY_FACTUAL.test(prompt.trim())) {
      return Response.json({ expertTitle: '', questions: [] })
    }

    const { title, description } = getExpertPersona(prompt)

    const result = await generateText({
      model: anthropic('claude-haiku-4-5'),
      system: `${description}

You are helping a user get a precisely targeted expert answer. Only ask questions when the answer would meaningfully change the research direction.

First ask: can you already infer this user's objective, context, and likely constraints from the query itself? If so, return an empty questions array — zero questions is the right answer when the query is already clear.

When questions ARE needed, prioritise these dimensions in order:
1. OBJECTIVE — What are they ultimately trying to achieve?
2. CONTEXT — What is their current situation or starting point?
3. CONSTRAINTS — Budget, timeline, or hard limits?
4. TIME HORIZON — When does this need to happen?
5. SUCCESS CRITERIA — How will they know the answer worked?
6. RISK TOLERANCE — Conservative or aggressive approach?

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

REQUIREMENTS:
- 0–3 questions maximum. Zero is correct when the query already implies the objective and context.
- Only ask if not knowing the answer would significantly change the research output
- Priority order: highest-impact unknown first, each covering a different dimension above
- Options must be TOP REAL-WORLD choices — specific and concrete with real numbers/scenarios
- Span the complete realistic range: entry-level → mid-range → premium → top-tier
- 4–5 options per question (5 for budget/price ranges)
- Do NOT include: "Other", "It depends", "Flexible", "Not sure", or any vague catch-all
- Do NOT ask about anything already stated in the user's message`,
      prompt: `User's question: "${prompt}"\n\nGenerate 0–3 strategic clarifying questions, or return an empty array if the query is already clear enough to research directly.`,
      maxOutputTokens: 600,
    })

    const match = result.text.trim().match(/\{[\s\S]*\}/)
    if (!match) {
      console.warn('[clarify/plan] no JSON found in response, returning empty')
      return Response.json({ expertTitle: title, questions: [] })
    }

    const parsed = JSON.parse(match[0])
    const questions = (Array.isArray(parsed.questions) ? parsed.questions : [])
      .slice(0, 5)
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
    // Don't silently fall through — return a flag so the client can handle it
    return Response.json({ expertTitle: '', questions: [], error: true }, { status: 200 })
  }
}
