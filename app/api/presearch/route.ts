import { callGemini } from '@/ai/nodes/models'

export const maxDuration = 30

// Pre-fires Gemini web search while the user is answering clarification questions.
// Results are passed back to /api/research to skip the Gemini call there.
export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()
    if (!prompt?.trim()) return Response.json(null)

    const result = await callGemini(prompt.trim().slice(0, 2000))
    return Response.json({ rawText: result.rawText, citations: result.citations })
  } catch {
    // Never block — if presearch fails the main pipeline falls back to its own Gemini call
    return Response.json(null)
  }
}
