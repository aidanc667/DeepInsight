'use client'

import { motion } from 'motion/react'
import { AlertTriangle, Swords } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { ConflictItem } from '@/lib/schemas'

interface Props {
  items: ConflictItem[] | undefined
}

const severityConfig: Record<ConflictItem['severity'], { badge: string; dot: string }> = {
  low:    { badge: 'bg-slate-100 text-slate-500 border-slate-200',    dot: 'bg-slate-300' },
  medium: { badge: 'bg-amber-50 text-amber-600 border-amber-200',     dot: 'bg-amber-400' },
  high:   { badge: 'bg-red-50 text-red-600 border-red-200',           dot: 'bg-red-400' },
}

export function ConflictZone({ items }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.12 }}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
    >
      <div className="flex items-center gap-2.5 mb-5">
        <div className="h-7 w-7 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
          <Swords className="h-3.5 w-3.5 text-amber-600" />
        </div>
        <div>
          <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-widest">Box 3</p>
          <h2 className="text-sm font-semibold text-slate-900 leading-none mt-0.5">Conflict Zone</h2>
        </div>
      </div>
      <p className="text-xs text-slate-400 mb-4">Where the models disagree</p>

      {items && items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item, i) => {
            const cfg = severityConfig[item.severity] ?? severityConfig['low']
            return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                  <span className="text-xs font-semibold text-slate-700">{item.topic}</span>
                </div>
                {item.severity && (
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-medium ${cfg.badge}`}>
                    {item.severity}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{item.modelA}</p>
              <p className="text-xs text-slate-500 leading-relaxed pl-3 border-l-2 border-slate-200">{item.modelB}</p>
            </motion.div>
            )
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {[0, 1].map(i => (
            <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 space-y-2">
              <Skeleton className="h-3 w-2/3 bg-slate-200 rounded-full" />
              <Skeleton className="h-3 w-full bg-slate-100 rounded-full" />
              <Skeleton className="h-3 w-5/6 bg-slate-100 rounded-full" />
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
