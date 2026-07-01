// ─── Research Route Handler ───────────────────────────────────────────────────
// Thin entry point — delegates all orchestration to ai/graphs/research-pipeline.ts
// See that file for the full multi-phase pipeline (classify → plan → search → synthesize).

import { auth } from '@clerk/nextjs/server'
import { runResearchPipeline } from '@/ai/graphs/research-pipeline'
import { checkRateLimit } from '@/lib/rate-limit'

export const maxDuration = 120

export async function POST(req: Request) {
  const { userId } = await auth()

  // middleware.ts enforces auth, so userId is always present here.
  // Fall back to IP only as a belt-and-suspenders safety net.
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'anon'
  const rateLimitKey = userId ?? ip

  const allowed = await checkRateLimit(rateLimitKey)
  if (!allowed) {
    return Response.json(
      { error: "You've hit the daily research limit (40/day). Please try again tomorrow." },
      { status: 429 },
    )
  }

  const body = await req.json()

  if (!body.prompt?.trim()) {
    return Response.json({ error: 'Prompt is required' }, { status: 400 })
  }

  return runResearchPipeline(body)
}
