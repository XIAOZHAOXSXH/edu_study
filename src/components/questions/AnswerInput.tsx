'use client'

import { motion } from 'framer-motion'

interface AnswerInputProps {
  type: 'FILL_BLANK' | 'SHORT_ANSWER'
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function AnswerInput({ type, value, onChange, disabled }: AnswerInputProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {type === 'FILL_BLANK' ? (
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          placeholder="请输入答案"
          className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 transition-colors focus:border-primary-500 focus:outline-none disabled:bg-gray-50"
        />
      ) : (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          placeholder="请输入你的答案..."
          rows={6}
          className="w-full resize-none rounded-xl border-2 border-gray-200 px-4 py-3 transition-colors focus:border-primary-500 focus:outline-none disabled:bg-gray-50"
        />
      )}
    </motion.div>
  )
}
