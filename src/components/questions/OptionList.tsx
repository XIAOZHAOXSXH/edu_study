'use client'

import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'

interface Option {
  label: string
  text: string
}

interface OptionListProps {
  options: Option[]
  selected: string | string[]
  correctAnswer: string
  showResult: boolean
  multiple?: boolean
  onSelect: (label: string) => void
}

function normalizeChoiceLabels(answer: string): string[] {
  const trimmed = answer.trim().toUpperCase()
  if (!trimmed) return []

  const hasSeparator = /[,，、\s;；|/]+/.test(trimmed)
  const parts = hasSeparator
    ? trimmed.split(/[,，、\s;；|/]+/)
    : /^[A-Z]+$/.test(trimmed)
      ? trimmed.split('')
      : [trimmed]

  return [...new Set(parts.map((part) => part.trim()).filter(Boolean))].sort()
}

export function OptionList({
  options,
  selected,
  correctAnswer,
  showResult,
  multiple = false,
  onSelect,
}: OptionListProps) {
  const correctLabels = multiple ? new Set(normalizeChoiceLabels(correctAnswer)) : null

  const isSelected = (label: string) => {
    if (multiple) {
      return Array.isArray(selected) && selected.includes(label)
    }
    return selected === label
  }

  const isCorrect = (label: string) => {
    if (multiple) {
      return correctLabels?.has(label.trim().toUpperCase()) ?? false
    }
    return correctAnswer === label
  }

  return (
    <div className="space-y-3">
      {options.map((option, index) => {
        const selected = isSelected(option.label)
        const correct = isCorrect(option.label)
        const showCorrect = showResult && correct && (!multiple || selected)
        const showWrong = showResult && selected && !correct
        const showMissed = showResult && multiple && correct && !selected

        return (
          <motion.button
            key={option.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => !showResult && onSelect(option.label)}
            disabled={showResult}
            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
              showCorrect
                ? 'border-green-500 bg-green-50'
                : showWrong
                ? 'border-red-500 bg-red-50'
                : showMissed
                ? 'border-amber-400 bg-amber-50'
                : selected
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  showCorrect
                    ? 'bg-green-500 text-white'
                    : showWrong
                    ? 'bg-red-500 text-white'
                    : showMissed
                    ? 'bg-amber-100 text-amber-700'
                    : selected
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {showCorrect ? (
                  <Check className="h-4 w-4" />
                ) : showWrong ? (
                  <X className="h-4 w-4" />
                ) : (
                  option.label
                )}
              </div>
              <span className="text-gray-900">{option.text}</span>
              {showMissed && (
                <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  漏选
                </span>
              )}
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}
