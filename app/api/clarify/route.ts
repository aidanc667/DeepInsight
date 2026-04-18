import { generateText, Output } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { GatekeeperResultSchema } from '@/ai/schemas'
import { GATEKEEPER_SYSTEM_PROMPT } from '@/ai/prompts/gatekeeper'

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()

    if (!prompt?.trim()) {
      return Response.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const result = await generateText({
      model: anthropic('claude-haiku-4-5'),
      system: GATEKEEPER_SYSTEM_PROMPT,
      prompt: `Analyze this research prompt: "${prompt}"`,
      output: Output.object({ schema: GatekeeperResultSchema }),
      maxOutputTokens: 400,
    })

    return Response.json(result.output)
  } catch (err) {
    console.error('[/api/clarify]', err)
    // On gatekeeper failure, fall through to proceed so research isn't blocked
    return Response.json({ proceed: true, confidenceScore: 1, questions: [] })
  }
}
