// ─── Research Route Handler ───────────────────────────────────────────────────
// Thin entry point — delegates all orchestration to ai/graphs/research-pipeline.ts
// See that file for the full multi-phase pipeline (classify → plan → search → synthesize).

import { auth } from '@clerk/nextjs/server'
import { runResearchPipeline } from '@/ai/graphs/research-pipeline'

export const maxDuration = 120

// In-memory rate limiter: 20 research runs per user per 24 h.
// Resets on cold start — good enough without an external store.
const LIMIT = 20
const WINDOW_MS = 24 * 60 * 60 * 1000
const counts = new Map<string, { n: number; windowStart: number }>()

function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const entry = counts.get(key)
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    counts.set(key, { n: 1, windowStart: now })
    return true
  }
  if (entry.n >= LIMIT) return false
  entry.n++
  return true
}

export async function POST(req: Request) {
  const { userId } = await auth()
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'anon'
  const rateLimitKey = userId ?? ip

  if (!checkRateLimit(rateLimitKey)) {
    return Response.json(
      { error: 'Daily research limit reached (20/day). Please try again tomorrow.' },
      { status: 429 },
    )
  }

  const body = await req.json()

  if (!body.prompt?.trim()) {
    return Response.json({ error: 'Prompt is required' }, { status: 400 })
  }

  return runResearchPipeline(body)
}
