'use client'

import { motion } from 'motion/react'
import { Skeleton } from '@/components/ui/skeleton'
import { FileText } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface Props {
  content: string | undefined
}

export function ExecutiveSynthesis({ content }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 col-span-2"
    >
      <div className="flex items-center gap-2.5 mb-5">
        <div className="h-7 w-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
          <FileText className="h-3.5 w-3.5 text-indigo-600" />
        </div>
        <div>
          <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-widest">Box 1</p>
          <h2 className="text-sm font-semibold text-slate-900 leading-none mt-0.5">Executive Synthesis</h2>
        </div>
      </div>

      {content ? (
        <div className="prose prose-sm max-w-none text-slate-600 leading-relaxed prose-headings:text-slate-900 prose-strong:text-slate-800">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      ) : (
        <div className="space-y-2.5">
          {[100, 92, 85, 100, 78].map((w, i) => (
            <Skeleton key={i} className="h-3.5 bg-slate-100 rounded-full" style={{ width: `${w}%` }} />
          ))}
        </div>
      )}
    </motion.div>
  )
}
