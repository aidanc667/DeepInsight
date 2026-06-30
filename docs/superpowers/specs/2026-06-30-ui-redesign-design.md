# DeepInsight UI Redesign — Design Spec

## Goal

Replace the dark navy + cyan glow aesthetic with a light document/dossier design that reads as a professional research platform. The value of this app is the report — the redesign puts typography and legibility first, decoration last.

## Non-goals

- No changes to AI pipeline, API routes, or data models
- No changes to auth flow (Clerk)
- No new research modes or features
- No mobile layout (desktop-first, responsive later)
- No dark mode toggle in this phase (can be added later)

---

## Design Decisions

| Decision | Choice |
|---|---|
| Theme | Light — warm off-white document background |
| Layout | Dark sidebar + light report center + right sources rail |
| Mode picker location | Sidebar list (all 8 modes with code tags) |
| Report body font | Georgia serif, 15px, line-height 1.78 |
| Heading font | System sans (Geist), heavy weight |
| Accent color | Ink navy `#1e3a5f` (replaces cyan) |
| Source metadata font | Geist Mono |
| Decorative effects to remove | All — cyan glow, dot-grid, card bevel, btn-glow |

---

## Color Palette

```
Background (report area):  #f8f5f0  — warm off-white, not pure white
Sidebar:                   #111827  — near-black navy
Sidebar border/dividers:   rgba(255,255,255,0.06)
Sources rail background:   #f0ece4  — slightly warmer than main
Sources rail border:       #e0dbd0

Text (body):               #1e293b  — dark slate, not pure black
Text (headings):           #111827
Text (muted):              #64748b
Text (labels/caps):        #94a3b8

Accent (links, active):    #1e3a5f  — ink navy
Accent (sidebar active):   rgba(255,255,255,0.08)
Accent text (sidebar):     #e2e8f0

Source high-cred badge:    bg #e8f0e8, text #1a4a1a, border #b8d8b8
Source med-cred badge:     bg #fef3cd, text #7a5a00
Source low-cred badge:     bg #f0ece4, text #64748b

Borders (main area):       #e8e2d9  — warm hairline, not grey
Trust badge (green):       bg #e8f0e8, text #2d6a2d, border #b8d8b8
```

No oklch for semantic colors — plain hex for predictability. Keep oklch only where Tailwind CSS variables already use it.

---

## Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Sidebar (220px)  │  Main area (flex:1)  │  Sources (200px)  │
│  bg: #111827      │  bg: #f8f5f0         │  bg: #f0ece4      │
│                   │                      │  (hidden on idle) │
└─────────────────────────────────────────────────────────────┘
```

The sources rail is **only visible when a result is present** (`appState === 'done'`). On idle/questioning/researching it collapses.

---

## Sidebar (220px, always visible)

Top to bottom:
1. **Logo row** — `DI` mark (22px ink navy rounded square, #7aaccc text) + "DeepInsight" wordmark + "BETA" tag
2. **+ New Research button** — full-width, subtle border, `rgba(255,255,255,0.07)` bg
3. **Research Modes section** — label "MODES", then 8 mode rows:
   - Each row: small icon square + mode label + code tag right-aligned (AXIOM, NOVA, CIPHER, ECHO, TITAN, SAGE, FORGE, VERITAS)
   - Active row: `rgba(255,255,255,0.08)` bg, white text
   - Inactive rows: muted `#94a3b8` text
   - Clicking a mode forces that mode (sets `selectedAgent`)
4. **Recent section** — label "RECENT", list of past session titles with mode + relative time below each
5. **Footer** — avatar circle + email/username + sign-out icon

Mode code tags map:
```
decision      → AXIOM
research      → NOVA
intelligence  → CIPHER
perspectives  → ECHO
competitive   → TITAN
explainer     → SAGE
action        → FORGE
forecast      → VERITAS
```

---

## Main Area — States

### Idle state
- Vertically centered content
- Large prompt: "What do you want to research?"  
- Single textarea with clean white background, `#e8e2d9` border, 16px Georgia placeholder
- Below textarea: mode detection pill — "Auto · Strategy" (updates as user types, same debounce logic as today)
- Submit button: ink navy `#1e3a5f`, white text, no glow

### Questioning state (clarification Q&A)
- Expert title + question card — white bg, `#e8e2d9` border, question in Georgia 16px
- Progress indicator (e.g. "Question 2 of 4")
- Answer textarea below
- "Skip to research" link

### Researching state (loading)
- Keep existing `ResearchLoadingScreen` component, restyle to match new palette (remove cyan references)

### Done state (report)
**Topbar** (48px, `#f8f5f0`, bottom border `#e8e2d9`):
- Breadcrumb: "Research / {query truncated}"
- Mode pill: `#1e3a5f` bg, white text, mode name + code (e.g. "CIPHER · Analysis")
- Trust score badge: right-aligned, green/orange/red coloring per existing logic
- Follow-up input: small textarea appears below topbar on "Continue Research" click

**Report body** (scrollable, `padding: 28px 32px`):
- Mode label: 9px caps, `#6b8cae`, letter-spacing .14em
- Report title: 22–24px, `#111827`, weight 700, Geist, letter-spacing -.03em
- Executive brief: 15px Georgia, `#1e293b`, line-height 1.78
- Section labels: 9px caps `#94a3b8` with hairline rule extending right (`::after` pseudo-element)
- Key findings: bullet dot (`#1e3a5f`) + Georgia body text + source attribution in 9px monospace below
- All other mode-specific sections (risks, action plan, forecast, etc.) follow the same section label → content pattern

---

## Sources Rail (200px, right side)

Visible only when `appState === 'done'`.

- Rail header: "Sources" label + count ("12 verified · 8 high-credibility")
- Source cards (white bg, `#e8e2d9` border, 6px radius):
  - Domain in Geist Mono, ink navy
  - Star rating + tier label (Government / Major News / Industry)
  - Extracted snippet in 9px `#64748b` if available
  - Credibility tier badge: HIGH (green) / MED (amber) / LOW (muted)
- Cards are sorted highest credibility first (same as today's `buildAnnotatedSourceBlock`)

---

## Typography System

```
Report title:       Geist Sans, 22px, weight 700, color #111827, tracking -.03em
Report body:        Georgia serif, 15px, weight 400, color #1e293b, line-height 1.78
Section labels:     Geist Sans, 9px, weight 600, color #94a3b8, tracking .12em, uppercase
Source metadata:    Geist Mono, 9–10px, color #6b8cae
Sidebar mode names: Geist Sans, 11px, color #94a3b8 (inactive) / #e2e8f0 (active)
Sidebar labels:     Geist Sans, 9px, color #4a6a8a, tracking .1em, uppercase
Mode code tags:     Geist Mono, 8px, color #4a6a8a
UI labels/caps:     Geist Sans, 9px, color #94a3b8, tracking .08em
```

No Google Fonts import needed — Georgia is system serif, Geist is already loaded.

---

## What to Remove

Delete from `globals.css`:
- `.btn-glow` and `:hover` variant
- `.card-bevel` (`box-shadow: inset 0 1px 0 rgba(255,255,255,0.055)`)
- `.input-gradient-border`
- The `radial-gradient(ellipse 80% 40% at 50% -10%, rgba(6,182,212,0.05)...)` body background
- The dot-grid `background-size: 100% 100%, 36px 36px` pattern
- The `--primary: oklch(0.73 0.165 195)` cyan primary (replace with ink navy)

Remove from component JSX:
- All `btn-glow` className references
- All `card-bevel` className references
- All inline `box-shadow` with rgba cyan
- All inline `background` with `rgba(6,182,212,...)`

---

## Files to Change

| File | Change |
|---|---|
| `app/globals.css` | Full theme replacement — new palette, new body bg, remove all glow/bevel utilities, add report typography classes |
| `app/layout.tsx` | No font import needed (Georgia is system) |
| `app/page.tsx` | New layout shell: sidebar + main + sources rail; new idle/questioning states; topbar; follow-up flow |
| `components/research/StructuredOutputView.tsx` | New report body layout: mode label, title, section labels with hairline rules |
| `components/research/views/*.tsx` | Updated card/section styles to match new palette (remove dark card backgrounds, use light equivalents) |
| `components/research/views/Sources.tsx` | Redesigned as source cards matching new rail design |
| `components/research/TrustScoreBadge.tsx` | Restyle for light theme (keep green/orange/red logic) |
| `components/research/ResearchLoadingScreen.tsx` | Remove cyan references, match new palette |
| `components/research/ClarificationCard.tsx` | Light card style, Georgia question text |
| `components/research/AgentCards.tsx` | Remove entirely — replaced by sidebar mode list |

---

## Spec Self-Review

**Placeholder scan:** No TBDs. All colors are exact hex values. All typography sizes are specified.

**Internal consistency:** Layout spec matches mockup. Color palette is used consistently across all sections. Georgia is specified without a font import (system font).

**Scope:** This is a pure visual redesign — no data model, API, or business logic changes. Appropriately scoped for a single implementation plan.

**Ambiguity check:**
- "Remove AgentCards" — confirmed. The sidebar mode list replaces it. The `selectedAgent` state and `setDetectedMode` sync logic in page.tsx stays.
- Sources rail visibility — confirmed: only visible when `appState === 'done'`.
- Follow-up input — stays as today's pattern, just restyled.
