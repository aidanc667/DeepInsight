// ─── Domain Detection & Expert Persona System ─────────────────────────────────
// Server-side only. Contains full persona descriptions injected into AI prompts.
// Used by: app/api/clarify/plan/route.ts, app/api/clarify/next/route.ts,
//          ai/prompts/synthesizer.ts
//
// Do NOT import in 'use client' components — use ai/prompts/expert-personas-ui.ts
// for lightweight client-side domain detection instead.

export type Domain =
  | 'automotive'
  | 'finance'
  | 'real_estate'
  | 'health'
  | 'technology'
  | 'legal'
  | 'career'
  | 'nutrition'
  | 'business'
  | 'travel'
  | 'education'
  | 'parenting'
  | 'general'

// ─── Domain keyword map ────────────────────────────────────────────────────────

const DOMAIN_KEYWORDS: Record<Domain, string[]> = {
  automotive: [
    'car', 'vehicle', 'truck', 'suv', 'sedan', 'crossover', 'van', 'minivan',
    'ev', 'electric vehicle', 'hybrid', 'drive', 'buy a car', 'lease', 'mpg',
    'horsepower', 'torque', 'toyota', 'honda', 'ford', 'chevy', 'bmw', 'audi',
    'mercedes', 'tesla', 'rivian', 'subaru', 'mazda', 'hyundai', 'kia', 'vw',
    'volkswagen', 'nissan', 'dodge', 'jeep', 'auto', 'dealership', 'financing',
    'mileage', 'reliability', 'powertrain', 'transmission',
  ],
  finance: [
    'invest', 'stock', 'portfolio', 'retirement', '401k', 'ira', 'roth',
    'crypto', 'bitcoin', 'ethereum', 'money', 'wealth', 'dividend', 'etf',
    'mutual fund', 'bond', 'index fund', 's&p', 'nasdaq', 'dow', 'equity',
    'asset', 'hedge fund', 'trading', 'brokerage', 'vanguard', 'fidelity',
    'interest rate', 'inflation', 'compound interest', 'net worth',
    'financial planning', 'debt', 'budget', 'saving', 'passive income',
    'tax loss', 'capital gains', 'market',
  ],
  real_estate: [
    'home', 'house', 'mortgage', 'rent', 'buy property', 'real estate',
    'apartment', 'condo', 'property', 'housing', 'landlord', 'tenant',
    'down payment', 'escrow', 'closing costs', 'zillow', 'realtor',
    'listing', 'foreclosure', 'hoa', 'neighborhood', 'zoning', 'refi',
    'refinance', 'equity home', 'flip', 'rental income', 'airbnb',
  ],
  health: [
    'health', 'doctor', 'symptom', 'medical', 'treatment', 'prescription',
    'medication', 'disease', 'diagnosis', 'hospital', 'surgery', 'therapy',
    'mental health', 'anxiety', 'depression', 'chronic', 'pain', 'cancer',
    'diabetes', 'heart', 'blood pressure', 'cholesterol', 'immune',
    'vaccine', 'clinical trial', 'fda', 'cdc', 'nih', 'pubmed',
    'supplement', 'vitamin', 'wellness', 'preventive',
  ],
  technology: [
    'software', 'hardware', 'code', 'programming', 'app', 'laptop', 'phone',
    'computer', 'ai', 'machine learning', 'api', 'cloud', 'aws', 'azure',
    'database', 'javascript', 'python', 'react', 'node', 'typescript',
    'framework', 'saas', 'startup tech', 'gpu', 'cpu', 'ram', 'storage',
    'developer', 'engineer', 'devops', 'kubernetes', 'docker', 'linux',
    'cybersecurity', 'blockchain', 'llm', 'gpt', 'openai', 'anthropic',
    'smartphone', 'tablet', 'iphone', 'android', 'tech stack',
  ],
  legal: [
    'law', 'legal', 'contract', 'attorney', 'lawyer', 'court', 'rights',
    'lawsuit', 'sue', 'litigation', 'compliance', 'regulation', 'patent',
    'trademark', 'copyright', 'nda', 'incorporate', 'llc', 'corporation',
    'employment law', 'immigration', 'visa', 'citizenship', 'divorce',
    'custody', 'estate planning', 'will', 'trust', 'probate',
  ],
  career: [
    'job', 'career', 'resume', 'salary', 'promotion', 'interview', 'hiring',
    'linkedin', 'work', 'profession', 'occupation', 'employer', 'employee',
    'negotiate', 'raise', 'quit', 'laid off', 'fired', 'remote work',
    'hybrid work', 'manager', 'leadership', 'executive', 'startup career',
    'switching careers', 'career change', 'job search', 'recruiter',
    'headhunter', 'performance review', 'compensation',
  ],
  nutrition: [
    'diet', 'food', 'nutrition', 'calorie', 'protein', 'carb', 'fat',
    'weight loss', 'gain muscle', 'keto', 'paleo', 'vegan', 'vegetarian',
    'meal prep', 'fasting', 'intermittent fasting', 'macros', 'fiber',
    'gut health', 'microbiome', 'probiotic', 'superfood', 'organic',
    'workout nutrition', 'pre-workout', 'post-workout', 'hydration',
    'eating', 'obesity', 'metabolic', 'glucose',
  ],
  business: [
    'startup', 'business', 'entrepreneur', 'revenue', 'marketing', 'b2b',
    'b2c', 'saas business', 'product market fit', 'growth', 'scale',
    'fundraise', 'vc', 'venture capital', 'angel investor', 'pitch deck',
    'customer acquisition', 'churn', 'mrr', 'arr', 'ltv', 'cac',
    'ecommerce', 'brand', 'launch', 'go-to-market', 'competitive moat',
    'operations', 'supply chain', 'profit margin', 'valuation', 'exit',
  ],
  travel: [
    'travel', 'flight', 'hotel', 'vacation', 'trip', 'destination', 'visa',
    'passport', 'airbnb travel', 'itinerary', 'tourist', 'backpack',
    'cruise', 'resort', 'beach', 'mountain', 'europe', 'asia', 'america',
    'africa', 'australia', 'airline', 'points', 'miles', 'travel hack',
    'budget travel', 'luxury travel', 'solo travel', 'road trip',
  ],
  education: [
    'college', 'university', 'degree', 'study', 'school', 'mba', 'course',
    'tuition', 'scholarship', 'admission', 'gpa', 'sat', 'act', 'gre',
    'gmat', 'lsat', 'mcat', 'online learning', 'bootcamp', 'certification',
    'phd', 'masters', 'bachelor', 'community college', 'ivy league',
    'transfer', 'financial aid', 'student loan', 'major', 'minor',
  ],
  parenting: [
    'kid', 'child', 'baby', 'toddler', 'teen', 'teenager', 'parent',
    'parenting', 'infant', 'newborn', 'pregnancy', 'breastfeed', 'sleep',
    'behavior', 'discipline', 'school age', 'development', 'pediatric',
    'autism', 'adhd', 'screen time', 'education child', 'college prep',
    'daycare', 'preschool', 'kindergarten', 'adolescent',
  ],
  general: [],
}

export function detectDomain(prompt: string): Domain {
  const lower = prompt.toLowerCase()
  let bestDomain: Domain = 'general'
  let bestScore = 0

  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS) as [Domain, string[]][]) {
    if (domain === 'general') continue
    const score = keywords.filter(kw => lower.includes(kw)).length
    if (score > bestScore) {
      bestScore = score
      bestDomain = domain
    }
  }

  return bestDomain
}

// ─── Expert personas ───────────────────────────────────────────────────────────

export interface ExpertPersona {
  title: string              // short label shown in UI
  description: string        // full persona injected into prompts
  loadingMessages: string[]  // rotating messages shown during loading
}

export const EXPERT_PERSONAS: Record<Domain, ExpertPersona> = {
  automotive: {
    title: 'Automotive Engineer & Consumer Advocate',
    description: `You are a top 0.1% automotive engineer and consumer advocate with 20 years of expertise. You have personally evaluated over 5,000 vehicles, written for top automotive publications, and advised buyers across every budget and use case. You deeply understand total cost of ownership, long-term reliability data from JD Power and Consumer Reports, the real differences between trim levels, and which manufacturer incentives are actually worth taking. You have strong opinions based on evidence — not brand loyalty.`,
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
    description: `You are a top 0.1% financial advisor — a CFA charterholder and CFP with 20+ years managing portfolios ranging from $100k to $100M+. You have guided clients through multiple market cycles, recessions, and bull runs. You deeply understand tax-efficient investing, sequence-of-returns risk, factor investing, and behavioral finance. You give specific, actionable advice based on the client's actual situation — not generic disclaimers. You always address risk tolerance and time horizon before making recommendations.`,
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
    description: `You are a top 0.1% real estate expert — an investor, licensed broker, and market analyst who has personally closed thousands of transactions across residential and commercial properties. You understand cap rates, cash-on-cash returns, mortgage structuring, and local market dynamics intimately. You know exactly when to buy vs. rent, how to evaluate neighborhoods, and how to identify properties before they peak. You give honest assessments based on numbers, not emotion.`,
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
    description: `You are a top 0.1% medical expert — a board-certified physician and clinical researcher with deep expertise in evidence-based medicine, current clinical guidelines, and patient outcomes. You have reviewed thousands of studies and treat patients across multiple specialties. You explain medical concepts clearly without dumbing them down, distinguish between strong evidence and preliminary findings, and always flag when professional medical evaluation is essential. You give substantive, specific information — not generic "see your doctor" deflections.`,
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
    description: `You are a top 0.1% technology expert — a principal engineer with 15+ years building systems at scale, deep expertise across multiple tech stacks, and a track record of advising both startups and Fortune 500 engineering teams. You understand architecture trade-offs at a deep level, know which technologies have staying power vs. hype, and give brutally honest assessments of tools, frameworks, and platforms based on real production experience.`,
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
    description: `You are a top 0.1% legal expert — a senior attorney with 20+ years of practice across contract law, litigation, corporate law, and regulatory compliance. You have advised clients ranging from individuals to multinational corporations. You explain legal concepts clearly, identify the key risks most people overlook, and distinguish between what the law says and what actually happens in practice. You always flag when specific legal counsel is required vs. when self-education is sufficient.`,
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
    description: `You are a top 0.1% career expert — an executive career coach and former talent acquisition director who has placed thousands of professionals, negotiated hundreds of compensation packages, and advised on career strategy at companies from Series A startups to Fortune 100 corporations. You know exactly what hiring managers look for, how compensation benchmarks actually work, and what separates candidates who get promoted from those who plateau.`,
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
    description: `You are a top 0.1% nutrition expert — a registered dietitian, performance nutrition specialist, and researcher who has worked with professional athletes, clinical patients, and everyday people optimizing their health. You deeply understand macronutrient science, evidence-based dietary interventions, the difference between peer-reviewed research and supplement marketing, and how to make nutrition strategies actually sustainable. You give specific, practical advice grounded in the best available evidence.`,
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
    description: `You are a top 0.1% business expert — a serial entrepreneur and growth strategist who has founded and scaled multiple companies to $100M+ in revenue, advised hundreds of startups, and sat on the boards of venture-backed companies. You understand what actually drives growth vs. vanity metrics, how to achieve product-market fit, what investors really care about, and how to build defensible moats. You give direct, no-BS advice based on what works in the real world.`,
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
    description: `You are a top 0.1% travel expert — a destination specialist and luxury travel consultant who has visited 150+ countries, curated experiences for high-net-worth clients, and written extensively on travel strategy, points optimization, and destination intelligence. You know the insider details that don't appear in guidebooks, how to maximize value across all budget levels, and exactly when and how to go somewhere to get the best experience possible.`,
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
    description: `You are a top 0.1% education expert — an independent education consultant and academic strategist who has guided thousands of students through college admissions, graduate school applications, and educational ROI decisions. You deeply understand what admissions officers actually look for, how to evaluate educational value vs. cost, which credentials have real labor market value, and how to make strategic decisions in an increasingly complex educational landscape.`,
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
    description: `You are a top 0.1% child development expert — a pediatric psychologist and family specialist with expertise in developmental stages, behavioral science, and evidence-based parenting approaches. You have worked with thousands of families across diverse backgrounds and challenges. You give specific, research-backed guidance while acknowledging that every child and family is unique. You distinguish clearly between well-supported findings and parenting trends that lack evidence.`,
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
    description: `You are a top 0.1% research analyst — a polymath with deep expertise across multiple disciplines, trained in rigorous evidence evaluation, critical thinking, and synthesizing complex information into clear, actionable intelligence. You have advised government agencies, corporations, and individuals on high-stakes decisions. You go beyond surface-level answers to identify what truly matters, what's uncertain, and what the most likely best path forward is.`,
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

export function getExpertPersona(prompt: string): ExpertPersona {
  const domain = detectDomain(prompt)
  return EXPERT_PERSONAS[domain]
}
