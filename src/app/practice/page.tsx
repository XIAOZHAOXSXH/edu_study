'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, ChevronLeft, ChevronRight, Sparkles, Star } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer'
import { QuestionCard } from '@/components/questions/QuestionCard'
import { ProgressBar } from '@/components/practice/ProgressBar'
import type { AIProviderConfig, PracticeMode, QuestionOption, QuestionType } from '@/lib/types'

interface Question {
  id: string
  type: QuestionType
  content: string
  options: QuestionOption[] | null
  answer: string
  explanation?: string | null
  isFavorite?: boolean
}

interface SubmitResult {
  isCorrect: boolean | null
  aiScore: number | null
  aiComment: string | null
}

interface PracticeResponse {
  questions?: Question[]
  error?: string
}

interface SubmitResponse {
  isCorrect?: boolean | null
  aiScore?: number | null
  aiComment?: string | null
  error?: string
}

function getAIConfig(): Partial<AIProviderConfig> | undefined {
  if (typeof window === 'undefined') return undefined

  try {
    const saved = window.localStorage.getItem('ai_config')
    return saved ? (JSON.parse(saved) as Partial<AIProviderConfig>) : undefined
  } catch {
    return undefined
  }
}

function normalizeAnswerForSubmit(answer: string | string[]) {
  return Array.isArray(answer) ? [...answer].sort().join(',') : answer
}

function PracticeContent() {
  const searchParams = useSearchParams()
  const mode = (searchParams.get('mode') || 'SEQUENTIAL') as PracticeMode
  const examId = searchParams.get('examId')
  const category = searchParams.get('category')
  const wrongOnly = searchParams.get('wrongOnly') === 'true'
  const favoriteOnly = searchParams.get('favoriteOnly') === 'true'

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Record<string, string | string[]>>({})
  const [showResults, setShowResults] = useState<Record<string, boolean>>({})
  const [results, setResults] = useState<Record<string, SubmitResult>>({})
  const [favorites, setFavorites] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [showAIConfirm, setShowAIConfirm] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [aiExplanation, setAIExplanation] = useState('')

  const fetchQuestions = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({ mode, limit: '50' })
      if (examId) params.set('examId', examId)
      if (category) params.set('category', category)
      if (wrongOnly) params.set('wrongOnly', 'true')
      if (favoriteOnly) params.set('favoriteOnly', 'true')

      const response = await fetch(`/api/practice?${params.toString()}`)
      const data = (await response.json()) as PracticeResponse

      if (!response.ok || data.error) {
        throw new Error(data.error || '获取题目失败')
      }

      const nextQuestions = data.questions ?? []
      const favoriteState: Record<string, boolean> = {}
      nextQuestions.forEach((question) => {
        if (question.isFavorite) favoriteState[question.id] = true
      })

      setQuestions(nextQuestions)
      setFavorites(favoriteState)
      setCurrentIndex(0)
      setUserAnswers({})
      setShowResults({})
      setResults({})
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : '获取题目失败')
    } finally {
      setLoading(false)
    }
  }, [category, examId, favoriteOnly, mode, wrongOnly])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchQuestions()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [fetchQuestions])

  const currentQuestion = questions[currentIndex]

  const handleAnswer = (answer: string | string[]) => {
    if (!currentQuestion) return
    setUserAnswers((prev) => ({ ...prev, [currentQuestion.id]: answer }))
  }

  const handleSubmit = async () => {
    if (!currentQuestion) return

    const userAnswer = userAnswers[currentQuestion.id]
    const isEmpty =
      userAnswer === undefined ||
      userAnswer === '' ||
      (Array.isArray(userAnswer) && userAnswer.length === 0)
    if (isEmpty) return

    setSubmitting(true)
    setError('')

    try {
      const config = getAIConfig()
      const response = await fetch('/api/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          userAnswer: normalizeAnswerForSubmit(userAnswer),
          mode,
          provider: config?.provider,
          config,
        }),
      })
      const data = (await response.json()) as SubmitResponse

      if (!response.ok || data.error) {
        throw new Error(data.error || '提交答案失败')
      }

      setResults((prev) => ({
        ...prev,
        [currentQuestion.id]: {
          isCorrect: data.isCorrect ?? null,
          aiScore: data.aiScore ?? null,
          aiComment: data.aiComment ?? null,
        },
      }))
      setShowResults((prev) => ({ ...prev, [currentQuestion.id]: true }))
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '提交答案失败')
    } finally {
      setSubmitting(false)
    }
  }

  const confirmAIExplanation = async () => {
    setShowAIConfirm(false)
    if (!currentQuestion) return

    setShowAI(true)
    setAIExplanation('')

    try {
      const config = getAIConfig()
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'explain',
          question: currentQuestion.content,
          options: currentQuestion.options,
          correctAnswer: currentQuestion.answer,
          userAnswer: userAnswers[currentQuestion.id],
          provider: config?.provider,
          config,
        }),
      })
      const data = (await response.json()) as { explanation?: string; error?: string }

      if (!response.ok || data.error) {
        throw new Error(data.error || 'AI 解析失败')
      }

      setAIExplanation(data.explanation || 'AI 未返回解析内容。')
    } catch (aiError) {
      setAIExplanation(aiError instanceof Error ? aiError.message : 'AI 解析失败，请检查配置。')
    }
  }

  const toggleFavorite = async () => {
    if (!currentQuestion) return

    const id = currentQuestion.id
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }))

    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: id }),
      })
      const data = (await response.json()) as { favorited?: boolean; error?: string }
      if (!response.ok || data.error) throw new Error(data.error || '收藏失败')
      setFavorites((prev) => ({ ...prev, [id]: Boolean(data.favorited) }))
    } catch {
      setFavorites((prev) => ({ ...prev, [id]: !prev[id] }))
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600" />
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
        <p className="text-gray-500">{error || '暂无题目，请先在题库中录入或导入题目。'}</p>
      </div>
    )
  }

  const result = currentQuestion ? results[currentQuestion.id] : undefined
  const isShown = currentQuestion ? showResults[currentQuestion.id] : false
  const title = wrongOnly
    ? '错题练习'
    : favoriteOnly
      ? '收藏练习'
      : mode === 'EXAM'
        ? '试卷答题'
        : mode === 'RANDOM'
          ? '随机刷题'
          : '顺序刷题'

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-3">
        <span className="whitespace-nowrap text-sm font-medium text-gray-700">{title}</span>
        <span className="whitespace-nowrap text-sm text-gray-500">
          {currentIndex + 1}/{questions.length}
        </span>
        <ProgressBar current={currentIndex + 1} total={questions.length} />
        <button
          onClick={toggleFavorite}
          className="rounded-lg p-1.5 transition-colors hover:bg-gray-100"
          aria-label="收藏当前题目"
        >
          <Star
            className={`h-5 w-5 ${
              currentQuestion && favorites[currentQuestion.id]
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-400'
            }`}
          />
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <AnimatePresence mode="wait">
        {currentQuestion && (
          <QuestionCard
            key={currentQuestion.id}
            question={currentQuestion}
            userAnswer={userAnswers[currentQuestion.id] || ''}
            showResult={Boolean(isShown)}
            isCorrect={result?.isCorrect ?? null}
            onAnswer={handleAnswer}
          />
        )}
      </AnimatePresence>

      {isShown && result && (result.aiScore !== null || result.aiComment) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border-l-4 border-primary-500 bg-white p-4 shadow-sm"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="font-medium text-gray-900">AI 判分</span>
            {result.aiScore !== null && (
              <span className="text-2xl font-bold text-primary-600">{result.aiScore} 分</span>
            )}
          </div>
          {result.aiComment && <p className="text-sm leading-6 text-gray-600">{result.aiComment}</p>}
        </motion.div>
      )}

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className="flex-1"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          上一题
        </Button>

        {!isShown ? (
          <Button onClick={handleSubmit} loading={submitting} className="flex-1">
            提交答案
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
            disabled={currentIndex === questions.length - 1}
            className="flex-1"
          >
            下一题
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      <Button variant="ghost" onClick={() => setShowAIConfirm(true)} className="w-full">
        <Sparkles className="mr-2 h-4 w-4" />
        AI 解析
      </Button>

      <AnimatePresence>
        {showAIConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowAIConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl bg-white p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">确认使用 AI 解析？</h3>
              </div>
              <p className="mb-5 text-sm leading-6 text-gray-600">
                AI 解析会调用已配置的大模型接口。答题过程中提前查看解析可能影响练习效果。
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowAIConfirm(false)} className="flex-1">
                  取消
                </Button>
                <Button onClick={confirmAIExplanation} className="flex-1">
                  确定
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAI && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowAI(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
                <Sparkles className="h-5 w-5 text-primary-600" />
                AI 解析
              </h3>
              {aiExplanation ? (
                <MarkdownRenderer content={aiExplanation} />
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600" />
                  <p className="text-sm text-gray-500">AI 正在解析...</p>
                </div>
              )}
              <Button variant="outline" onClick={() => setShowAI(false)} className="mt-4 w-full">
                关闭
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function PracticePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600" />
        </div>
      }
    >
      <PracticeContent />
    </Suspense>
  )
}
