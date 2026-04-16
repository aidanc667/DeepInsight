'use client'

import { motion } from 'motion/react'
import { ShieldAlert } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import ReactMarkdown from 'react-markdown'

interface Props {
  content: string | undefined
  alertLevel: 'green' | 'orange' | 'red'
}

const alertConfig = {
  green:  { wrapper: 'border-slate-200 bg-white',           icon: 'bg-slate-50 border-slate-100',  iconColor: 'text-slate-500',  label: 'text-slate-500' },
  orange: { wrapper: 'border-orange-200 bg-orange-50/50',   icon: 'bg-orange-50 border-orange-100', iconColor: 'text-orange-500', label: 'text-orange-500' },
  red:    { wrapper: 'border-red-200 bg-red-50/50',         icon: 'bg-red-50 border-red-100',       iconColor: 'text-red-500',    label: 'text-red-500' },
}

export function Blindspot({ content, alertLevel }: Props) {
  const cfg = alertConfig[alertLevel]
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.16 }}
      className={`rounded-2xl border-2 shadow-sm p-6 transition-colors duration-500 ${cfg.wrapper}`}
    >
      <div className="flex items-center gap-2.5 mb-5">
        <div className={`h-7 w-7 rounded-lg border flex items-center justify-center ${cfg.icon}`}>
          <ShieldAlert className={`h-3.5 w-3.5 ${cfg.iconColor}`} />
        </div>
        <div>
          <p className={`text-[10px] font-semibold uppercase tracking-widest ${cfg.label}`}>Box 4</p>
          <h2 className="text-sm font-semibold text-slate-900 leading-none mt-0.5">Blindspot</h2>
        </div>
      </div>
      <p className="text-xs text-slate-400 mb-4">Devil&apos;s advocate · Red Team analysis</p>

      {content ? (
        <div className="prose prose-sm max-w-none text-slate-600 leading-relaxed prose-strong:text-slate-800">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      ) : (
        <div className="space-y-2.5">
          {[100, 88, 94, 80, 96].map((w, i) => (
            <Skeleton key={i} className="h-3.5 bg-slate-100 rounded-full" style={{ width: `${w}%` }} />
          ))}
        </div>
      )}
    </motion.div>
  )
}
