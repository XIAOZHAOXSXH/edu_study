'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Play } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { QUESTION_TYPE_LABELS, type QuestionType } from '@/lib/types'

type ExamConfig = Record<QuestionType, number>

interface ExamResponse {
  id?: string
  questionCount?: number
  error?: string
}

const defaultConfig: ExamConfig = {
  SINGLE_CHOICE: 10,
  MULTIPLE_CHOICE: 5,
  TRUE_FALSE: 10,
  FILL_BLANK: 5,
  SHORT_ANSWER: 3,
}

export default function ExamPage() {
  const router = useRouter()
  const [title, setTitle] = useState('模拟试卷')
  const [config, setConfig] = useState<ExamConfig>(defaultConfig)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    setCreating(true)
    setError('')

    try {
      const response = await fetch('/api/exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, config }),
      })
      const exam = (await response.json()) as ExamResponse

      if (!response.ok || exam.error || !exam.id) throw new Error(exam.error || '创建试卷失败')
      router.push(`/practice?mode=EXAM&examId=${exam.id}`)
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : '创建试卷失败')
    } finally {
      setCreating(false)
    }
  }

  const totalQuestions = Object.values(config).reduce((sum, count) => sum + count, 0)

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">组卷练习</h1>
        <p className="mt-1 text-sm text-gray-500">设置各题型数量，系统从题库中随机抽题。</p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">试卷名称</label>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-primary-500"
          placeholder="请输入试卷名称"
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">题型配置</h2>
        {Object.entries(config).map(([type, count]) => (
          <motion.div
            key={type}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-white p-4 shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="font-medium text-gray-900">{QUESTION_TYPE_LABELS[type as QuestionType]}</span>
              <span className="text-2xl font-bold text-primary-600">{count}</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              value={count}
              onChange={(event) =>
                setConfig((prev) => ({ ...prev, [type]: Number.parseInt(event.target.value, 10) }))
              }
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200"
            />
            <div className="mt-1 flex justify-between text-xs text-gray-500">
              <span>0</span>
              <span>20</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="rounded-xl bg-primary-50 p-4 text-center">
        <p className="text-sm text-gray-600">总题数</p>
        <p className="text-3xl font-bold text-primary-600">{totalQuestions}</p>
      </div>

      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <Button
        onClick={handleCreate}
        loading={creating}
        disabled={totalQuestions === 0}
        className="w-full"
        size="lg"
      >
        <Play className="mr-2 h-4 w-4" />
        生成试卷并开始
      </Button>
    </div>
  )
}
