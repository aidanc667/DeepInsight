'use client'

import { memo } from 'react'
import { motion } from 'motion/react'
import { Check } from 'lucide-react'

// ─── Avatar SVGs ──────────────────────────────────────────────────────────────

function AxiomAvatar() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <defs>
        <radialGradient id="ax-bg" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#3b0764" />
          <stop offset="100%" stopColor="#0f0520" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#ax-bg)" />
      <rect x="12" y="18" width="40" height="28" rx="5" fill="#1e1050" stroke="#6d28d9" strokeWidth="0.8" strokeOpacity="0.6" />
      <path d="M18 31 L22 26 L26 31 L22 36Z" fill="#a78bfa" />
      <circle cx="22" cy="31" r="2.2" fill="#6d28d9" />
      <circle cx="21" cy="30" r="0.8" fill="white" fillOpacity="0.9" />
      <path d="M38 31 L42 26 L46 31 L42 36Z" fill="#a78bfa" />
      <circle cx="42" cy="31" r="2.2" fill="#6d28d9" />
      <circle cx="41" cy="30" r="0.8" fill="white" fillOpacity="0.9" />
      <line x1="17" y1="23" x2="27" y2="20" stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="37" y1="20" x2="47" y2="23" stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="22" y1="40" x2="42" y2="40" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="32" y1="18" x2="32" y2="11" stroke="#7c3aed" strokeWidth="1.5" />
      <path d="M32 7 L29 12 L35 12Z" fill="#a78bfa" />
    </svg>
  )
}

function ScoutAvatar() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <defs>
        <radialGradient id="nv-bg" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#0c2a6e" />
          <stop offset="100%" stopColor="#050e28" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#nv-bg)" />
      <circle cx="32" cy="34" r="18" fill="#0a1e5c" stroke="#3b82f6" strokeWidth="0.8" strokeOpacity="0.5" />
      <circle cx="24" cy="33" r="6.5" fill="#1e40af" />
      <circle cx="40" cy="33" r="6.5" fill="#1e40af" />
      <circle cx="24" cy="33" r="4.5" fill="#93c5fd" />
      <circle cx="40" cy="33" r="4.5" fill="#93c5fd" />
      <circle cx="24" cy="33" r="2.5" fill="#1d4ed8" />
      <circle cx="40" cy="33" r="2.5" fill="#1d4ed8" />
      <circle cx="25" cy="32" r="1" fill="white" />
      <circle cx="41" cy="32" r="1" fill="white" />
      <path d="M24 43 Q32 49 40 43" stroke="#93c5fd" strokeWidth="2" fill="none" strokeLinecap="round" />
      <line x1="32" y1="16" x2="32" y2="8" stroke="#60a5fa" strokeWidth="1.5" />
      <circle cx="32" cy="6" r="3.5" fill="#3b82f6" />
      <path d="M32 3.5 L32.8 5.5 L35 5.5 L33.3 6.8 L33.9 8.8 L32 7.5 L30.1 8.8 L30.7 6.8 L29 5.5 L31.2 5.5Z" fill="white" fillOpacity="0.9" />
    </svg>
  )
}

function CipherAvatar() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <defs>
        <radialGradient id="ci-bg" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#0c3340" />
          <stop offset="100%" stopColor="#020e14" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#ci-bg)" />
      <rect x="10" y="20" width="44" height="26" rx="4" fill="#0a2030" stroke="#06b6d4" strokeWidth="0.8" strokeOpacity="0.6" />
      <rect x="14" y="29" width="36" height="7" rx="3.5" fill="#0e3850" />
      <rect x="14" y="29" width="36" height="7" rx="3.5" fill="#06b6d4" fillOpacity="0.15" />
      <rect x="18" y="30.5" width="12" height="4" rx="2" fill="#06b6d4" fillOpacity="0.7" />
      <circle cx="36" cy="32.5" r="1.2" fill="#06b6d4" fillOpacity="0.5" />
      <circle cx="40" cy="32.5" r="1.2" fill="#06b6d4" fillOpacity="0.5" />
      <circle cx="44" cy="32.5" r="1.2" fill="#06b6d4" fillOpacity="0.5" />
      <line x1="22" y1="40" x2="42" y2="40" stroke="#0891b2" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="3 2" />
      <circle cx="10" cy="33" r="2" fill="#0e7490" />
      <circle cx="54" cy="33" r="2" fill="#0e7490" />
    </svg>
  )
}

function EchoAvatar() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <defs>
        <radialGradient id="ec-bg" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#451a03" />
          <stop offset="100%" stopColor="#15080a" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#ec-bg)" />
      <ellipse cx="32" cy="34" rx="19" ry="16" fill="#2c1106" stroke="#f59e0b" strokeWidth="0.8" strokeOpacity="0.5" />
      <circle cx="20" cy="31" r="5" fill="#78350f" /><circle cx="20" cy="31" r="3.5" fill="#fbbf24" /><circle cx="20" cy="31" r="2" fill="#92400e" /><circle cx="19.5" cy="30.5" r="0.8" fill="white" />
      <circle cx="32" cy="29" r="5.5" fill="#78350f" /><circle cx="32" cy="29" r="4" fill="#fbbf24" /><circle cx="32" cy="29" r="2.2" fill="#92400e" /><circle cx="31.5" cy="28.5" r="0.9" fill="white" />
      <circle cx="44" cy="31" r="5" fill="#78350f" /><circle cx="44" cy="31" r="3.5" fill="#fbbf24" /><circle cx="44" cy="31" r="2" fill="#92400e" /><circle cx="43.5" cy="30.5" r="0.8" fill="white" />
      <path d="M20 41 Q24 38 28 41 Q32 44 36 41 Q40 38 44 41" stroke="#fbbf24" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  )
}

function CriticAvatar() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <defs>
        <radialGradient id="ti-bg" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#4c0519" />
          <stop offset="100%" stopColor="#160008" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#ti-bg)" />
      <rect x="11" y="16" width="42" height="32" rx="4" fill="#2d0a10" stroke="#f43f5e" strokeWidth="0.8" strokeOpacity="0.6" />
      <rect x="11" y="38" width="42" height="10" rx="4" fill="#200818" />
      <rect x="15" y="24" width="14" height="6" rx="3" fill="#be123c" /><rect x="15" y="25" width="14" height="3" rx="1.5" fill="#fb7185" fillOpacity="0.7" />
      <rect x="35" y="24" width="14" height="6" rx="3" fill="#be123c" /><rect x="35" y="25" width="14" height="3" rx="1.5" fill="#fb7185" fillOpacity="0.7" />
      <line x1="14" y1="22" x2="30" y2="19" stroke="#e11d48" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="34" y1="19" x2="50" y2="22" stroke="#e11d48" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M20 41 L32 38 L44 41" stroke="#f43f5e" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M34 10 L30 17 L34 17 L30 24" stroke="#fb7185" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SageAvatar() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <defs>
        <radialGradient id="sg-bg" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#0f3027" />
          <stop offset="100%" stopColor="#041510" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#sg-bg)" />
      <circle cx="32" cy="34" r="18" fill="#0a2820" stroke="#14b8a6" strokeWidth="0.8" strokeOpacity="0.5" />
      <rect x="14" y="27" width="14" height="11" rx="5.5" fill="none" stroke="#2dd4bf" strokeWidth="1.8" />
      <rect x="36" y="27" width="14" height="11" rx="5.5" fill="none" stroke="#2dd4bf" strokeWidth="1.8" />
      <line x1="28" y1="32" x2="36" y2="32" stroke="#2dd4bf" strokeWidth="1.5" />
      <line x1="14" y1="31" x2="11" y2="29" stroke="#2dd4bf" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="50" y1="31" x2="53" y2="29" stroke="#2dd4bf" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 34 Q21 30 26 34" stroke="#5eead4" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M38 34 Q43 30 48 34" stroke="#5eead4" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M25 43 Q32 48 39 43" stroke="#2dd4bf" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="32" cy="14" r="2" fill="#14b8a6" fillOpacity="0.8" />
      <circle cx="26" cy="16" r="1.2" fill="#14b8a6" fillOpacity="0.5" />
      <circle cx="38" cy="16" r="1.2" fill="#14b8a6" fillOpacity="0.5" />
    </svg>
  )
}

function ForgeAvatar() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <defs>
        <radialGradient id="fo-bg" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#1c1207" />
          <stop offset="100%" stopColor="#0a0800" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#fo-bg)" />
      {/* Helmet-like face */}
      <path d="M14 36 Q14 18 32 16 Q50 18 50 36 L50 44 Q50 50 32 50 Q14 50 14 44Z" fill="#1a1008" stroke="#f97316" strokeWidth="0.8" strokeOpacity="0.6" />
      {/* Glowing eyes */}
      <rect x="18" y="28" width="11" height="5" rx="2.5" fill="#ea580c" />
      <rect x="35" y="28" width="11" height="5" rx="2.5" fill="#ea580c" />
      <rect x="18" y="28.5" width="11" height="2.5" rx="1.25" fill="#fdba74" fillOpacity="0.8" />
      <rect x="35" y="28.5" width="11" height="2.5" rx="1.25" fill="#fdba74" fillOpacity="0.8" />
      {/* Determined mouth */}
      <path d="M22 40 L28 37 L32 39 L36 37 L42 40" stroke="#f97316" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* Flame on top */}
      <path d="M32 14 Q28 8 30 4 Q33 7 32 10 Q35 5 38 8 Q36 11 32 14Z" fill="#f97316" fillOpacity="0.9" />
      <path d="M32 13 Q30 9 31 6 Q33 9 32 13Z" fill="#fde68a" />
    </svg>
  )
}

// ─── Agent data ───────────────────────────────────────────────────────────────

export const AGENTS = [
  {
    id:          'decision',
    name:        'AXIOM',
    subtitle:    'Strategy',
    tagline:     'Decide with clarity.',
    tag:         'STRATEGY',
    example:     'What car should I buy for a family of 4?',
    accent:      '#a78bfa',
    glow:        'rgba(167,139,250,0.12)',
    border:      'rgba(139,92,246,0.22)',
    borderSel:   'rgba(167,139,250,0.7)',
    Avatar:      AxiomAvatar,
  },
  {
    id:          'research',
    name:        'SCOUT',
    subtitle:    'Research',
    tagline:     'Find what matters.',
    tag:         'RESEARCH',
    example:     'How does mRNA vaccine technology work?',
    accent:      '#93c5fd',
    glow:        'rgba(59,130,246,0.12)',
    border:      'rgba(59,130,246,0.22)',
    borderSel:   'rgba(147,197,253,0.7)',
    Avatar:      ScoutAvatar,
  },
  {
    id:          'intelligence',
    name:        'CIPHER',
    subtitle:    'Analysis',
    tagline:     'Understand what it means.',
    tag:         'ANALYSIS',
    example:     "What's the current state of quantum computing in 2026?",
    accent:      '#67e8f9',
    glow:        'rgba(6,182,212,0.12)',
    border:      'rgba(6,182,212,0.22)',
    borderSel:   'rgba(103,232,249,0.7)',
    Avatar:      CipherAvatar,
  },
  {
    id:          'perspectives',
    name:        'ECHO',
    subtitle:    'Perspectives',
    tagline:     'See every side.',
    tag:         'PERSPECTIVES',
    example:     'Strongest arguments for and against remote work?',
    accent:      '#fcd34d',
    glow:        'rgba(245,158,11,0.12)',
    border:      'rgba(245,158,11,0.22)',
    borderSel:   'rgba(252,211,77,0.7)',
    Avatar:      EchoAvatar,
  },
  {
    id:          'competitive',
    name:        'CRITIC',
    subtitle:    'Challenge',
    tagline:     'Pressure-test the truth.',
    tag:         'CHALLENGE',
    example:     'What are the biggest risks in building a consumer AI startup right now?',
    accent:      '#fda4af',
    glow:        'rgba(244,63,94,0.12)',
    border:      'rgba(244,63,94,0.22)',
    borderSel:   'rgba(253,164,175,0.7)',
    Avatar:      CriticAvatar,
  },
  {
    id:          'action',
    name:        'FORGE',
    subtitle:    'Execution',
    tagline:     'Turn ideas into action.',
    tag:         'EXECUTION',
    example:     'Give me a step-by-step plan to start a SaaS business',
    accent:      '#fdba74',
    glow:        'rgba(249,115,22,0.12)',
    border:      'rgba(249,115,22,0.22)',
    borderSel:   'rgba(253,186,116,0.7)',
    Avatar:      ForgeAvatar,
  },
  {
    id:          'explainer',
    name:        'SAGE',
    subtitle:    'Understanding',
    tagline:     'Make it click.',
    tag:         'UNDERSTANDING',
    example:     'How does raising interest rates affect housing?',
    accent:      '#5eead4',
    glow:        'rgba(20,184,166,0.12)',
    border:      'rgba(20,184,166,0.22)',
    borderSel:   'rgba(94,234,212,0.7)',
    Avatar:      SageAvatar,
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  onSelect:      (example: string, agentId: string) => void
  disabled?:     boolean
  selectedAgent?: string | null
}

function AgentCardsInner({ onSelect, disabled, selectedAgent }: Props) {
  const hasSelection = Boolean(selectedAgent)

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <p className="text-[10px] font-mono text-slate-600 tracking-[0.18em]">CHOOSE YOUR AGENT</p>
        {selectedAgent && (
          <motion.span
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-[9px] font-mono tracking-[0.15em]"
            style={{ color: AGENTS.find(a => a.id === selectedAgent)?.accent ?? '#67e8f9' }}
          >
            · {AGENTS.find(a => a.id === selectedAgent)?.name} SELECTED
          </motion.span>
        )}
      </div>

      {/* Horizontal scroll row */}
      <div
        className="flex gap-3 overflow-x-auto pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {AGENTS.map((agent, i) => {
          const isSelected = selectedAgent === agent.id
          const isDimmed   = hasSelection && !isSelected

          return (
            <motion.button
              key={agent.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: isDimmed ? 0.38 : 1,
                y:       0,
                scale:   isSelected ? 1.03 : 1,
              }}
              transition={{ delay: i * 0.045, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => !disabled && onSelect(agent.example, agent.id)}
              disabled={disabled}
              whileHover={disabled ? {} : { y: -3, scale: isSelected ? 1.04 : 1.02, opacity: 1 }}
              whileTap={disabled   ? {} : { scale: 0.96 }}
              className="group relative flex-shrink-0 flex flex-col items-center text-center rounded-2xl transition-colors duration-200 disabled:cursor-not-allowed cursor-pointer overflow-hidden"
              style={{
                width:     '160px',
                padding:   '14px 14px 14px',
                background: isSelected
                  ? `linear-gradient(160deg, ${agent.glow.replace('0.12', '0.28')} 0%, rgba(8,12,24,0.98) 100%)`
                  : 'linear-gradient(160deg, rgba(12,18,35,0.95) 0%, rgba(6,10,20,0.9) 100%)',
                border: `1.5px solid ${isSelected ? agent.borderSel : agent.border}`,
                boxShadow: isSelected
                  ? `0 0 28px ${agent.glow.replace('0.12', '0.35')}, 0 0 8px ${agent.glow.replace('0.12', '0.2')}, inset 0 1px 0 rgba(255,255,255,0.06)`
                  : 'inset 0 1px 0 rgba(255,255,255,0.03)',
              }}
            >
              {/* Top shimmer */}
              <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{
                  background: `linear-gradient(90deg, transparent 0%, ${agent.accent} 50%, transparent 100%)`,
                  opacity:    isSelected ? 0.9 : 0.2,
                  transition: 'opacity 0.2s',
                }}
              />

              {/* Hover glow overlay */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                style={{ background: `radial-gradient(ellipse at 50% 0%, ${agent.glow} 0%, transparent 70%)` }}
              />

              {/* ✓ Selected badge */}
              {isSelected && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute top-2 right-2 flex items-center justify-center h-4 w-4 rounded-full z-10"
                  style={{ background: agent.accent, boxShadow: `0 0 8px ${agent.accent}` }}
                >
                  <Check className="h-2.5 w-2.5" style={{ color: '#040d18', strokeWidth: 3 }} />
                </motion.div>
              )}

              {/* Avatar */}
              <div className="relative mb-2.5">
                <div
                  className="absolute inset-0 rounded-full blur-md transition-opacity duration-200"
                  style={{
                    background: agent.accent,
                    transform:  'scale(0.65)',
                    opacity:    isSelected ? 0.65 : 0.3,
                  }}
                />
                <div className="relative">
                  <agent.Avatar />
                </div>
              </div>

              {/* Name */}
              <span
                className="text-[17px] font-bold tracking-[0.08em] leading-none mb-1.5 transition-colors duration-150"
                style={{ color: isSelected ? agent.accent : '#e2e8f0' }}
              >
                {agent.name}
              </span>

              {/* Subtitle */}
              <span
                className="text-[13px] font-semibold leading-none mb-2.5 transition-colors duration-150"
                style={{ color: agent.accent, opacity: isSelected ? 0.95 : 0.8 }}
              >
                {agent.subtitle}
              </span>

              {/* Tagline */}
              <span className="text-[12px] leading-snug text-slate-300 group-hover:text-slate-100 transition-colors duration-150 px-1">
                {agent.tagline}
              </span>

              {/* Mode badge */}
              <div
                className="mt-3 px-2.5 py-1 rounded-full transition-all duration-200"
                style={{
                  background: isSelected
                    ? agent.glow.replace('0.12', '0.25')
                    : agent.glow.replace('0.12', '0.08'),
                  border: `1px solid ${isSelected ? agent.borderSel : agent.border}`,
                }}
              >
                <span
                  className="text-[11px] font-mono tracking-[0.08em]"
                  style={{ color: agent.accent, opacity: isSelected ? 1 : 0.9 }}
                >
                  {agent.tag}
                </span>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

export const AgentCards = memo(AgentCardsInner)
