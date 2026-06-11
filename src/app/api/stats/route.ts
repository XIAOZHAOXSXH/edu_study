import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import { getSessionUserId } from '@/lib/session'

export async function GET() {
  const session = await getServerSession(authOptions)
  const userId = getSessionUserId(session)
  if (!userId) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const totalQuestions = await prisma.question.count()
  const allRecords = await prisma.answerRecord.findMany({
    where: { userId },
    select: { isCorrect: true, createdAt: true, questionId: true },
  })

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
  const favoriteCount = await prisma.favorite.count({ where: { userId } })

  return NextResponse.json({
    totalQuestions,
    practicedToday,
    correctRate,
    practicedQuestions,
    wrongQuestions,
    favoriteCount,
    totalAnswered: allRecords.length,
  })
}
