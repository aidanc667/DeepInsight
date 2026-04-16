'use client'

import { motion } from 'motion/react'
import { Lightbulb } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface Props {
  items: string[] | undefined
}

export function GamePlan({ items }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.2 }}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
    >
      <div className="flex items-center gap-2.5 mb-5">
        <div className="h-7 w-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
          <Lightbulb className="h-3.5 w-3.5 text-indigo-600" />
        </div>
        <div>
          <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-widest">Box 5</p>
          <h2 className="text-sm font-semibold text-slate-900 leading-none mt-0.5">Game Plan</h2>
        </div>
      </div>
      <p className="text-xs text-slate-400 mb-4">Your personalized next steps</p>

      {items && items.length > 0 ? (
        <ol className="space-y-3">
          {items.map((step, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              className="flex items-start gap-3"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white font-mono text-[10px] font-bold mt-0.5">
                {i + 1}
              </span>
              <span className="text-sm text-slate-600 leading-relaxed">{step}</span>
            </motion.li>
          ))}
        </ol>
      ) : (
        <div className="space-y-3">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-5 w-5 rounded-full shrink-0 bg-slate-100" />
              <Skeleton className="h-4 flex-1 bg-slate-100 rounded-full" />
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
