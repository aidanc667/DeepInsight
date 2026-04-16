// ─── Research Route Handler ───────────────────────────────────────────────────
// Thin entry point — delegates all orchestration to ai/graphs/research-pipeline.ts
// See that file for the full multi-phase pipeline (classify → plan → search → synthesize).

import { runResearchPipeline } from '@/ai/graphs/research-pipeline'

export const maxDuration = 120

export async function POST(req: Request) {
  const body = await req.json()

  if (!body.prompt?.trim()) {
    return Response.json({ error: 'Prompt is required' }, { status: 400 })
  }

  return runResearchPipeline(body)
}
