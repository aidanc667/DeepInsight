import type { QueryMode } from '@/ai/schemas'
import { DECISION_SYSTEM }      from './decision'
import { RESEARCH_SYSTEM }      from './research'
import { INTELLIGENCE_SYSTEM }  from './intelligence'
import { PERSPECTIVES_SYSTEM }  from './perspectives'
import { CHALLENGE_SYSTEM }     from './challenge'
import { ACTION_SYSTEM }        from './action'
import { EXPLAINER_SYSTEM }     from './explainer'

export function getSynthesizerSystem(mode: QueryMode | string): string {
  switch (mode) {
    case 'decision':     return DECISION_SYSTEM
    case 'intelligence': return INTELLIGENCE_SYSTEM
    case 'perspectives': return PERSPECTIVES_SYSTEM
    case 'competitive':  return CHALLENGE_SYSTEM
    case 'action':       return ACTION_SYSTEM
    case 'explainer':    return EXPLAINER_SYSTEM
    default:             return RESEARCH_SYSTEM
  }
}

export function buildSynthesizerPrompt(
  mode: string,
  userQuery: string,
  claudeText: string,
  geminiText: string,
  annotatedSourcesBlock: string,
  clarificationContext?: string,
  priorContextBlock?: string,
): string {
  const clarificationBlock = clarificationContext
    ? `\n\nUser provided context:\n${clarificationContext}`
    : ''

  const priorBlock = priorContextBlock ?? ''

  const claudeTrimmed = claudeText.length > 1200
    ? claudeText.slice(0, 1200) + '\n[…truncated]'
    : claudeText
  const geminiTrimmed = geminiText.length > 2000
    ? geminiText.slice(0, 2000) + '\n[…truncated]'
    : geminiText

  const researchBlock = `[CLAUDE — deep reasoning & analysis]\n${claudeTrimmed}\n\n[GEMINI — live web search]\n${geminiTrimmed}`

  return `QUERY: ${userQuery}${clarificationBlock}${priorBlock}${annotatedSourcesBlock}

${researchBlock}

Produce concise JSON for "${mode}" mode. Be specific, not verbose. Weight high-credibility sources (★★★★+) more heavily in your synthesis.`
}
