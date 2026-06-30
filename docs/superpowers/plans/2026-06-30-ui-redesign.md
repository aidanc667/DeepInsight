# DeepInsight UI Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dark navy + cyan glow aesthetic with a light document/dossier design — dark sidebar, warm off-white report center, right sources rail — that reads as a professional research platform.

**Architecture:** Three-column shell (`flex h-screen overflow-hidden`): a 220px dark sidebar (always visible), a flex-1 main area (scrollable, all states), and a 200px sources rail (visible only when `appState === 'done'`). `AgentCards` component is removed; mode selection moves to the sidebar. All glow/bevel/dot-grid decoration is removed; typography and spacing carry the design.

**Tech Stack:** Next.js App Router, Tailwind CSS v4, Framer Motion v12 (`motion/react`), shadcn/ui, Geist Sans (already loaded), Georgia (system serif).

---

## File Map

| File | Action | What changes |
|---|---|---|
| `app/globals.css` | Modify | Replace dark palette + remove glow utilities + add report typography classes |
| `app/page.tsx` | Modify | New 3-column shell; new idle/questioning states; topbar for done state; remove AgentCards |
| `components/research/Sidebar.tsx` | **Create** | Dark sidebar: logo, New Research, mode list, recent history, footer |
| `components/research/SourcesRail.tsx` | **Create** | 200px right rail: source cards with tier badges, sorted by credibility |
| `components/research/ResearchLoadingScreen.tsx` | Modify | Remove cyan; match light palette |
| `components/research/ClarificationCard.tsx` | Modify | Light card style; Georgia question text |
| `components/research/TrustScoreBadge.tsx` | Modify | Light theme colors; keep green/orange/red logic |
| `components/research/StructuredOutputView.tsx` | Modify | New report body layout: mode label, Georgia text, section labels with hairline rules |
| `components/research/views/*.tsx` | Modify | Remove dark card backgrounds; use light equivalents |

---

## Task 1: Replace globals.css theme

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Read the current file**

```bash
cat app/globals.css
```

- [ ] **Step 2: Replace the entire file with the new theme**

New `app/globals.css`:

```css
@import "tailwindcss";

/* ── New color tokens ──────────────────────────────────────── */
:root {
  --bg-main:        #f8f5f0;
  --bg-sidebar:     #111827;
  --bg-sources:     #f0ece4;
  --border-main:    #e8e2d9;
  --border-sources: #e0dbd0;

  --text-body:      #1e293b;
  --text-heading:   #111827;
  --text-muted:     #64748b;
  --text-label:     #94a3b8;

  --accent:         #1e3a5f;
  --accent-light:   #6b8cae;

  /* shadcn/ui compat — keep oklch only where Tailwind requires */
  --background:     oklch(0.98 0.005 80);
  --foreground:     oklch(0.18 0.02 240);
  --primary:        oklch(0.28 0.08 240);
  --primary-foreground: oklch(1 0 0);
  --muted:          oklch(0.94 0.005 80);
  --muted-foreground: oklch(0.50 0.02 240);
  --border:         oklch(0.88 0.01 80);
  --ring:           oklch(0.28 0.08 240);
  --radius:         0.5rem;
}

/* ── Base ──────────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; }

html { height: 100%; }

body {
  min-height: 100%;
  background: var(--bg-main);
  color: var(--text-body);
  font-family: var(--font-geist-sans, system-ui, sans-serif);
  -webkit-font-smoothing: antialiased;
}

/* ── Report typography helpers ─────────────────────────────── */

/* Georgia body copy */
.report-body {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 15px;
  line-height: 1.78;
  color: var(--text-body);
}

/* Section label: 9px caps with hairline rule */
.report-section-label {
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-label);
  display: flex;
  align-items: center;
  gap: 10px;
}
.report-section-label::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-main);
}

/* Hairline divider */
.report-divider {
  height: 1px;
  background: var(--border-main);
  margin: 20px 0;
}
```

- [ ] **Step 3: Verify no broken references — scan for removed class names**

```bash
grep -r "btn-glow\|card-bevel\|input-gradient-border" app/ components/ --include="*.tsx" --include="*.ts" -l
```

Expected: lists files that still reference these classes (they'll be fixed in later tasks). Note them — do NOT remove them yet.

- [ ] **Step 4: Start dev server and verify the app loads without CSS errors**

```bash
npm run dev
```

Check browser console for CSS parse errors. The app will look broken (dark JSX against light bg) — that is expected.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css
git commit -m "style: replace dark CSS theme with light document palette"
```

---

## Task 2: Build Sidebar component

**Files:**
- Create: `components/research/Sidebar.tsx`

- [ ] **Step 1: Read the MODE_CONFIG from page.tsx to get mode ids and labels**

```bash
grep -A 40 "const MODE_CONFIG" app/page.tsx
```

- [ ] **Step 2: Create the Sidebar component**

```tsx
// components/research/Sidebar.tsx
'use client'

import { useClerk } from '@clerk/nextjs'
import { LogOut, Plus, FlaskConical } from 'lucide-react'
import type { QueryMode } from '@/ai/schemas'

const MODES: { id: QueryMode; label: string; code: string }[] = [
  { id: 'decision',     label: 'Strategy',      code: 'AXIOM'   },
  { id: 'research',     label: 'Research',       code: 'NOVA'    },
  { id: 'intelligence', label: 'Analysis',       code: 'CIPHER'  },
  { id: 'perspectives', label: 'Perspectives',   code: 'ECHO'    },
  { id: 'competitive',  label: 'Challenge',      code: 'TITAN'   },
  { id: 'explainer',    label: 'Understanding',  code: 'SAGE'    },
  { id: 'action',       label: 'Execution',      code: 'FORGE'   },
  { id: 'forecast',     label: 'Forecast',       code: 'VERITAS' },
]

interface RecentSession {
  id: string
  prompt: string
  mode?: QueryMode
  createdAt: string
}

interface SidebarProps {
  activeMode: QueryMode | null
  onModeSelect: (id: QueryMode) => void
  onNewResearch: () => void
  recentSessions: RecentSession[]
  onRerun: (session: RecentSession) => void
}

export function Sidebar({ activeMode, onModeSelect, onNewResearch, recentSessions, onRerun }: SidebarProps) {
  const { signOut, user } = useClerk()

  return (
    <aside
      className="flex flex-col shrink-0 overflow-hidden"
      style={{
        width: 220,
        background: '#111827',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div
          className="flex items-center justify-center h-[22px] w-[22px] rounded-[5px] shrink-0"
          style={{ background: '#1e3a5f' }}
        >
          <FlaskConical className="h-3 w-3" style={{ color: '#7aaccc' }} />
        </div>
        <span className="text-[13px] font-bold tracking-[0.06em]" style={{ color: '#e2e8f0' }}>
          DeepInsight
        </span>
        <span
          className="ml-auto text-[8px] font-mono tracking-[0.08em] px-1.5 py-0.5 rounded"
          style={{ background: 'rgba(255,255,255,0.06)', color: '#4a6a8a' }}
        >
          BETA
        </span>
      </div>

      {/* New Research */}
      <div className="px-3 pt-3">
        <button
          onClick={onNewResearch}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-medium transition-colors"
          style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#c8d6e5',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.11)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
        >
          <Plus className="h-3.5 w-3.5" />
          New Research
        </button>
      </div>

      {/* Modes */}
      <div className="px-3 pt-4">
        <p className="text-[9px] font-semibold tracking-[0.1em] uppercase mb-2 px-1" style={{ color: '#4a6a8a' }}>
          Modes
        </p>
        <div className="space-y-0.5">
          {MODES.map(mode => {
            const isActive = activeMode === mode.id
            return (
              <button
                key={mode.id}
                onClick={() => onModeSelect(mode.id)}
                className="w-full flex items-center gap-2 px-2.5 py-[7px] rounded-md text-left transition-colors"
                style={{
                  background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: isActive ? '#e2e8f0' : '#94a3b8',
                }}
                onMouseEnter={e => {
                  if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                  if (!isActive) e.currentTarget.style.color = '#c8d6e5'
                }}
                onMouseLeave={e => {
                  if (!isActive) e.currentTarget.style.background = 'transparent'
                  if (!isActive) e.currentTarget.style.color = '#94a3b8'
                }}
              >
                <div
                  className="w-[6px] h-[6px] rounded-[2px] shrink-0"
                  style={{ background: isActive ? '#6b8cae' : '#2d3f54' }}
                />
                <span className="text-[11px] flex-1 leading-none">{mode.label}</span>
                <span className="text-[8px] font-mono shrink-0" style={{ color: '#4a6a8a' }}>
                  {mode.code}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Recent */}
      {recentSessions.length > 0 && (
        <div className="px-3 pt-4 flex-1 min-h-0 overflow-y-auto">
          <p className="text-[9px] font-semibold tracking-[0.1em] uppercase mb-2 px-1" style={{ color: '#4a6a8a' }}>
            Recent
          </p>
          <div className="space-y-0.5">
            {recentSessions.slice(0, 10).map(session => (
              <button
                key={session.id}
                onClick={() => onRerun(session)}
                className="w-full px-2.5 py-2 rounded-md text-left transition-colors"
                style={{ background: 'transparent' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <p className="text-[11px] truncate leading-tight" style={{ color: '#7a9ab8' }}>
                  {session.prompt}
                </p>
                {session.mode && (
                  <p className="text-[9px] font-mono mt-0.5" style={{ color: '#4a6a8a' }}>
                    {MODES.find(m => m.id === session.mode)?.code ?? session.mode.toUpperCase()}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div
        className="mt-auto flex items-center gap-2.5 px-4 py-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div
          className="h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0"
          style={{ background: '#1e3a5f', color: '#7aaccc' }}
        >
          {user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ?? '?'}
        </div>
        <p className="text-[10px] truncate flex-1" style={{ color: '#4a6a8a' }}>
          {user?.emailAddresses?.[0]?.emailAddress ?? ''}
        </p>
        <button
          onClick={() => signOut()}
          className="shrink-0 p-1 rounded transition-colors"
          style={{ color: '#4a6a8a' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
          onMouseLeave={e => (e.currentTarget.style.color = '#4a6a8a')}
          title="Sign out"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    </aside>
  )
}
```

- [ ] **Step 3: Verify it typechecks**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors from `Sidebar.tsx`. Fix any type errors before continuing.

- [ ] **Step 4: Commit**

```bash
git add components/research/Sidebar.tsx
git commit -m "feat: add Sidebar component with mode list, recent sessions, footer"
```

---

## Task 3: Build SourcesRail component

**Files:**
- Create: `components/research/SourcesRail.tsx`
- Read first: `components/research/views/Sources.tsx` to understand `SourceRegistryItem` shape

- [ ] **Step 1: Read the source registry type**

```bash
grep -A 20 "SourceRegistryItem" ai/schemas.ts | head -30
```

- [ ] **Step 2: Create the SourcesRail component**

```tsx
// components/research/SourcesRail.tsx
'use client'

import type { EliteResearchOutput } from '@/ai/schemas'

type SourceItem = NonNullable<EliteResearchOutput['sourceRegistry']>[number]

interface SourcesRailProps {
  sources: SourceItem[]
}

function tierBadge(tier: string | undefined) {
  if (!tier) return null
  const t = tier.toLowerCase()
  if (t.includes('government') || t.includes('academic') || t.includes('major')) {
    return { label: 'HIGH', bg: '#e8f0e8', text: '#1a4a1a', border: '#b8d8b8' }
  }
  if (t.includes('industry') || t.includes('news')) {
    return { label: 'MED', bg: '#fef3cd', text: '#7a5a00', border: 'transparent' }
  }
  return { label: 'LOW', bg: '#f0ece4', text: '#64748b', border: 'transparent' }
}

function domainFrom(url: string) {
  try { return new URL(url).hostname.replace('www.', '') }
  catch { return url }
}

export function SourcesRail({ sources }: SourcesRailProps) {
  const sorted = [...sources]
    .filter(s => s?.url)
    .sort((a, b) => {
      const rank = (s: SourceItem) => {
        const t = (s.tierLabel ?? '').toLowerCase()
        if (t.includes('government') || t.includes('academic')) return 0
        if (t.includes('major') || t.includes('news')) return 1
        return 2
      }
      return rank(a) - rank(b)
    })

  const highCount = sorted.filter(s => {
    const t = (s.tierLabel ?? '').toLowerCase()
    return t.includes('government') || t.includes('academic') || t.includes('major')
  }).length

  return (
    <aside
      className="flex flex-col shrink-0 overflow-hidden"
      style={{
        width: 200,
        background: '#f0ece4',
        borderLeft: '1px solid #e0dbd0',
      }}
    >
      {/* Header */}
      <div className="px-3 pt-4 pb-2" style={{ borderBottom: '1px solid #e0dbd0' }}>
        <p className="text-[9px] font-semibold tracking-[0.1em] uppercase" style={{ color: '#94a3b8' }}>
          Sources
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: '#64748b' }}>
          {sorted.length} verified · {highCount} high-cred
        </p>
      </div>

      {/* Source cards */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2">
        {sorted.map((source, i) => {
          const badge = tierBadge(source.tierLabel)
          const domain = domainFrom(source.url ?? '')
          return (
            <a
              key={i}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-2 rounded-md transition-colors"
              style={{
                background: 'white',
                border: '1px solid #e8e2d9',
                textDecoration: 'none',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#c8bfb0')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#e8e2d9')}
            >
              <p
                className="text-[10px] font-mono font-medium truncate leading-tight"
                style={{ color: '#1e3a5f' }}
              >
                {domain}
              </p>
              {badge && (
                <span
                  className="inline-block mt-1 text-[8px] font-mono px-1.5 py-0.5 rounded"
                  style={{ background: badge.bg, color: badge.text, border: badge.border !== 'transparent' ? `1px solid ${badge.border}` : undefined }}
                >
                  {badge.label}
                </span>
              )}
              {source.keyInsight && (
                <p className="text-[9px] mt-1 line-clamp-3 leading-snug" style={{ color: '#64748b' }}>
                  {source.keyInsight}
                </p>
              )}
            </a>
          )
        })}
      </div>
    </aside>
  )
}
```

- [ ] **Step 3: Verify it typechecks**

```bash
npx tsc --noEmit 2>&1 | grep "SourcesRail" | head -10
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/research/SourcesRail.tsx
git commit -m "feat: add SourcesRail component with source cards and tier badges"
```

---

## Task 4: Restructure app/page.tsx — new layout shell

**Files:**
- Modify: `app/page.tsx`

This is the largest task. Read the full current file before editing.

- [ ] **Step 1: Read the full page.tsx**

```bash
wc -l app/page.tsx
cat app/page.tsx
```

- [ ] **Step 2: Add Sidebar and SourcesRail imports**

At the top of the import block (after existing component imports), add:

```tsx
import { Sidebar } from '@/components/research/Sidebar'
import { SourcesRail } from '@/components/research/SourcesRail'
```

Remove the `AgentCards` import line:
```tsx
// DELETE THIS LINE:
import { AgentCards } from '@/components/research/AgentCards'
```

Remove these unused Lucide icons from the import (they were only used in the dark theme header and AgentCards-related UI): `Brain`, `Sparkles`. Keep all others that are still used.

- [ ] **Step 3: Add recentSessions state and load on mount**

In `DeepInsightApp` (the inner component), add state for sessions:

```tsx
const [recentSessions, setRecentSessions] = useState<Array<{ id: string; prompt: string; mode?: QueryMode; createdAt: string }>>([])

useEffect(() => {
  loadSessions().then(sessions => {
    setRecentSessions(sessions.map(s => ({
      id: s.id ?? String(s.createdAt),
      prompt: s.prompt,
      mode: s.mode as QueryMode | undefined,
      createdAt: String(s.createdAt),
    })))
  }).catch(() => {})
}, [appState]) // refresh after each research
```

- [ ] **Step 4: Replace the return JSX with the new 3-column shell**

Replace the entire `return (...)` block in `DeepInsightApp` with:

```tsx
return (
  <div className="flex h-screen overflow-hidden" style={{ background: '#f8f5f0' }}>

    {/* ── Sidebar ──────────────────────────────────────────────── */}
    <Sidebar
      activeMode={selectedAgent as QueryMode | null}
      onModeSelect={(id) => {
        setSelectedAgent(id)
        setDetectedMode(id)
      }}
      onNewResearch={onNewChat}
      recentSessions={recentSessions}
      onRerun={(session) => {
        setPrompt(session.prompt)
        if (session.mode) {
          setSelectedAgent(session.mode)
          setDetectedMode(session.mode)
        }
        handleAnalyze()
      }}
    />

    {/* ── Main area ─────────────────────────────────────────────── */}
    <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

      {/* Topbar — shown when done or researching */}
      {(appState === 'done' || appState === 'researching' || isLoading) && (
        <div
          className="flex items-center gap-3 px-6 h-12 shrink-0"
          style={{ background: '#f8f5f0', borderBottom: '1px solid #e8e2d9' }}
        >
          <span className="text-[11px]" style={{ color: '#94a3b8' }}>Research</span>
          <span style={{ color: '#e8e2d9' }}>/</span>
          <span className="text-[11px] truncate flex-1" style={{ color: '#1e293b' }}>
            {prompt.length > 60 ? prompt.slice(0, 60) + '…' : prompt}
          </span>
          {detectedMode && (
            <span
              className="shrink-0 text-[9px] font-mono px-2 py-1 rounded"
              style={{ background: '#1e3a5f', color: 'white' }}
            >
              {MODE_CONFIG[detectedMode]?.tag ?? detectedMode.toUpperCase()}
            </span>
          )}
          {trustScore && <TrustScoreBadge score={trustScore} />}
          <button
            onClick={stop}
            style={{ display: isLoading ? undefined : 'none', color: '#94a3b8', fontSize: 11, fontFamily: 'monospace', border: '1px solid #e8e2d9', padding: '2px 10px', borderRadius: 6 }}
          >
            Stop
          </button>
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Idle state ─────────────────────────────────────────── */}
        {appState === 'idle' && (
          <div className="flex flex-col items-center justify-center min-h-full px-8 py-16">
            <div className="w-full max-w-xl space-y-5">
              <h1 className="text-[26px] font-bold tracking-tight" style={{ color: '#111827', fontFamily: 'var(--font-geist-sans, system-ui)' }}>
                What do you want to research?
              </h1>

              <div
                className="rounded-xl overflow-hidden"
                style={{ border: '1px solid #e8e2d9', background: 'white' }}
              >
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAnalyze() }}
                  placeholder="Ask anything — a decision to make, a topic to research, a trend to understand…"
                  className="w-full min-h-[110px] p-4 resize-none focus:outline-none text-[15px] leading-relaxed placeholder:text-[#94a3b8]"
                  style={{ fontFamily: 'Georgia, serif', color: '#1e293b', background: 'transparent', caretColor: '#1e3a5f' }}
                  disabled={isInputDisabled}
                />
                <div
                  className="flex items-center justify-between px-4 py-2.5"
                  style={{ borderTop: '1px solid #e8e2d9' }}
                >
                  {detectedMode ? (
                    <span className="text-[10px] font-mono" style={{ color: '#6b8cae' }}>
                      Auto · {MODE_CONFIG[detectedMode]?.label ?? detectedMode}
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono" style={{ color: '#94a3b8' }}>
                      Mode auto-detected
                    </span>
                  )}
                  <button
                    onClick={handleAnalyze}
                    disabled={!prompt.trim() || isResearching || appState === 'checking'}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ background: '#1e3a5f', color: 'white' }}
                  >
                    {appState === 'checking' ? (
                      <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Analyzing…</>
                    ) : (
                      'Run Research'
                    )}
                  </button>
                </div>
              </div>

              <p className="text-[10px] font-mono text-center" style={{ color: '#94a3b8' }}>
                ⌘ ↵ to run · Select a mode from the sidebar to force it
              </p>
            </div>

            {/* Recent history on idle */}
            <div className="w-full max-w-xl mt-12">
              <ResearchHistory onRerun={handleRerun} />
            </div>
          </div>
        )}

        {/* ── Questioning state ───────────────────────────────────── */}
        <AnimatePresence>
          {appState === 'questioning' && (
            <motion.div
              key="questioning"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center justify-center min-h-full px-8 py-16"
            >
              <div className="w-full max-w-xl space-y-4">
                {/* Expert header */}
                <div>
                  {expertTitle && (
                    <p className="text-[9px] font-mono tracking-[0.15em] uppercase mb-1" style={{ color: '#6b8cae' }}>
                      Consulting Expert · {expertTitle}
                    </p>
                  )}
                  <p className="text-[14px] font-semibold" style={{ color: '#111827' }}>
                    {questionHistory.length === 0
                      ? 'A few quick questions to personalise your research'
                      : `Question ${questionHistory.length + 1} of ${totalQuestions}`}
                  </p>
                </div>

                {/* Answered history */}
                {questionHistory.length > 0 && (
                  <div className="space-y-1.5">
                    {questionHistory.map((entry, i) => (
                      <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg" style={{ background: '#f0f7f0', border: '1px solid #c8dcc8' }}>
                        <Check className="h-3 w-3 shrink-0" style={{ color: '#2d6a2d' }} />
                        <span className="text-[12px] truncate flex-1" style={{ color: '#64748b' }}>{entry.question.question}</span>
                        <span className="text-[11px] font-semibold shrink-0" style={{ color: '#2d6a2d' }}>{entry.answer}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Active question */}
                <AnimatePresence mode="wait">
                  {fetchingNext ? (
                    <motion.div key="fetching" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-3 py-10 justify-center">
                      <Loader2 className="h-4 w-4 animate-spin" style={{ color: '#6b8cae' }} />
                      <span className="text-[11px] font-mono tracking-[0.18em]" style={{ color: '#94a3b8' }}>
                        EXPERT THINKING…
                      </span>
                    </motion.div>
                  ) : currentQuestion ? (
                    <motion.div key={currentQuestion.fieldTargeted}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}>
                      <ClarificationCard
                        question={currentQuestion}
                        index={questionHistory.length}
                        selected={pendingAnswer}
                        onSelect={setPendingAnswer}
                      />
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                {/* Actions */}
                <div className="flex items-center gap-4 pt-1">
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={!pendingAnswer || fetchingNext}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ background: '#1e3a5f', color: 'white' }}
                  >
                    Continue
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={handleSkipToResearch}
                    disabled={fetchingNext}
                    className="text-[11px] font-mono transition-colors disabled:opacity-40"
                    style={{ color: '#94a3b8' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#64748b')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
                  >
                    {questionHistory.length > 0 ? 'Start research now' : 'Skip questions'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Research Loading ─────────────────────────────────────── */}
        <div className="px-8 py-8 max-w-2xl mx-auto w-full">
          <ResearchLoadingScreen
            prompt={prompt}
            isActive={isResearching && !object?.executiveBrief}
          />
        </div>

        {/* ── Chat history (previous turns) ────────────────────────── */}
        {chatHistory.map((entry, i) => (
          <div key={i} className="px-8 py-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1" style={{ background: '#e8e2d9' }} />
              <span className="text-[10px] font-mono shrink-0 truncate max-w-[300px]" style={{ color: '#94a3b8' }}>
                {entry.prompt}
              </span>
              <div className="h-px flex-1" style={{ background: '#e8e2d9' }} />
            </div>
            <div className="opacity-50">
              <OutputErrorBoundary>
                <StructuredOutputView data={entry.result} isLoading={false} onGoDeeper={handleGoDeeper} />
              </OutputErrorBoundary>
            </div>
          </div>
        ))}

        {/* ── Results ─────────────────────────────────────────────── */}
        <AnimatePresence>
          {(isResearching || appState === 'done') && object && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="px-8 py-6"
            >
              {chatHistory.length > 0 && (
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-px flex-1" style={{ background: '#e8e2d9' }} />
                  <span className="text-[10px] font-mono shrink-0" style={{ color: '#94a3b8' }}>{currentPromptLabel}</span>
                  <div className="h-px flex-1" style={{ background: '#e8e2d9' }} />
                </div>
              )}
              <OutputErrorBoundary>
                <StructuredOutputView
                  data={object as Partial<EliteResearchOutput>}
                  isLoading={isLoading}
                  onGoDeeper={handleGoDeeper}
                />
              </OutputErrorBoundary>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Post-result actions ──────────────────────────────────── */}
        <AnimatePresence>
          {appState === 'done' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="px-8 pb-12 space-y-3"
            >
              {/* Follow-up panel */}
              <AnimatePresence>
                {showFollowUp && (
                  <motion.div
                    key="followup"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-xl overflow-hidden"
                    style={{ border: '1px solid #e8e2d9', background: 'white' }}
                  >
                    <div className="p-4 space-y-3">
                      <p className="text-[10px] font-mono tracking-[0.15em]" style={{ color: '#6b8cae' }}>
                        FOLLOW-UP · CONTEXT CARRIED FORWARD
                      </p>
                      <textarea
                        autoFocus
                        value={followUpText}
                        onChange={e => setFollowUpText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleContinueResearch() }}
                        placeholder="Ask a follow-up question about this topic…"
                        rows={3}
                        className="w-full rounded-lg p-3 text-[14px] leading-relaxed placeholder:text-[#94a3b8] resize-none focus:outline-none"
                        style={{ fontFamily: 'Georgia, serif', color: '#1e293b', background: '#fafaf8', border: '1px solid #e8e2d9', caretColor: '#1e3a5f' }}
                      />
                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleContinueResearch}
                          disabled={!followUpText.trim()}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          style={{ background: '#1e3a5f', color: 'white' }}
                        >
                          <Send className="h-3.5 w-3.5" />
                          Research this
                        </button>
                        <button
                          onClick={() => { setShowFollowUp(false); setFollowUpText('') }}
                          className="text-[11px] font-mono transition-colors"
                          style={{ color: '#94a3b8' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action buttons */}
              {!showFollowUp && (
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setShowFollowUp(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium transition-colors"
                    style={{ border: '1px solid #1e3a5f', color: '#1e3a5f', background: 'transparent' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f0f4f8')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Continue Chat
                  </button>
                  <button
                    onClick={onNewChat}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium transition-colors"
                    style={{ border: '1px solid #e8e2d9', color: '#64748b' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#c8bfb0')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#e8e2d9')}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Start New Chat
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>{/* end scrollable */}
    </main>

    {/* ── Sources Rail (done state only) ────────────────────────── */}
    <AnimatePresence>
      {appState === 'done' && object?.sourceRegistry && object.sourceRegistry.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <SourcesRail sources={object.sourceRegistry as NonNullable<EliteResearchOutput['sourceRegistry']>} />
        </motion.div>
      )}
    </AnimatePresence>

  </div>
)
```

- [ ] **Step 5: Remove the old sign-out button (it's now in Sidebar footer)**

The `onSignOut` prop passed from the outer `Page` component to `DeepInsightApp` is still needed for the Sidebar to call — but we removed the old header sign-out button. Verify the Sidebar uses `useClerk()` directly (it does, per Task 2). Remove the `onSignOut` prop from `DeepInsightApp` if it's no longer referenced.

- [ ] **Step 6: Typecheck**

```bash
npx tsc --noEmit 2>&1 | head -40
```

Fix any type errors (likely: unused `Brain`, `Sparkles` imports; prop mismatches). The `AgentCards` import must be gone.

- [ ] **Step 7: Check the browser — idle state should look correct**

The app should show: dark sidebar on left, warm off-white main area with centered textarea, no right rail yet.

- [ ] **Step 8: Commit**

```bash
git add app/page.tsx
git commit -m "refactor: new 3-column layout shell with sidebar, main area states, sources rail"
```

---

## Task 5: Restyle ClarificationCard, ResearchLoadingScreen, TrustScoreBadge

**Files:**
- Modify: `components/research/ClarificationCard.tsx`
- Modify: `components/research/ResearchLoadingScreen.tsx`
- Modify: `components/research/TrustScoreBadge.tsx`

- [ ] **Step 1: Read all three files**

```bash
cat components/research/ClarificationCard.tsx
cat components/research/ResearchLoadingScreen.tsx
cat components/research/TrustScoreBadge.tsx
```

- [ ] **Step 2: Restyle ClarificationCard.tsx**

Replace all dark-themed styling. The card should be:
- White background, `#e8e2d9` border
- Question text: Georgia 16px, `#1e293b`
- Option buttons: white bg, `#e8e2d9` border; selected state: `#1e3a5f` border + `#f0f4f8` bg
- Remove all `bg-[#0a1830]`, `border-cyan-500`, cyan `box-shadow`, dark overlay styles

Key replacements in JSX:
```tsx
// Card wrapper — was dark gradient
// Change to:
style={{ background: 'white', border: '1px solid #e8e2d9', borderRadius: 12 }}

// Question text — was text-slate-200
// Change to:
style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: '#1e293b', lineHeight: 1.6 }}

// Option button — was dark with cyan glow
// Unselected:
style={{ background: 'white', border: '1px solid #e8e2d9', color: '#1e293b' }}
// Selected:
style={{ background: '#f0f4f8', border: '1px solid #1e3a5f', color: '#1e3a5f' }}
```

- [ ] **Step 3: Restyle ResearchLoadingScreen.tsx**

Remove:
- The cyan shimmer top `div` (`h-px` with cyan gradient) — delete this element
- The dark gradient `background: 'linear-gradient(160deg, #0d192a 0%, #0a1220 100%)'`
- `card-bevel` className
- All inline `rgba(6,182,212,...)` colors
- All `text-cyan-400` classNames

Replace with:
```tsx
// Outer wrapper
style={{ background: 'white', border: '1px solid #e8e2d9', borderRadius: 12 }}

// Sparkles icon container — was cyan glow
style={{ background: '#f0f4f8', border: '1px solid #e8e2d9' }}

// Sparkles icon — was text-cyan-400
style={{ color: '#1e3a5f' }}

// "Consulting Expert" label — was text-slate-600
style={{ color: '#94a3b8' }}

// Expert title — was text-slate-200
style={{ color: '#111827' }}

// ACTIVE badge — was cyan
style={{ background: '#f0f4f8', border: '1px solid #e8e2d9', color: '#6b8cae' }}

// Progress bar fill — was cyan gradient
style={{ background: '#1e3a5f' }}
// Progress bar track — was rgba white/0.05
style={{ background: '#e8e2d9' }}

// Stage done icon: text-emerald-400 → keep (green is fine)
// Stage active icon — was text-cyan-400
style={{ color: '#1e3a5f' }}
// Stage pending icon — was text-slate-700
style={{ color: '#c8d0d8' }}

// Model callout divider — was rgba white/0.05
style={{ borderColor: '#e8e2d9' }}

// Dot colors: keep emerald for live web, change cyan dots to #1e3a5f / #6b8cae
```

- [ ] **Step 4: Restyle TrustScoreBadge.tsx**

The badge uses `alertLevel` (green/orange/red) — keep that logic. Replace dark wrapper:

```tsx
// Outer wrapper — was bg-white/[0.03]
// Change to: plain white bg with #e8e2d9 border
style={{ background: 'white', border: '1px solid #e8e2d9', borderRadius: 8 }}

// Tooltip panel — was bg-[#0c1525]
// Change to: white
style={{ background: 'white', border: '1px solid #e8e2d9', color: '#1e293b' }}

// Score label text — was dark-themed
style={{ color: '#64748b' }}
```

The SVG ring colors (green/orange/red) stay as-is — they already look fine on light.

- [ ] **Step 5: Typecheck and visually verify**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Navigate to a research session in the browser and verify:
- ClarificationCard: white card with Georgia question
- LoadingScreen: white card with ink navy progress bar
- TrustScoreBadge: light themed, ring colors still visible

- [ ] **Step 6: Commit**

```bash
git add components/research/ClarificationCard.tsx components/research/ResearchLoadingScreen.tsx components/research/TrustScoreBadge.tsx
git commit -m "style: restyle ClarificationCard, LoadingScreen, TrustScoreBadge for light theme"
```

---

## Task 6: Restyle StructuredOutputView and views/*.tsx for light report

**Files:**
- Modify: `components/research/StructuredOutputView.tsx`
- Modify: `components/research/views/*.tsx` (all 14 files)

- [ ] **Step 1: List all view files**

```bash
ls components/research/views/
```

- [ ] **Step 2: Read StructuredOutputView.tsx (the orchestrator)**

```bash
cat components/research/StructuredOutputView.tsx
```

- [ ] **Step 3: Update StructuredOutputView.tsx — add mode label + report title header**

At the top of the rendered output (before whatever the first section is), add a report header:

```tsx
{/* Report header */}
{data.reportTitle && (
  <div className="mb-6">
    {data.queryMode && (
      <p className="text-[9px] font-semibold tracking-[0.14em] uppercase mb-2" style={{ color: '#6b8cae', fontFamily: 'var(--font-geist-sans, system-ui)' }}>
        {MODE_LABEL[data.queryMode as QueryMode] ?? data.queryMode} · {data.queryMode?.toUpperCase()}
      </p>
    )}
    <h1 className="text-[22px] font-bold leading-tight tracking-[-0.03em]" style={{ color: '#111827', fontFamily: 'var(--font-geist-sans, system-ui)' }}>
      {data.reportTitle}
    </h1>
  </div>
)}
```

Where `MODE_LABEL` maps query mode ids to display names — import the same `MODE_CONFIG` labels or define inline:
```tsx
const MODE_LABEL: Record<string, string> = {
  decision: 'Strategy', research: 'Research', intelligence: 'Analysis',
  perspectives: 'Perspectives', competitive: 'Challenge', explainer: 'Understanding',
  action: 'Execution', forecast: 'Forecast',
}
```

- [ ] **Step 4: Read and update each view file**

For each file in `components/research/views/`, apply these global changes:

**Remove:**
- `card-bevel` classNames
- Dark backgrounds (`bg-[#...]` with dark hex, `rgba(255,255,255,0.03)`, `rgba(255,255,255,0.04)` etc.)
- Cyan accent colors (`text-cyan-400`, `border-cyan-500`, `rgba(6,182,212,...)`)
- `text-slate-200`, `text-slate-300` (near-white text — these are for dark backgrounds)

**Add / Replace:**
- Card wrappers: `background: 'white', border: '1px solid #e8e2d9', borderRadius: 8` or use `rounded-lg border` with `border-[#e8e2d9] bg-white`
- Body text: add `className="report-body"` (or inline `fontFamily: 'Georgia, serif', fontSize: 15, lineHeight: 1.78, color: '#1e293b'`)
- Headings / section labels: replace with `report-section-label` CSS class (from globals.css Task 1) or inline equivalent
- Muted text: `color: '#64748b'`
- Accent text / links: `color: '#1e3a5f'`
- Bullet dots: `color: '#1e3a5f'`

**For `primitives.tsx`** (the shared Card, SectionLabel etc.):
Update the base `Card` component:
```tsx
// Old: dark glass card
// New:
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn('rounded-lg p-4', className)}
      style={{ background: 'white', border: '1px solid #e8e2d9' }}
    >
      {children}
    </div>
  )
}

// Old SectionLabel (if one exists):
export function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="report-section-label">{children}</p>
}
```

Work through all 14 view files. The common pattern: every dark JSX card becomes `bg-white border border-[#e8e2d9]`, every dark text class becomes the appropriate light-theme `style` color.

- [ ] **Step 5: Source attribution in body text**

For inline citations (source numbers like `[1]`, `[federalreserve.gov]`), they should render in `font-mono text-[9px] color: #6b8cae`. This is already a small tag/span in the output — just verify the color maps correctly.

- [ ] **Step 6: Typecheck**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Fix any errors.

- [ ] **Step 7: Manual QA — run a research query end-to-end**

```bash
npm run dev
```

Run a short research query (e.g., "What is quantum computing?") and verify:
1. Idle state: white textarea, ink navy submit button
2. Questioning: white ClarificationCard with Georgia question text
3. Loading: white loading screen with navy progress bar
4. Done: report in Georgia serif, section labels with hairline rules, sources rail on right

- [ ] **Step 8: Commit**

```bash
git add components/research/StructuredOutputView.tsx components/research/views/
git commit -m "style: restyle report view components for light document theme"
```

---

## Final Cleanup

- [ ] **Verify no remaining dark-theme artifacts**

```bash
grep -r "btn-glow\|card-bevel\|input-gradient-border\|rgba(6,182,212\|#070d1a\|#0a1220\|text-cyan-400\|border-cyan" components/ app/ --include="*.tsx" --include="*.css" -l
```

For each file listed, check if the reference is intentional or a missed replacement. Fix any stragglers.

- [ ] **Remove AgentCards if it has no other consumers**

```bash
grep -r "AgentCards" app/ components/ --include="*.tsx" -l
```

If the only reference was in `page.tsx` and that's gone, delete the file:
```bash
git rm components/research/AgentCards.tsx
git commit -m "chore: remove AgentCards component (replaced by sidebar mode list)"
```

- [ ] **Final typecheck**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Final commit**

```bash
git add -A
git commit -m "style: ui redesign complete — light document theme, sidebar, sources rail"
```

---

## Self-Review

**Spec coverage check:**
- ✅ globals.css: new light palette, remove glow/bevel/dot-grid — Task 1
- ✅ Sidebar: logo, New Research, 8 mode list with code tags, recent, footer — Task 2
- ✅ Sources rail: visible only when done, sorted by credibility, tier badges — Task 3
- ✅ New 3-column layout shell in page.tsx — Task 4
- ✅ AgentCards removed — Task 4 + Final Cleanup
- ✅ Idle state: warm textarea, Georgia placeholder, auto-detected mode pill, ink navy button — Task 4
- ✅ Questioning state: white ClarificationCard, Georgia question, progress — Tasks 4 + 5
- ✅ Topbar for done/researching states: breadcrumb + mode pill + trust badge — Task 4
- ✅ Report body: Georgia 15px/1.78, section labels with hairline rules, ink navy bullets — Task 6
- ✅ ClarificationCard restyled — Task 5
- ✅ LoadingScreen restyled — Task 5
- ✅ TrustScoreBadge restyled — Task 5

**No placeholders:** All color values are exact hex. All JSX is complete.

**Type consistency:** `QueryMode` type is imported and used consistently. `EliteResearchOutput['sourceRegistry']` type is correctly cast in SourcesRail.

**Scope:** Pure visual redesign — no API routes, schemas, or AI pipeline changes. Correctly scoped.
