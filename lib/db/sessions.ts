// ─── DB Session CRUD ──────────────────────────────────────────────────────────
// Server-only. All functions use the Neon connection from lib/db.ts.

import { getSql } from '@/lib/db'
import type { ResearchSession } from '@/ai/services/research-memory'

const MAX_SESSIONS = 20

export async function dbSaveSession(
  session: Omit<ResearchSession, 'id'>,
  userId: string,
): Promise<void> {
  const sql = getSql()
  const id = Math.random().toString(36).slice(2) + Date.now().toString(36)
  await sql`
    INSERT INTO research_sessions
      (id, user_id, timestamp, query, mode, summary, confidence, source_count, iteration_count)
    VALUES
      (${id}, ${userId}, ${session.timestamp}, ${session.query}, ${session.mode},
       ${session.summary}, ${session.confidence}, ${session.sourceCount},
       ${session.iterationCount})
    ON CONFLICT (id) DO NOTHING
  `
  // Prune old rows beyond MAX_SESSIONS per user
  await sql`
    DELETE FROM research_sessions
    WHERE user_id = ${userId}
    AND id IN (
      SELECT id FROM research_sessions
      WHERE user_id = ${userId}
      ORDER BY timestamp DESC
      OFFSET ${MAX_SESSIONS}
    )
  `
}

export async function dbLoadSessions(userId: string, limit = 20): Promise<ResearchSession[]> {
  const sql = getSql()
  const rows = await sql`
    SELECT id, timestamp, query, mode, summary, confidence, source_count, iteration_count
    FROM research_sessions
    WHERE user_id = ${userId}
    ORDER BY timestamp DESC
    LIMIT ${limit}
  `
  return rows.map(r => ({
    id:             String(r.id),
    timestamp:      Number(r.timestamp),
    query:          String(r.query),
    mode:           String(r.mode),
    summary:        String(r.summary),
    confidence:     Number(r.confidence),
    sourceCount:    Number(r.source_count),
    iterationCount: Number(r.iteration_count),
  }))
}

export async function dbClearSessions(userId: string): Promise<void> {
  const sql = getSql()
  await sql`DELETE FROM research_sessions WHERE user_id = ${userId}`
}
