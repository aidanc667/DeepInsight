'use client'

import { motion } from 'motion/react'
import { CheckCircle2, Users } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface Props {
  items: string[] | undefined
}

export function UnifiedVerdict({ items }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.08 }}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
    >
      <div className="flex items-center gap-2.5 mb-5">
        <div className="h-7 w-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
          <Users className="h-3.5 w-3.5 text-emerald-600" />
        </div>
        <div>
          <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-widest">Box 2</p>
          <h2 className="text-sm font-semibold text-slate-900 leading-none mt-0.5">Unified Verdict</h2>
        </div>
      </div>
      <p className="text-xs text-slate-400 mb-4">Facts confirmed by all 3 models</p>

      {items && items.length > 0 ? (
        <ul className="space-y-2.5">
          {items.map((item, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-2.5"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <span className="text-sm text-slate-600 leading-relaxed">{item}</span>
            </motion.li>
          ))}
        </ul>
      ) : (
        <div className="space-y-2.5">
          {[90, 75, 85, 70].map((w, i) => (
            <Skeleton key={i} className="h-3.5 bg-slate-100 rounded-full" style={{ width: `${w}%` }} />
          ))}
        </div>
      )}
    </motion.div>
  )
}
