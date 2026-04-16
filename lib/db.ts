// ─── Neon Serverless DB Connection ────────────────────────────────────────────
// DATABASE_URL must be set in .env.local:
//   DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
// Run the schema once: psql $DATABASE_URL -f lib/db/schema.sql

import { neon } from '@neondatabase/serverless'

// Lazy — only called at request time, never at build time.
// This prevents next build from crashing before env vars are provisioned.
export function getSql() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set')
  return neon(process.env.DATABASE_URL)
}
