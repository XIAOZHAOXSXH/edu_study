'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { BarChart3, BookOpen, FileText, Shuffle } from 'lucide-react'

interface Stats {
  totalQuestions: number
  practicedToday: number
  correctRate: number
}

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<Stats>({
    totalQuestions: 0,
    practicedToday: 0,
    correctRate: 0,
  })

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [router, status])

  useEffect(() => {
    if (status !== 'authenticated') return

    fetch('/api/stats')
      .then((response) => response.json())
      .then((data: Partial<Stats> & { error?: string }) => {
        if (data.error) return
        setStats({
          totalQuestions: data.totalQuestions ?? 0,
          practicedToday: data.practicedToday ?? 0,
          correctRate: data.correctRate ?? 0,
        })
      })
      .catch(() => undefined)
  }, [status])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600" />
      </div>
    )
  }

  if (!session) return null

  const quickActions = [
    {
      icon: BookOpen,
      label: '顺序刷题',
      description: '按录入顺序逐题练习',
      color: 'bg-blue-500',
      onClick: () => router.push('/practice?mode=SEQUENTIAL'),
    },
    {
      icon: Shuffle,
      label: '随机刷题',
      description: '打乱题库顺序练习',
      color: 'bg-green-500',
      onClick: () => router.push('/practice?mode=RANDOM'),
    },
    {
      icon: FileText,
      label: '组卷练习',
      description: '按题型数量自动组卷',
      color: 'bg-purple-500',
      onClick: () => router.push('/exam'),
    },
    {
      icon: BarChart3,
      label: '学习统计',
      description: '查看正确率与错题数据',
      color: 'bg-orange-500',
      onClick: () => router.push('/result'),
    },
  ]

  return (
    <div className="space-y-6 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-r from-primary-500 to-primary-700 p-6 text-white"
      >
        <h2 className="text-2xl font-bold">你好，{session.user?.name}</h2>
        <p className="mt-2 opacity-90">选择一个入口开始今天的练习。</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-4"
      >
        <div className="rounded-xl bg-white p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-primary-600">{stats.totalQuestions}</p>
          <p className="mt-1 text-xs text-gray-500">总题数</p>
        </div>
        <div className="rounded-xl bg-white p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-green-600">{stats.practicedToday}</p>
          <p className="mt-1 text-xs text-gray-500">今日练习</p>
        </div>
        <div className="rounded-xl bg-white p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-orange-600">{stats.correctRate}%</p>
          <p className="mt-1 text-xs text-gray-500">正确率</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="mb-4 text-lg font-semibold text-gray-900">快捷入口</h3>
        <div className="grid grid-cols-2 gap-4">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.label}
              whileTap={{ scale: 0.96 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * index }}
              onClick={action.onClick}
              className="rounded-xl bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md"
            >
              <div className={`${action.color} mb-3 flex h-10 w-10 items-center justify-center rounded-lg`}>
                <action.icon className="h-5 w-5 text-white" />
              </div>
              <p className="font-medium text-gray-900">{action.label}</p>
              <p className="mt-1 text-xs leading-5 text-gray-500">{action.description}</p>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
