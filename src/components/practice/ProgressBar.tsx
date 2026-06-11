'use client'

import { motion } from 'framer-motion'

interface ProgressBarProps {
  current: number
  total: number
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const progress = (current / total) * 100

  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <motion.div
        className="bg-primary-600 h-2 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.3 }}
      />
    </div>
  )
}
