import { auth } from '@clerk/nextjs/server'
import { dbSaveSession, dbLoadSessions, dbClearSessions } from '@/lib/db/sessions'
import type { ResearchSession } from '@/ai/services/research-memory'

export const runtime = 'nodejs'

/** GET /api/history — return most recent 20 sessions for the signed-in user */
export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json([], { status: 200 })
  try {
    const sessions = await dbLoadSessions(userId, 20)
    return Response.json(sessions)
  } catch (err) {
    console.error('[history GET]', err)
    return Response.json([], { status: 200 })
  }
}

/** POST /api/history — save a new session for the signed-in user */
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ ok: false }, { status: 401 })
  try {
    const session = await req.json() as Omit<ResearchSession, 'id'>
    if (!session?.query?.trim()) return Response.json({ ok: false }, { status: 400 })
    await dbSaveSession(session, userId)
    return Response.json({ ok: true })
  } catch (err) {
    console.error('[history POST]', err)
    return Response.json({ ok: false }, { status: 200 })
  }
}

/** DELETE /api/history — clear all sessions for the signed-in user */
export async function DELETE() {
  const { userId } = await auth()
  if (!userId) return Response.json({ ok: false }, { status: 401 })
  try {
    await dbClearSessions(userId)
    return Response.json({ ok: true })
  } catch (err) {
    console.error('[history DELETE]', err)
    return Response.json({ ok: false }, { status: 200 })
  }
}
