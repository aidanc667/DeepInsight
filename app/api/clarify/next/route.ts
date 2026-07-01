import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { EXPERT_PERSONAS } from '@/ai/prompts/expert-personas'
import { getModeCap, getModeStopCondition } from '@/ai/config/modes'
import type { DomainName } from '@/ai/schemas'

export const maxDuration = 15

interface HistoryEntry {
  question: string
  answer: string
}

function buildSystem(prompt: string, historyLength: number, mode: string, domain?: string): string {
  const persona = EXPERT_PERSONAS[(domain as DomainName) ?? 'general'] ?? EXPERT_PERSONAS.general
  const { title, description } = persona
  const hardCap = getModeCap(mode)
  const stopCondition = getModeStopCondition(mode)

  return `${description}

A user came to you — a ${title} — with this request. You have collected ${historyLength} answer(s) so far. Decide: is there one more critical piece of context you need, or do you have enough to produce a genuinely personalized, expert-level answer?

WHEN TO ASK ANOTHER QUESTION:
- You are missing a dimension that would meaningfully change your recommendation
- The answer would be noticeably more useful with this information
- You have NOT yet hit the ${hardCap}-question cap

WHEN TO STOP:
- ${stopCondition}
- You have reached ${hardCap} answers — never exceed this
- The remaining unknowns are minor details that wouldn't change the core recommendation
- The query is purely factual or educational

${historyLength === 0
    ? 'This is the FIRST follow-up. Identify the single most important gap — the one that would most change your expert recommendation.'
    : historyLength === 1
    ? 'You have 1 answer. Is there one more critical dimension missing? Only ask if it would materially change the output.'
    : `You have ${historyLength} answers. Stop unless there is a genuinely critical gap that would significantly change your recommendation.`
}

Output ONLY valid JSON — one of two formats:

FORMAT A — ask a question:
{
  "done": false,
  "question": {
    "question": "Specific, direct expert question?",
    "options": ["Concrete option 1", "Concrete option 2", "Concrete option 3", "Concrete option 4"],
    "fieldTargeted": "unique_snake_case_id",
    "why": "One sentence: how this changes your expert analysis"
  }
}

FORMAT B — you have enough context:
{ "done": true, "reason": "One sentence why you have enough to proceed" }

QUESTION QUALITY RULES:
- Ask like a world-class expert talking to a client — direct, not bureaucratic
- Never start with "Could you tell me" or "Can you share" — just ask directly
- The question must address a dimension NOT already covered in answers so far

OPTION QUALITY RULES:
- Specific with real numbers and domain-realistic values — not vague tiers
- Mutually exclusive — no overlap between options
- Span the full realistic range — don't cluster in the middle
- 4 options max. Never include "Other", "It depends", "Flexible", or catch-alls
- Phrase naturally, like a knowledgeable friend would say it`
}

export async function POST(req: Request) {
  try {
    const { prompt: rawPrompt, history = [], mode = 'research', domain } = await req.json() as {
      prompt: string
      history: HistoryEntry[]
      mode?: string
      domain?: string
    }

    if (!rawPrompt?.trim()) {
      return Response.json({ done: true, reason: 'No prompt' })
    }
    const prompt = rawPrompt.trim().slice(0, 2000).replace(/[\x00-\x1F\x7F]/g, '')

    const hardCap = getModeCap(mode)
    if (history.length >= hardCap) {
      return Response.json({ done: true, reason: 'Question limit reached' })
    }

    const historyBlock = history.length > 0
      ? `\nAnswers collected so far:\n${history.map((h, i) => `${i + 1}. Q: ${h.question}\n   A: ${h.answer}`).join('\n')}`
      : ''

    const result = await generateText({
      model: anthropic('claude-haiku-4-5'),
      system: buildSystem(prompt, history.length, mode, domain),
      prompt: `User's request: "${prompt}"${historyBlock}\n\nWhat is the single most important question to ask next to give a better, more personalized answer — or do you have enough context?`,
      maxOutputTokens: 400,
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
          options:       parsed.question.options.map(String).slice(0, 5),
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
