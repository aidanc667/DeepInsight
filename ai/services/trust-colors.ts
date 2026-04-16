// ─── Trust Score Color Utilities ──────────────────────────────────────────────
// Maps TrustEngine alertLevel → Tailwind CSS classes and hex color values.
// Used by: components/research/TrustScoreBadge.tsx, components/research/Blindspot.tsx

export function blindspotBorderClass(alertLevel: 'green' | 'orange' | 'red'): string {
  return {
    green: 'border-zinc-700',
    orange: 'border-orange-500',
    red: 'border-red-500',
  }[alertLevel]
}

export function blindspotBgClass(alertLevel: 'green' | 'orange' | 'red'): string {
  return {
    green: '',
    orange: 'bg-orange-950/30',
    red: 'bg-red-950/30',
  }[alertLevel]
}

export function trustScoreColor(alertLevel: 'green' | 'orange' | 'red'): string {
  return {
    green: 'text-emerald-400',
    orange: 'text-orange-400',
    red: 'text-red-400',
  }[alertLevel]
}

export function trustScoreRingColor(alertLevel: 'green' | 'orange' | 'red'): string {
  return {
    green: '#34d399',
    orange: '#fb923c',
    red: '#f87171',
  }[alertLevel]
}
