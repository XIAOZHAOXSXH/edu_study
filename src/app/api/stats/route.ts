import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import { getSessionUserId } from '@/lib/session'

async function buildStats(userId: string) {
  const [totalQuestions, allRecords, favoriteCount] = await Promise.all([
    prisma.question.count(),
    prisma.answerRecord.findMany({
      where: { userId },
      select: { isCorrect: true, createdAt: true, questionId: true },
    }),
    prisma.favorite.count({ where: { userId } }),
  ])

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const practicedToday = allRecords.filter((record) => record.createdAt >= startOfToday).length
  const graded = allRecords.filter((record) => record.isCorrect !== null)
  const correctCount = graded.filter((record) => record.isCorrect === true).length
  const correctRate = graded.length > 0 ? Math.round((correctCount / graded.length) * 100) : 0
  const practicedQuestions = new Set(allRecords.map((record) => record.questionId)).size
  const wrongQuestions = new Set(
    graded.filter((record) => record.isCorrect === false).map((record) => record.questionId)
  ).size

  return {
    totalQuestions,
    practicedToday,
    correctRate,
    practicedQuestions,
    wrongQuestions,
    favoriteCount,
    totalAnswered: allRecords.length,
    recalculatedAt: new Date().toISOString(),
  }
}

async function handleStatsRequest() {
  const session = await getServerSession(authOptions)
  const userId = getSessionUserId(session)
  if (!userId) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  return NextResponse.json(await buildStats(userId), {
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}

export async function GET() {
  return handleStatsRequest()
}

export async function POST() {
  return handleStatsRequest()
}
