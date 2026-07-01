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
      style={{ background: 'white', border: '1px solid #e8e2d9', borderRadius: 12 }}
      className="p-5 space-y-4"
    >
      {/* Question text */}
      <p style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: '#1e293b', lineHeight: 1.6 }} className="font-medium leading-relaxed">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-md font-mono text-[10px] font-bold mr-2.5" style={{ background: '#f0f4f8', border: '1px solid #e8e2d9', color: '#1e3a5f' }}>
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
                ? 'border-[#1e3a5f] bg-[#f0f4f8] text-[#1e3a5f]'
                : 'border-[#e8e2d9] bg-white text-[#1e293b] hover:border-[#1e3a5f]/40 hover:text-[#1e3a5f]'
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
              ? 'border-[#1e3a5f] bg-[#f0f4f8] text-[#1e3a5f]'
              : 'border-[#e8e2d9] bg-white text-[#64748b] hover:border-[#1e3a5f]/40 hover:text-[#1e3a5f]'
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
              className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-[#e8e2d9] bg-white text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#1e3a5f]/50 focus:ring-1 focus:ring-[#1e3a5f]/15 transition-all"
            />
            <button
              onClick={handleCustomSubmit}
              disabled={!customValue.trim()}
              className="px-3.5 py-1.5 rounded-lg text-sm font-medium bg-[#1e3a5f] text-white disabled:opacity-40 hover:bg-[#1e3a5f]/90 transition-colors"
            >
              Set
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmed custom value */}
      {isCustomSelected && !showInput && (
        <p className="text-xs font-mono pl-1" style={{ color: '#1e3a5f' }}>
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
