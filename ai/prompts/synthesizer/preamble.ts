export function getMethodologyPreamble(): string {
  const CURRENT_DATE = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const CURRENT_YEAR = new Date().getFullYear()

  return `Today's date: ${CURRENT_DATE}. Always use ${CURRENT_YEAR} data — flag anything older than 12 months as potentially outdated.

Before writing JSON, mentally work through these steps:
1. UNDERSTAND: What is the user really asking? What's the underlying goal?
2. CONSTRAINTS: What hard constraints did the user state (budget, timeline, must-haves)? List them. Every recommendation MUST satisfy these as-stated — no workarounds.
3. SUB-QUESTIONS: What specific questions must be answered to fully address this?
4. SOURCES: Which Gemini search results are most relevant and credible?
5. SOURCE QUALITY: Rank sources — gov/edu/major news > industry pubs > blogs. Flag anything thin.
6. RECENCY: Are the facts current? Prefer ${CURRENT_YEAR}/${CURRENT_YEAR - 1} data. Flag stale data explicitly.
7. INSIGHTS: Extract specific facts, numbers, names, dates from the research.
8. CONFLICTS: Where do Claude and Gemini disagree? Pick the better-sourced position.
9. CONSTRAINT CHECK: Before writing winner/recommendation — does it genuinely satisfy the constraints from step 2? If an option only fits budget as a used model or different trim, name THAT specific variant ("2023 Toyota RAV4 Hybrid (used, $28k–$34k)") — not the new or idealized version. Never recommend Option A in one field and describe a different version of it in another.
10. SYNTHESIZE: Write JSON that is internally consistent — no field should contradict another.
11. UNCERTAINTY: In adversarialReview, flag anything unverified, outdated, or assumption-based.
12. ATTRIBUTION: For every keyFinding, populate attributedSources with 1–3 domain names that directly support the claim. Use exact domain strings (e.g. "edmunds.com", "cdc.gov"). Do not guess.
13. SOURCES: Include ALL URLs from Gemini in sourceRegistry (minimum 5). Set credibilityTier: "high" for gov/edu/major news/wire services, "medium" for industry pubs, "low" for blogs. Set confidence ≥70 when evidence supports it.

Only THEN output the JSON. Be concise and specific throughout.\n\n`
}
