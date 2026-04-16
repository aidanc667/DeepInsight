// ─── Lightweight UI-only persona data ─────────────────────────────────────────
// Safe to import in 'use client' components.
// Does NOT include question trees or full description paragraphs — those stay
// server-side in ai/prompts/expert-personas.ts and are only used in API routes.

export type Domain =
  | 'automotive' | 'finance' | 'real_estate' | 'health' | 'technology'
  | 'legal' | 'career' | 'nutrition' | 'business' | 'travel'
  | 'education' | 'parenting' | 'general'

export interface PersonaUI {
  title: string
  loadingMessages: string[]
}

// ─── Compact keyword map (detection only — no full keyword arrays needed) ──────
// Uses the top 6-8 most distinctive keywords per domain for fast client-side detection.
const KEYWORDS: [Domain, string[]][] = [
  ['automotive',  ['car', 'vehicle', 'truck', 'suv', 'ev', 'hybrid', 'toyota', 'honda', 'ford', 'tesla', 'bmw', 'lease', 'mpg']],
  ['finance',     ['invest', 'stock', 'portfolio', '401k', 'ira', 'crypto', 'bitcoin', 'etf', 'dividend', 'wealth', 'trading', 'market']],
  ['real_estate', ['home', 'house', 'mortgage', 'rent', 'property', 'real estate', 'apartment', 'condo', 'zillow', 'down payment']],
  ['health',      ['health', 'doctor', 'symptom', 'medical', 'treatment', 'medication', 'disease', 'diagnosis', 'cancer', 'diabetes']],
  ['technology',  ['software', 'code', 'programming', 'app', 'laptop', 'ai', 'api', 'cloud', 'developer', 'startup tech', 'gpu']],
  ['legal',       ['law', 'legal', 'contract', 'attorney', 'lawsuit', 'compliance', 'patent', 'llc', 'divorce', 'visa', 'immigration']],
  ['career',      ['job', 'career', 'resume', 'salary', 'interview', 'promotion', 'linkedin', 'negotiate', 'job search', 'recruiter']],
  ['nutrition',   ['diet', 'nutrition', 'protein', 'calorie', 'weight loss', 'supplement', 'vitamin', 'macro', 'food', 'meal']],
  ['business',    ['startup', 'business', 'revenue', 'growth', 'marketing', 'product', 'saas', 'investor', 'funding', 'b2b']],
  ['travel',      ['travel', 'trip', 'flight', 'hotel', 'vacation', 'passport', 'visa trip', 'cruise', 'resort', 'airbnb']],
  ['education',   ['college', 'university', 'degree', 'school', 'mba', 'tuition', 'scholarship', 'admission', 'gre', 'student loan']],
  ['parenting',   ['kid', 'child', 'baby', 'toddler', 'teen', 'parenting', 'infant', 'pediatric', 'adhd', 'daycare', 'preschool']],
]

export function detectDomainUI(prompt: string): Domain {
  const lower = prompt.toLowerCase()
  let best: Domain = 'general'
  let bestScore = 0
  for (const [domain, kws] of KEYWORDS) {
    const score = kws.filter(k => lower.includes(k)).length
    if (score > bestScore) { bestScore = score; best = domain }
  }
  return best
}

// ─── UI persona data (title + loading messages only) ──────────────────────────
export const PERSONA_UI: Record<Domain, PersonaUI> = {
  automotive: {
    title: 'Automotive Engineer & Consumer Advocate',
    loadingMessages: [
      'Analyzing 2026 model year reliability data…',
      'Cross-referencing JD Power & Consumer Reports…',
      'Evaluating total cost of ownership…',
      'Comparing manufacturer incentives & APR deals…',
      'Reviewing owner satisfaction scores…',
      'Assessing resale value projections…',
    ],
  },
  finance: {
    title: 'CFA & Portfolio Strategist',
    loadingMessages: [
      'Analyzing current market conditions…',
      'Evaluating risk-adjusted return scenarios…',
      'Reviewing economic indicators & rate environment…',
      'Modeling portfolio allocation strategies…',
      'Assessing tax efficiency implications…',
      'Cross-referencing Vanguard, Fidelity, and Schwab data…',
    ],
  },
  real_estate: {
    title: 'Real Estate Investor & Market Analyst',
    loadingMessages: [
      'Analyzing current housing market conditions…',
      'Evaluating mortgage rate environment…',
      'Reviewing comparable transactions & pricing…',
      'Assessing neighborhood trends & appreciation…',
      'Modeling cash flow and ROI scenarios…',
      'Cross-referencing Zillow, Redfin, and MLS data…',
    ],
  },
  health: {
    title: 'Board-Certified Physician & Researcher',
    loadingMessages: [
      'Reviewing current clinical guidelines…',
      'Cross-referencing PubMed and NEJM studies…',
      'Analyzing evidence strength & study quality…',
      'Evaluating treatment efficacy data…',
      'Checking FDA approvals & safety profiles…',
      'Reviewing expert consensus & meta-analyses…',
    ],
  },
  technology: {
    title: 'Principal Engineer & Tech Strategist',
    loadingMessages: [
      'Analyzing technical documentation & benchmarks…',
      'Reviewing GitHub activity & community health…',
      'Evaluating performance characteristics…',
      'Cross-referencing Stack Overflow & engineering blogs…',
      'Assessing production readiness & adoption…',
      'Reviewing security vulnerabilities & patches…',
    ],
  },
  legal: {
    title: 'Senior Attorney & Legal Strategist',
    loadingMessages: [
      'Reviewing relevant case law & statutes…',
      'Analyzing regulatory compliance requirements…',
      'Evaluating contractual risk factors…',
      'Cross-referencing jurisdiction-specific rules…',
      'Assessing legal precedents & outcomes…',
      'Reviewing recent legislative changes…',
    ],
  },
  career: {
    title: 'Executive Career Coach & Talent Strategist',
    loadingMessages: [
      'Analyzing compensation benchmarks & Levels.fyi data…',
      'Reviewing job market demand signals…',
      'Evaluating skill gap analysis by role…',
      'Cross-referencing LinkedIn hiring trends…',
      'Assessing career trajectory patterns…',
      'Reviewing industry growth forecasts…',
    ],
  },
  nutrition: {
    title: 'Registered Dietitian & Performance Specialist',
    loadingMessages: [
      'Reviewing clinical nutrition research…',
      'Analyzing macronutrient optimization data…',
      'Cross-referencing metabolic studies…',
      'Evaluating evidence quality & study design…',
      'Reviewing current dietary guidelines…',
      'Assessing practical implementation strategies…',
    ],
  },
  business: {
    title: 'Serial Entrepreneur & Growth Strategist',
    loadingMessages: [
      'Analyzing market size & competitive landscape…',
      'Reviewing successful case studies & patterns…',
      'Evaluating unit economics & growth levers…',
      'Cross-referencing industry benchmarks…',
      'Assessing product-market fit signals…',
      'Reviewing funding & exit data from Crunchbase…',
    ],
  },
  travel: {
    title: 'Expert Travel Consultant & Destination Specialist',
    loadingMessages: [
      'Analyzing seasonal travel patterns & pricing…',
      'Reviewing current entry requirements & visas…',
      'Evaluating accommodation options & value…',
      'Cross-referencing traveler reviews & ratings…',
      'Assessing points & miles optimization…',
      'Reviewing safety, health & logistics data…',
    ],
  },
  education: {
    title: 'Education Consultant & Academic Strategist',
    loadingMessages: [
      'Analyzing admissions data & acceptance rates…',
      'Reviewing program rankings & outcomes…',
      'Evaluating ROI & earning potential data…',
      'Cross-referencing employment & placement stats…',
      'Assessing financial aid & scholarship options…',
      'Reviewing curriculum quality & faculty research…',
    ],
  },
  parenting: {
    title: 'Child Development Expert & Family Psychologist',
    loadingMessages: [
      'Reviewing pediatric research & guidelines…',
      'Analyzing developmental psychology studies…',
      'Cross-referencing AAP recommendations…',
      'Evaluating evidence-based interventions…',
      'Reviewing child behavioral research…',
      'Assessing family dynamics & context factors…',
    ],
  },
  general: {
    title: 'Elite Research Analyst',
    loadingMessages: [
      'Analyzing research quality & source credibility…',
      'Cross-referencing multiple expert perspectives…',
      'Evaluating evidence strength & confidence…',
      'Identifying key insights & implications…',
      'Reviewing recent developments & trends…',
      'Synthesizing findings into actionable intelligence…',
    ],
  },
}

export function getPersonaUI(prompt: string): PersonaUI {
  return PERSONA_UI[detectDomainUI(prompt)]
}
