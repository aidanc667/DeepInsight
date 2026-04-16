import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { getExpertPersona } from '@/ai/prompts/expert-personas'

export const maxDuration = 10

interface HistoryEntry {
  question: string
  answer: string
}

function buildSystem(prompt: string, historyLength: number): string {
  const { title, description } = getExpertPersona(prompt)

  return `${description}

A user came to you — a ${title} — with this request. Decide: do you need one more question, or do you have enough to produce a highly useful, personalized answer?

Bias toward stopping. Only ask if the missing information would meaningfully change the research direction or output.

${historyLength === 0
  ? 'This is the first follow-up question — identify the single highest-impact unknown.'
  : `You have ${historyLength} answer(s) already. Stop unless there is a critical gap that would materially change the output.`
}

Priority dimensions (ask only from these, in order):
1. OBJECTIVE — What are they ultimately trying to achieve?
2. CONTEXT — What is their current situation or starting point?
3. CONSTRAINTS — Budget, timeline, or hard limits?
4. TIME HORIZON — When does this need to happen?
5. SUCCESS CRITERIA — How will they know the answer worked?
6. RISK TOLERANCE — Conservative or aggressive approach?

Output ONLY valid JSON — one of two formats:

FORMAT A — ask a question:
{
  "done": false,
  "question": {
    "question": "Specific, expert question?",
    "options": ["Concrete option 1", "Concrete option 2", "Concrete option 3", "Concrete option 4"],
    "fieldTargeted": "unique_snake_case_id",
    "why": "One sentence: how this changes your expert analysis"
  }
}

FORMAT B — you have enough context:
{ "done": true, "reason": "One sentence why you have enough to proceed" }

STOP (done: true) when ANY of these are true:
- You know the user's objective AND at least one key constraint or context factor — 2 good answers often suffice
- 3+ answers collected — rarely need more than this
- The query is purely factual or educational — stop immediately
- The remaining unknowns would not meaningfully change the research direction

OPTIONS rules:
- Concrete and specific with real numbers: "Under $20k", "$20–35k", "$35–50k", "$50–75k", "$75k+"
- Span the complete realistic range: entry-level → mid-range → premium → top-tier
- 4–5 options per question (5 for budget/price ranges)
- Do NOT include "Other", "It depends", "Flexible", or generic catch-alls

NEVER ask about:
- Topics already answered in history
- Vague things like "how much detail do you want"
- Anything that wouldn't change the research angle`
}

export async function POST(req: Request) {
  try {
    const { prompt, history = [] } = await req.json() as { prompt: string; history: HistoryEntry[] }

    if (!prompt?.trim()) {
      return Response.json({ done: true, reason: 'No prompt' })
    }

    const historyBlock = history.length > 0
      ? `\nAnswers so far:\n${history.map((h, i) => `${i + 1}. ${h.question} → ${h.answer}`).join('\n')}`
      : ''

    const result = await generateText({
      model: anthropic('claude-haiku-4-5'),
      system: buildSystem(prompt, history.length),
      prompt: `User's request: "${prompt}"${historyBlock}\n\nWhat is the single most important question to ask next, or do you have enough context?`,
      maxOutputTokens: 250,
    })

    const text  = result.text.trim()
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return Response.json({ done: true, reason: 'Parse error' })

    const parsed = JSON.parse(match[0])

    if (parsed.done === true) {
      return Response.json({ done: true, reason: parsed.reason ?? 'Enough context' })
    }

    if (parsed.question?.question && Array.isArray(parsed.question.options)) {
      return Response.json({
        done: false,
        question: {
          question:      String(parsed.question.question),
          options:       parsed.question.options.map(String).slice(0, 6),
          fieldTargeted: String(parsed.question.fieldTargeted ?? `q_${history.length + 1}`),
          why:           String(parsed.question.why ?? ''),
        },
      })
    }

    return Response.json({ done: true, reason: 'Malformed response' })
  } catch (err) {
    console.error('[/api/clarify/next]', err)
    return Response.json({ done: true, reason: 'Error — proceeding to research' })
  }
}
