# DeepInsight

A multi-model AI research engine that routes queries across 7 specialized modes, chains three AI models in a 5-phase pipeline, and streams structured output with a source credibility scoring system.

[![CI](https://github.com/aidanc667/DeepInsight/actions/workflows/test.yml/badge.svg)](https://github.com/aidanc667/DeepInsight/actions)

---

## What it does

You type a question. Before the search runs, a gatekeeper detects whether the question is underspecified and generates targeted clarification questions — while simultaneously pre-firing the Gemini web search in the background so that time isn't wasted. Once you answer (or skip), the full pipeline runs: query classification, research planning, parallel model calls, source extraction, and structured synthesis streamed back to you in real time.

Every output includes a Trust Score — a composite of model agreement, source credibility, and recency — so you know how much to rely on the result.

---

## 7 Research Modes

Queries are automatically classified by Claude Haiku, or you can select a mode manually via the agent cards.

| Mode | Output |
|------|--------|
| **Decision** | Weighted decision scorecard with pros/cons per option |
| **Research** | Deep research report with key findings and source attribution |
| **Intelligence** | Market or competitive intelligence briefing |
| **Perspectives** | Multi-angle analysis of a contested topic |
| **Competitive** | Head-to-head competitive breakdown |
| **Explainer** | Clear concept explanation with analogies |
| **Action** | Step-by-step execution plan |

---

## Pipeline Architecture

```
Query
  │
  ├─ Phase 1 ──────────────────────────────────────── (parallel, both Haiku)
  │   ├─ Classify: detect query mode + confidence score
  │   └─ Plan: generate search queries, data points, success criteria
  │
  ├─ Phase 1.5 ─────────────────────────────────────── Context enrichment
  │   └─ Combine mode + plan + clarification into structured prompts
  │
  ├─ Phase 2 ──────────────────────────────────────── (parallel)
  │   ├─ Claude Haiku: structured deep reasoning (decision + competitive modes)
  │   └─ Gemini Flash: live Google Search with citation grounding (most modes)
  │
  ├─ Phase 2.5 ─────────────────────────────────────── Source extraction
  │   └─ Fetch top credible sources, extract clean text (1.5s cap, non-blocking)
  │
  └─ Phase 3 ──────────────────────────────────────── Streamed JSON output
      └─ Claude Sonnet: structured synthesis with source attribution
```

**Latency optimizations:**
- Gemini fires during clarification questions (pre-search), so the main pipeline reuses those results instead of calling it again — saves 3–8s on the critical path
- Source extraction races against a 1.5s timeout and never blocks synthesis
- Agent card mode bypasses the planner and uses Haiku (not Sonnet) for synthesis, cutting response time roughly in half
- Phase 1 classify + plan run in parallel; only one Haiku call is needed for each

---

## Trust Engine

After each pipeline run, a Trust Score (0–100) is calculated and shown alongside the output:

```
T = (0.4 × Agreement) + (0.3 × Citation Quality) + (0.2 × Recency) − Conflict Penalty
```

- **Agreement** — how many models contributed (1 model = 20, 2 = 60)
- **Citation Quality** — weighted average of source credibility (gov/edu = 1.0, social = 0.3)
- **Recency** — weighted average age of cited sources
- **Alert level** — green ≥ 65 | orange ≥ 40 | red < 40

Source credibility tiers (enforced in both the Gemini system prompt and the annotated source block fed to Sonnet):

| Tier | Examples |
|------|---------|
| Government | `.gov`, `.mil`, WHO, IMF |
| Academic | `.edu`, PubMed, arXiv, Nature, NEJM |
| Major News | Reuters, AP, BBC, WSJ, Bloomberg, FT |
| Industry | TechCrunch, HBR, McKinsey, Gartner |
| Social | Reddit, Twitter/X — deprioritized |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router), React 19, TypeScript strict |
| AI Orchestration | Vercel AI SDK v5 |
| Models | Claude Haiku 4.5 (classify/plan/analyze), Claude Sonnet 4.5 (synthesize), Gemini Flash 3 (live search) |
| Auth | Clerk |
| Database | Neon Postgres (research history) |
| Rate Limiting | Upstash Redis |
| Styling | Tailwind CSS v4, shadcn/ui |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 20+
- [Anthropic](https://console.anthropic.com) API key
- [Google AI Studio](https://aistudio.google.com) API key (for Gemini)
- [Clerk](https://clerk.com) account
- [Neon](https://neon.tech) Postgres database

### 1. Clone and install

```bash
git clone https://github.com/aidanc667/DeepInsight.git
cd DeepInsight
npm install
```

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
# Fill in all required values
```

### 3. Initialize the database

```bash
psql $DATABASE_URL -f lib/db/schema.sql
```

### 4. Start the dev server

```bash
npm run dev
# → http://localhost:3000
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | ✅ | Claude Haiku + Sonnet |
| `GOOGLE_GENERATIVE_AI_API_KEY` | ✅ | Gemini live web search |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk auth |
| `CLERK_SECRET_KEY` | ✅ | Clerk auth |
| `DATABASE_URL` | ✅ | Neon Postgres connection string |
| `UPSTASH_REDIS_REST_URL` | Optional | Rate limiting (10 req/10s per user). Skipped if not set |
| `UPSTASH_REDIS_REST_TOKEN` | Optional | Rate limiting |

---

## Project Structure

```
ai/
├── graphs/
│   └── research-pipeline.ts   # 5-phase pipeline orchestrator
├── nodes/
│   ├── models.ts               # Haiku/Gemini/Sonnet model call wrappers
│   └── context-enricher.ts     # Combines mode + plan + clarification
├── prompts/
│   ├── classifier.ts           # Query mode classification prompt
│   ├── planner.ts              # Search query generation prompt
│   ├── synthesizer.ts          # Mode-aware synthesis system prompts
│   ├── gatekeeper.ts           # Clarification question generation
│   └── expert-personas.ts      # Agent card persona prompts
├── schemas/
│   └── index.ts                # All Zod schemas + inferred TypeScript types
└── services/
    ├── trust-engine.ts         # Composite trust score calculation
    └── research-memory.ts      # Session context injection

app/
├── api/
│   ├── research/               # Main pipeline entry point (streaming NDJSON)
│   ├── clarify/                # Gatekeeper — generates clarification questions
│   ├── presearch/              # Pre-fires Gemini during clarification
│   ├── classify/               # Standalone query classification
│   └── history/                # Research session persistence (Clerk-authed)
├── page.tsx                    # Main research UI
└── layout.tsx                  # Root layout with Clerk provider

components/research/
├── ResearchOutput.tsx          # Main output container + trust badge
├── StructuredOutputView.tsx    # Mode-aware structured output renderer
├── AgentCards.tsx              # 7-mode agent card selector
├── ClarificationCard.tsx       # Gatekeeper clarification UI
├── TrustScoreBadge.tsx         # Trust score + alert level display
├── ResearchHistory.tsx         # Session history sidebar
└── ResearchLoadingScreen.tsx   # Animated pipeline progress indicator

lib/
├── db.ts                       # Neon client
├── db/
│   ├── schema.sql              # Postgres schema
│   └── sessions.ts             # Session CRUD
└── models.ts                   # Re-exports from ai/nodes/models.ts

proxy.ts                        # Clerk + Upstash rate limiting middleware
```

---

## Security

- All AI API calls are server-side only — `ANTHROPIC_API_KEY` and `GOOGLE_GENERATIVE_AI_API_KEY` are never exposed to the browser
- All `/api/` routes are protected by Clerk authentication middleware
- SSRF protection on source fetching — private/loopback/link-local IP ranges are blocked before any `fetch()` call
- Upstash rate limiting enforced at the middleware layer (10 requests / 10 seconds per user) on all AI routes
- Security headers set globally: `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `Permissions-Policy`
- Paywalled and social domains are skipped automatically during source extraction
