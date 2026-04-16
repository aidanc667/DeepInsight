// ─── Research Memory ──────────────────────────────────────────────────────────
// Persists research sessions in localStorage and surfaces related prior sessions
// for context injection into the synthesizer prompt.
// Used by: app/page.tsx (save/load) and ai/graphs/research-pipeline.ts (inject context)

export interface ResearchSession {
  id: string
  timestamp: number
  query: string
  mode: string
  summary: string
  confidence: number
  sourceCount: number
  iterationCount: number
}

const STORAGE_KEY = 'apex_research_history'
const MAX_SESSIONS = 20

export function saveSession(session: Omit<ResearchSession, 'id'>): void {
  if (typeof window === 'undefined') return
  try {
    const sessions = loadSessions()
    const newSession: ResearchSession = {
      ...session,
      id: Math.random().toString(36).slice(2) + Date.now().toString(36),
    }
    const updated = [newSession, ...sessions].slice(0, MAX_SESSIONS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // localStorage may be unavailable (private browsing, quota exceeded)
  }
}

export function loadSessions(): ResearchSession[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ResearchSession[]) : []
  } catch {
    return []
  }
}

export function clearHistory(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    //
  }
}

/** Return sessions with overlapping keywords — used for context injection */
export function findRelatedSessions(
  query: string,
  sessions: ResearchSession[],
  limit = 3,
): ResearchSession[] {
  const stopWords = new Set(['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all',
    'can', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his',
    'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'did',
    'does', 'what', 'when', 'with', 'this', 'that', 'have', 'from'])

  const queryWords = query
    .toLowerCase()
    .split(/\W+/)
    .filter(w => w.length > 3 && !stopWords.has(w))

  if (queryWords.length === 0) return []

  return sessions
    .map(s => {
      const text = (s.query + ' ' + s.summary).toLowerCase()
      const score = queryWords.filter(w => text.includes(w)).length
      return { session: s, score }
    })
    .filter(({ score }) => score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ session }) => session)
}

/** Format related sessions for injecting into synthesizer prompt */
export function buildPriorContextBlock(related: ResearchSession[]): string {
  if (related.length === 0) return ''
  const items = related
    .map(s => `- "${s.query}" (${s.mode}, ${Math.round((Date.now() - s.timestamp) / 60000)}min ago): ${s.summary}`)
    .join('\n')
  return `\n\nPrior related research by this user:\n${items}\nBuild on this context where relevant — avoid repeating what they already know.`
}
