import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { getExpertPersona } from '@/ai/prompts/expert-personas'

export const maxDuration = 10

interface HistoryEntry {
  question: string
  answer: string
}

function getHardCap(mode: string): number {
  if (mode === 'decision' || mode === 'action') return 5
  if (mode === 'explainer') return 2
  return 3
}

function buildSystem(prompt: string, historyLength: number, mode: string): string {
  const { title, description } = getExpertPersona(prompt)
  const hardCap = getHardCap(mode)

  const modeStopConditions: Record<string, string> = {
    decision:     'You know the specific options being compared AND at least one key constraint (budget, must-haves)',
    action:       'You know their starting point AND available resources or timeline',
    explainer:    'You know their background level — that alone shapes the entire explanation',
    perspectives: 'The debate topic and their stakes are clear',
    intelligence: 'The angle and use case are clear',
    competitive:  'The specific claim being challenged is clear',
    research:     'You know their objective AND at least one key constraint or context factor',
  }

  const stopCondition = modeStopConditions[mode] ?? modeStopConditions.research

  return `${description}

A user came to you — a ${title} — with this request. Decide: do you need one more question, or do you have enough to produce a highly useful, personalized answer?

Bias strongly toward stopping. Only ask if the missing information would materially change the output.

${historyLength === 0
    ? 'This is the first follow-up question — identify the single highest-impact unknown.'
    : `You have ${historyLength} answer(s) already. Stop unless there is a critical gap that would materially change the output.`
}

STOP immediately (done: true) when ANY of these are true:
- ${stopCondition}
- ${hardCap}+ answers collected — never ask more than ${hardCap} total
- The query is purely factual or educational
- The remaining unknowns would not meaningfully change the research direction

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

OPTIONS rules:
- Concrete and specific with real numbers and domain-realistic ranges
- 4–5 options per question
- Do NOT include "Other", "It depends", "Flexible", or generic catch-alls

NEVER ask about:
- Topics already answered in history
- Vague things like "how much detail do you want"
- Anything that wouldn't change the research angle`
}

export async function POST(req: Request) {
  try {
    const { prompt: rawPrompt, history = [], mode = 'research' } = await req.json() as {
      prompt: string
      history: HistoryEntry[]
      mode?: string
    }

    if (!rawPrompt?.trim()) {
      return Response.json({ done: true, reason: 'No prompt' })
    }
    const prompt = rawPrompt.trim().slice(0, 2000).replace(/[\x00-\x1F\x7F]/g, '')

    // Enforce hard cap — stop immediately if already at limit
    const hardCap = getHardCap(mode)
    if (history.length >= hardCap) {
      return Response.json({ done: true, reason: 'Question limit reached' })
    }

    const historyBlock = history.length > 0
      ? `\nAnswers so far:\n${history.map((h, i) => `${i + 1}. ${h.question} → ${h.answer}`).join('\n')}`
      : ''

    const result = await generateText({
      model: anthropic('claude-haiku-4-5'),
      system: buildSystem(prompt, history.length, mode),
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
