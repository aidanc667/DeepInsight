import { generateText, Output } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { QueryClassifierSchema } from '@/ai/schemas'
import { CLASSIFIER_SYSTEM_PROMPT, buildClassifierPrompt } from '@/ai/prompts/classifier'

export const maxDuration = 15

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()
    if (!prompt?.trim()) {
      return Response.json({ mode: 'research', confidence: 50, reasoning: 'empty prompt', modeLabel: 'Deep Research' })
    }

    const result = await generateText({
      model: anthropic('claude-haiku-4-5'),
      system: CLASSIFIER_SYSTEM_PROMPT,
      prompt: buildClassifierPrompt(prompt),
      output: Output.object({ schema: QueryClassifierSchema }),
      maxOutputTokens: 250,
    })

    return Response.json(result.output)
  } catch (err) {
    console.error('[/api/classify]', err)
    return Response.json({ mode: 'research', confidence: 50, reasoning: 'classifier failed', modeLabel: 'Deep Research' })
  }
}
