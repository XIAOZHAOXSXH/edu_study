'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { AlertTriangle, BookOpen, RefreshCw, Star } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface Stats {
  totalQuestions: number
  practicedToday: number
  correctRate: number
  practicedQuestions: number
  wrongQuestions: number
  favoriteCount: number
  totalAnswered: number
  recalculatedAt?: string
}

export default function ResultPage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [recalculating, setRecalculating] = useState(false)

  useEffect(() => {
    fetch('/api/stats', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data: Stats & { error?: string }) => {
        if (!data.error) setStats(data)
      })
      .catch(() => undefined)
      .finally(() => setLoading(false))
  }, [])

  const recalculateStats = useCallback(async () => {
    setRecalculating(true)
    try {
      const response = await fetch('/api/stats', {
        method: 'POST',
        cache: 'no-store',
      })
      const data = (await response.json()) as Stats & { error?: string }
      if (!data.error) setStats(data)
    } catch {
      // Keep the previous statistics visible if recalculation fails.
    } finally {
      setRecalculating(false)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-4">
        <p className="text-gray-500">暂无统计数据</p>
      </div>
    )
  }

  const bigCards = [
    { label: '总题数', value: stats.totalQuestions, color: 'text-primary-600' },
    { label: '今日练习', value: stats.practicedToday, color: 'text-green-600' },
    { label: '正确率', value: `${stats.correctRate}%`, color: 'text-orange-600' },
  ]

  const smallCards = [
    { label: '已练题目', value: stats.practicedQuestions },
    { label: '错题数量', value: stats.wrongQuestions },
    { label: '收藏数量', value: stats.favoriteCount },
  ]

  return (
    <div className="space-y-6 p-4">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">学习统计</h1>
            <p className="mt-1 text-sm text-gray-500">累计答题 {stats.totalAnswered} 次</p>
          </div>
          <Button variant="outline" size="sm" loading={recalculating} onClick={() => void recalculateStats()}>
            {!recalculating && <RefreshCw className="mr-2 h-4 w-4" />}
            重新统计
          </Button>
        </div>
        {stats.recalculatedAt && (
          <p className="mt-2 text-xs text-gray-400">
            最近统计：{new Date(stats.recalculatedAt).toLocaleString()}
          </p>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-3 gap-4"
      >
        {bigCards.map((card) => (
          <div key={card.label} className="rounded-2xl bg-white p-4 text-center shadow-sm">
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            <p className="mt-1 text-xs text-gray-500">{card.label}</p>
          </div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-4"
      >
        {smallCards.map((card) => (
          <div key={card.label} className="rounded-xl bg-gray-50 p-4 text-center">
            <p className="text-xl font-semibold text-gray-900">{card.value}</p>
            <p className="mt-1 text-xs text-gray-500">{card.label}</p>
          </div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <Button onClick={() => router.push('/practice?wrongOnly=true')} variant="outline" className="w-full" size="lg">
          <AlertTriangle className="mr-2 h-4 w-4" />
          练习错题
        </Button>
        <Button onClick={() => router.push('/practice?favoriteOnly=true')} variant="outline" className="w-full" size="lg">
          <Star className="mr-2 h-4 w-4" />
          练习收藏
        </Button>
        <Button onClick={() => router.push('/practice?mode=SEQUENTIAL')} className="w-full" size="lg">
          <BookOpen className="mr-2 h-4 w-4" />
          顺序刷题
        </Button>
      </motion.div>
    </div>
  )
}
