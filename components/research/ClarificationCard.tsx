'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import type { ClarificationQuestion } from '@/ai/schemas'

interface Props {
  question: ClarificationQuestion
  index: number
  selected: string | undefined
  onSelect: (value: string) => void
}

export function ClarificationCard({ question, index, selected, onSelect }: Props) {
  const [showInput, setShowInput] = useState(false)
  const [customValue, setCustomValue] = useState('')

  const handleOther = () => {
    setShowInput(true)
    setCustomValue('')
    onSelect('')
  }

  const handleCustomSubmit = () => {
    const val = customValue.trim()
    if (!val) return
    onSelect(val)
    setShowInput(false)
    // keep customValue so it shows in the confirmed state
  }

  const isCustomSelected = selected && !question.options.includes(selected)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="rounded-xl bg-[#0a1830] border border-cyan-500/15 p-5 space-y-4"
    >
      {/* Question text */}
      <p className="text-sm font-medium text-slate-200 leading-relaxed">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-cyan-500/10 border border-cyan-500/25 font-mono text-[10px] font-bold text-cyan-400 mr-2.5">
          {index + 1}
        </span>
        {question.question}
      </p>

      {/* Options */}
      <div className="flex flex-wrap gap-2">
        {question.options.map(opt => (
          <button
            key={opt}
            onClick={() => { setShowInput(false); onSelect(opt) }}
            className={`px-3.5 py-1.5 rounded-lg text-sm border transition-all duration-150 font-medium ${
              selected === opt
                ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                : 'border-white/[0.08] bg-white/[0.02] text-slate-400 hover:border-white/[0.2] hover:text-slate-200'
            }`}
          >
            {opt}
          </button>
        ))}

        {/* Other button */}
        <button
          onClick={handleOther}
          className={`px-3.5 py-1.5 rounded-lg text-sm border transition-all duration-150 font-medium ${
            isCustomSelected || showInput
              ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300'
              : 'border-white/[0.08] bg-white/[0.02] text-slate-500 hover:border-white/[0.2] hover:text-slate-300'
          }`}
        >
          Other…
        </button>
      </div>

      {/* Custom text input */}
      <AnimatePresence>
        {showInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex gap-2 overflow-hidden"
          >
            <input
              autoFocus
              type="text"
              value={customValue}
              onChange={e => setCustomValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCustomSubmit() }}
              placeholder="Type your answer..."
              className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-white/[0.08] bg-[#060c16] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/15 transition-all"
            />
            <button
              onClick={handleCustomSubmit}
              disabled={!customValue.trim()}
              className="px-3.5 py-1.5 rounded-lg text-sm font-medium bg-cyan-500 text-[#060c16] disabled:opacity-40 hover:bg-cyan-400 transition-colors"
            >
              Set
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmed custom value */}
      {isCustomSelected && !showInput && (
        <p className="text-xs font-mono text-cyan-400 pl-1">
          ✓ &ldquo;{selected}&rdquo;
          <button
            onClick={handleOther}
            className="ml-2 text-slate-600 hover:text-slate-400 underline text-xs"
          >
            edit
          </button>
        </p>
      )}
    </motion.div>
  )
}
