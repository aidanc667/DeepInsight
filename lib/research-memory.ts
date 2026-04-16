// ─── Client-side Research Memory ──────────────────────────────────────────────
// Wraps /api/history for use in client components and page.tsx.
// Pure utility functions (findRelatedSessions, buildPriorContextBlock) remain
// in ai/services/research-memory.ts for server-side pipeline use.

export type { ResearchSession } from '@/ai/services/research-memory'
export { findRelatedSessions, buildPriorContextBlock } from '@/ai/services/research-memory'

import type { ResearchSession } from '@/ai/services/research-memory'

/** Save a completed session to Neon via API route. Fire-and-forget safe. */
export async function saveSession(session: Omit<ResearchSession, 'id'>): Promise<void> {
  try {
    await fetch('/api/history', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(session),
    })
  } catch {
    // non-critical — silently ignore
  }
}

/** Load recent sessions from Neon via API route. Returns [] on error. */
export async function loadSessions(): Promise<ResearchSession[]> {
  try {
    const res = await fetch('/api/history')
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

/** Clear all sessions via API route. */
export async function clearHistory(): Promise<void> {
  try {
    await fetch('/api/history', { method: 'DELETE' })
  } catch {
    //
  }
}
