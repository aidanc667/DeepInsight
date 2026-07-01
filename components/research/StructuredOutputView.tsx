'use client'

import { toStructuredOutput } from '@/ai/output/structured-output'
import type { EliteResearchOutput } from '@/ai/schemas'
import { ExecutiveAnswer } from './views/ExecutiveAnswer'
import { DecisionBreakdown } from './views/DecisionBreakdown'
import { EvidenceAndInsights } from './views/EvidenceAndInsights'
import { Risks } from './views/Risks'
import { WhatThisMisses } from './views/WhatThisMisses'
import { ActionPlan } from './views/ActionPlan'
import { GoDeeperCard } from './views/GoDeeperCard'
import { Sources } from './views/Sources'
import { PerspectivesView } from './views/PerspectivesView'
import { ChallengeView } from './views/ChallengeView'
import { ExecutionView } from './views/ExecutionView'
import { AnalysisView } from './views/AnalysisView'
import { UnderstandingView } from './views/UnderstandingView'
import { ForecastView } from './views/ForecastView'

interface Props {
  data: Partial<EliteResearchOutput>
  isLoading: boolean
  onGoDeeper?: (question: string) => void
}

export function StructuredOutputView({ data, isLoading: _, onGoDeeper }: Props) {
  const s = toStructuredOutput(data)
  const mode = s.executiveAnswer.queryMode

  // Modes where Action Plan is meaningful (the model produces real next steps)
  const showActionPlan = mode !== 'action' && mode !== 'perspectives' && mode !== 'forecast'
  // Go Deeper shown for all modes
  const showGoDeeper = true

  return (
    <div className="space-y-3.5">
      {/* Universal: executive answer */}
      <ExecutiveAnswer data={s.executiveAnswer} delay={0} />

      {/* Mode-specific primary content */}
      {mode === 'decision' && s.decisionBreakdown && (
        <DecisionBreakdown data={s.decisionBreakdown} delay={0.02} />
      )}
      {mode === 'perspectives' && s.perspectives && (
        <PerspectivesView data={s.perspectives} delay={0.02} />
      )}
      {mode === 'competitive' && s.challenge && (
        <ChallengeView data={s.challenge} delay={0.02} />
      )}
      {mode === 'action' && s.execution && (
        <ExecutionView data={s.execution} delay={0.02} />
      )}
      {mode === 'intelligence' && s.analysis && (
        <AnalysisView data={s.analysis} delay={0.02} />
      )}
      {mode === 'research' && (
        <EvidenceAndInsights data={s.evidenceAndInsights} delay={0.03} />
      )}
      {mode === 'explainer' && s.understanding && (
        <UnderstandingView data={s.understanding} delay={0.03} />
      )}
      {mode === 'forecast' && s.forecast && (
        <ForecastView data={s.forecast} delay={0.02} />
      )}

      {/* Universal secondary — shown where relevant */}
      {s.risks.length > 0 && mode !== 'competitive' && mode !== 'action' && mode !== 'explainer' && (
        <Risks risks={s.risks} delay={0.05} />
      )}
      {mode !== 'competitive' && mode !== 'action' && mode !== 'explainer' && mode !== 'perspectives' && (
        <WhatThisMisses data={s.whatThisMisses} delay={0.07} />
      )}
      {showActionPlan && (
        <ActionPlan data={s.actionPlan} delay={0.08} />
      )}
      {showGoDeeper && (
        <GoDeeperCard data={s.goDeeper} delay={0.09} onGoDeeper={onGoDeeper} />
      )}

      {/* Sources: right-hand rail on desktop; inline at bottom on mobile */}
      {s.sources.length > 0 && (
        <div className="md:hidden">
          <Sources sources={s.sources} delay={0.1} />
        </div>
      )}
    </div>
  )
}
