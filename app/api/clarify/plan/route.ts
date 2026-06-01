import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { getExpertPersona } from '@/ai/prompts/expert-personas'
import { getModeCap, getModeInstructions, inferMode } from '@/ai/config/modes'

export const maxDuration = 12

// Hard fast-path for obvious definitional/factual lookups — skip the model call entirely.
const PURELY_FACTUAL = /^(what is |what are |who is |who are |when did |when was |where is |where are |how does |how do |how did |explain |define |describe |tell me about |why does |why is |why are )/i

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
    const cap = getModeCap(mode)
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
      maxOutputTokens: cap > 3 ? 500 : 350,
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
