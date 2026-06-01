const CURRENT_DATE = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
const CURRENT_YEAR = new Date().getFullYear()

export const METHODOLOGY_PREAMBLE = `Today's date: ${CURRENT_DATE}. Always use ${CURRENT_YEAR} data — flag anything older than 12 months as potentially outdated.

Before writing JSON, mentally work through these steps:
1. UNDERSTAND: What is the user really asking? What's the underlying goal?
2. SUB-QUESTIONS: What specific questions must be answered to fully address this?
3. SOURCES: Which Gemini search results are most relevant and credible?
4. SOURCE QUALITY: Rank sources — gov/edu/major news > industry pubs > blogs. Flag anything thin.
5. RECENCY: Are the facts current? Prefer ${CURRENT_YEAR}/${CURRENT_YEAR - 1} data. Flag stale data explicitly.
6. INSIGHTS: Extract specific facts, numbers, names, dates from the research.
7. CONFLICTS: Where do Claude and Gemini disagree? Pick the better-sourced position.
8. SYNTHESIZE: Write the JSON with sharp, specific, data-backed, up-to-date content.
9. UNCERTAINTY: In adversarialReview, flag anything unverified, outdated, or assumption-based.
10. ATTRIBUTION: For every keyFinding, populate attributedSources with 1–3 domain names from the source list that directly support that specific claim. Use the exact domain string (e.g. "edmunds.com", "cdc.gov"). Only include domains that actually back the claim — do not guess.

Only THEN output the JSON. Be concise and specific throughout.\n\n`
