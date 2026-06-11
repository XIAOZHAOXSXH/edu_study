'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { QUESTION_TYPE_LABELS, type QuestionType } from '@/lib/types'

interface Question {
  id: string
  type: QuestionType
  content: string
  answer: string
}

export default function FavoritesPage() {
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/favorites')
      .then((response) => response.json())
      .then((data: { questions?: Question[] }) => setQuestions(data.questions ?? []))
      .catch(() => undefined)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Star className="h-5 w-5 text-yellow-500" />
        <h1 className="text-xl font-bold text-gray-900">我的收藏</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600" />
        </div>
      ) : questions.length === 0 ? (
        <div className="py-12 text-center text-gray-500">暂无收藏</div>
      ) : (
        <div className="space-y-3">
          {questions.map((question, index) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="rounded-xl bg-white p-4 shadow-sm"
            >
              <span className="rounded bg-primary-100 px-2 py-1 text-xs text-primary-700">
                {QUESTION_TYPE_LABELS[question.type] ?? question.type}
              </span>
              <p className="mt-2 line-clamp-2 text-sm text-gray-900">{question.content}</p>
              <p className="mt-1 text-sm text-gray-500">答案：{question.answer}</p>
            </motion.div>
          ))}
        </div>
      )}

      {questions.length > 0 && (
        <Button className="w-full" onClick={() => router.push('/practice?favoriteOnly=true')}>
          开始练习收藏
        </Button>
      )}
    </div>
  )
}
