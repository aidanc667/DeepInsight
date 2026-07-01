'use client'

import { useClerk } from '@clerk/nextjs'
import { useUser } from '@clerk/nextjs'
import { LogOut, Plus, Brain, X } from 'lucide-react'
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
  onDeleteSession: (id: string) => void
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ activeMode, onModeSelect, onNewResearch, recentSessions, onRerun, onDeleteSession, isOpen, onClose }: SidebarProps) {
  const { signOut } = useClerk()
  const { user } = useUser()

  const handleModeSelect = (id: QueryMode) => {
    onModeSelect(id)
    onClose()
  }

  const handleNewResearch = () => {
    onNewResearch()
    onClose()
  }

  const handleRerun = (session: RecentSession) => {
    onRerun(session)
    onClose()
  }

  const sidebarContent = (
    <aside
      className="flex flex-col h-full overflow-hidden"
      style={{
        width: '220px',
        background: '#111827',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo */}
      <button
        onClick={handleNewResearch}
        className="flex items-center gap-2.5 px-4 pt-5 pb-4 w-full text-left transition-opacity hover:opacity-80"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div
          className="flex items-center justify-center h-[22px] w-[22px] rounded-[5px] shrink-0"
          style={{ background: '#1e3a5f' }}
        >
          <Brain className="h-3 w-3" style={{ color: '#7aaccc' }} />
        </div>
        <span className="text-[13px] font-bold tracking-[0.06em]" style={{ color: '#e2e8f0' }}>
          DeepInsight
        </span>
        {/* Close button — mobile only */}
        <X
          className="h-4 w-4 ml-auto md:hidden"
          style={{ color: '#4a6a8a' }}
          onClick={e => { e.stopPropagation(); onClose() }}
        />
      </button>

      {/* New Research */}
      <div className="px-3 pt-3">
        <button
          onClick={handleNewResearch}
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
          New Research Query
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
                onClick={() => handleModeSelect(mode.id)}
                className="w-full flex items-center gap-2 px-2.5 py-[7px] rounded-md text-left transition-colors"
                style={{
                  background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: isActive ? '#e2e8f0' : '#94a3b8',
                }}
                aria-pressed={isActive}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                    e.currentTarget.style.color = '#c8d6e5'
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#94a3b8'
                  }
                }}
              >
                <div
                  className="w-[6px] h-[6px] rounded-[2px] shrink-0"
                  style={{ background: isActive ? '#6b8cae' : '#2d3f54' }}
                />
                <span className="text-[11px] flex-1 leading-none">{mode.label}</span>
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
              <div
                key={session.id}
                className="group flex items-start gap-1 rounded-md transition-colors"
                style={{ background: 'transparent' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <button
                  onClick={() => handleRerun(session)}
                  className="flex-1 min-w-0 px-2.5 py-2 text-left"
                  aria-label={session.prompt}
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
                <button
                  onClick={e => { e.stopPropagation(); onDeleteSession(session.id) }}
                  className="opacity-0 group-hover:opacity-100 shrink-0 p-1.5 mt-1 mr-1 rounded transition-opacity"
                  style={{ color: '#4a6a8a' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#4a6a8a')}
                  aria-label="Delete session"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
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
          aria-label="Sign out"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    </aside>
  )

  return (
    <>
      {/* Desktop: always-visible sidebar in the flex row */}
      <div className="hidden md:flex shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile: slide-in overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={onClose}
          />
          {/* Drawer */}
          <div className="relative flex">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}
