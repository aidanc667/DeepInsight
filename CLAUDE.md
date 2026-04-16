@AGENTS.md

# Elite Research Agent — CLAUDE.md

## What This App Does

- Takes a user question, runs expert follow-up clarification (3–10 questions), then executes a two-model adversarial pipeline
- Gemini Flash handles live web search (real URLs, quotes, dates); Claude handles deep synthesis with source attribution
- Outputs structured expert-grade reports across 8 named research modes (AXIOM, NOVA, CIPHER, ECHO, TITAN, SAGE, FORGE, VERITAS)

## Stack

- **Next.js 16 App Router** + Route Handlers
- **AI SDK v6** (`ai`, `@ai-sdk/anthropic`, `@ai-sdk/google`, `@ai-sdk/react`) — `useObject` for streaming structured JSON
- **Framer Motion v12** (`motion/react`), **Tailwind CSS + shadcn/ui** (dark, `oklch`)

## Model Rules — Critical

**Always use hyphens in model IDs. Dots cause 404s.**

| Role | Model |
|---|---|
| Classify, clarify, quality gate | `anthropic('claude-haiku-4-5')` |
| Synthesis | `anthropic('claude-sonnet-4-5')` |
| Live web search | `google('gemini-2.0-flash-exp')` + `google.tools.googleSearch({})` |

**Never use Vercel AI Gateway** (`ai-gateway.vercel.sh`) — import SDKs directly.

## Critical Constraints

1. Model IDs use **hyphens only**: `claude-haiku-4-5`, `claude-sonnet-4-5`
2. `useObject` streams partial JSON — all rendering must handle `undefined` fields gracefully
3. `maxDuration` required on every AI route handler (Vercel timeout)
4. `Promise.race` with 1s timeout on `extractSourceSnippets` — never block synthesis
5. No hardcoded question trees — expert AI generates questions dynamically via `getExpertPersona()`
6. `selectedAgent` must always sync with `setDetectedMode`

## Further Reading

For full pipeline diagram, clarification flow, source attribution, agent cards, output modes, and key file map — see **AGENTS.md**.
