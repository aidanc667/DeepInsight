import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { EXPERT_PERSONAS } from '@/ai/prompts/expert-personas'
import { getModeCap, getModeInstructions, inferMode } from '@/ai/config/modes'
import type { DomainName } from '@/ai/schemas'

export const maxDuration = 20

export async function POST(req: Request) {
  try {
    const { prompt: rawPrompt, mode: modeHint, domain } = await req.json() as { prompt: string; mode?: string; domain?: string }
    if (!rawPrompt?.trim()) return Response.json({ expertTitle: '', questions: [] })
    const prompt = rawPrompt.trim().slice(0, 2000).replace(/[\x00-\x1F\x7F]/g, '')

    const persona = EXPERT_PERSONAS[(domain as DomainName) ?? 'general'] ?? EXPERT_PERSONAS.general
    const { title, description } = persona
    const mode = modeHint ?? inferMode(prompt)
    const cap = getModeCap(mode)
    const modeInstructions = getModeInstructions(mode, cap)

    const result = await generateText({
      model: anthropic('claude-haiku-4-5'),
      system: `${description}

You are generating targeted clarifying questions to get the context needed to produce a highly personalized expert answer.

YOUR JOB: Identify what information is MISSING from the user's query that would most change your recommendation. Be a brilliant expert who knows exactly what they need to know before giving advice.

CRITICAL MINDSET:
- Think: "If I don't know X, my answer will be generic and potentially wrong for this person"
- A vague query like "what car should I get" is missing budget, use case, lifestyle — you MUST ask
- Only skip questions if the query is already specific enough to give a personalized answer
- Each question must unlock a meaningfully different research direction

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

QUESTION QUALITY RULES:
- Ask the question a world-class expert would ask — direct, specific, no fluff
- The question itself should be phrased naturally, like an expert talking to a client
- Never start with "Could you tell me" or "Can you share" — just ask directly
- Cover distinct dimensions — never ask about the same axis twice

OPTION QUALITY RULES:
- Options must be specific, concrete, and mutually exclusive
- Use real numbers: "$15k–$25k" not "Budget-friendly"; "2–3 hours/week" not "Part-time"
- Use real domain choices: "Toyota RAV4 / Honda CR-V tier" not "Mid-size SUV"
- Span the full realistic range for this topic — don't cluster in the middle
- Phrase like a knowledgeable friend would say it — natural, not corporate
- 4 options maximum. No "Other", "It depends", "I'm flexible", or any vague catch-all`,
      prompt: `User's question: "${prompt}"\n\nGenerate ${cap === 2 ? '0–2' : `2–${cap}`} strategic clarifying questions. Return fewer only if the query is already highly specific. Return empty array only if every key dimension is already stated.`,
      maxOutputTokens: 900,
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
        options:       Array.isArray(q.options) ? q.options.map(String).slice(0, 5) : [],
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
