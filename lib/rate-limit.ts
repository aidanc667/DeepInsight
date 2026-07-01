// Persistent rate limiter backed by Neon PostgreSQL.
// Falls back to allow-all when DATABASE_URL is not set (local dev without DB).

import { neon } from '@neondatabase/serverless'

const LIMIT     = 40
const WINDOW_MS = 24 * 60 * 60 * 1000  // 24 hours

let tableReady = false

export async function checkRateLimit(key: string): Promise<boolean> {
  const url = process.env.DATABASE_URL
  if (!url) return true  // local dev without DB — allow

  const sql = neon(url)

  if (!tableReady) {
    await sql`
      CREATE TABLE IF NOT EXISTS rate_limits (
        user_key     TEXT   PRIMARY KEY,
        count        INT    NOT NULL DEFAULT 0,
        window_start BIGINT NOT NULL
      )
    `
    tableReady = true
  }

  const now         = Date.now()
  const windowStart = now - WINDOW_MS

  // Single upsert: reset window if expired, otherwise increment.
  // Returns new count so we can check the limit in one round-trip.
  const rows = await sql`
    INSERT INTO rate_limits (user_key, count, window_start)
    VALUES (${key}, 1, ${now})
    ON CONFLICT (user_key) DO UPDATE SET
      count        = CASE
                       WHEN rate_limits.window_start < ${windowStart} THEN 1
                       ELSE rate_limits.count + 1
                     END,
      window_start = CASE
                       WHEN rate_limits.window_start < ${windowStart} THEN ${now}
                       ELSE rate_limits.window_start
                     END
    RETURNING count
  `

  const count = (rows[0] as { count: number } | undefined)?.count ?? 1
  return count <= LIMIT
}
