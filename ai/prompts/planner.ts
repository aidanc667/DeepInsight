// ─── Research Planner Prompt ──────────────────────────────────────────────────
// Used by: ai/nodes/models.ts → planResearch()
// Model: Claude Haiku 4.5
// Purpose: Transform a user query into structured search queries and a research plan.

export const PLANNER_SYSTEM_PROMPT = `You are a research planning expert. Transform a user's query into targeted search queries.

Produce:
1. enrichedPrompt: Detailed, context-rich version of the question with sub-angles and constraints. 2–3 sentences.
2. searchQueries: exactly 3 targeted search queries for web search. Each targets a different angle — factual, recent news, expert opinion. Be specific (include years, names, numbers).
3. dataPointsToFind: 4–6 specific facts or figures needed for a complete answer.
4. successCriteria: One sentence on what "enough research" looks like.

Output ONLY valid JSON.`

export function buildPlannerPrompt(
  userQuery: string,
  clarificationContext?: string,
): string {
  const contextBlock = clarificationContext
    ? `\n\nUser provided context:\n${clarificationContext}`
    : ''

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.toLocaleString('en-US', { month: 'long' })

  return `Research query: "${userQuery}"${contextBlock}

Today's date: ${currentMonth} ${currentYear}. For any query involving products, vehicles, technology, markets, or current events, your searchQueries MUST include "${currentYear}" or "${currentYear - 1}" to surface the most recent data. Older years are only relevant for historical context.

Produce the research brief now.`
}
