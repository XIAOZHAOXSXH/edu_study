import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/authOptions'
import { parseQuestionOptions } from '@/lib/question-utils'
import { prisma } from '@/lib/prisma'
import { getSessionUserId } from '@/lib/session'

export async function GET() {
  const session = await getServerSession(authOptions)
  const userId = getSessionUserId(session)
  if (!userId) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId },
    include: { question: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({
    questions: favorites.map((favorite) => ({
      ...favorite.question,
      options: parseQuestionOptions(favorite.question.options),
      isFavorite: true,
    })),
  })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  const userId = getSessionUserId(session)
  if (!userId) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const body = (await request.json()) as { questionId?: unknown }
  const questionId = typeof body.questionId === 'string' ? body.questionId : ''
  if (!questionId) {
    return NextResponse.json({ error: '缺少题目 ID' }, { status: 400 })
  }

  const existing = await prisma.favorite.findUnique({
    where: { userId_questionId: { userId, questionId } },
  })

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } })
    return NextResponse.json({ favorited: false })
  }

  await prisma.favorite.create({ data: { userId, questionId } })
  return NextResponse.json({ favorited: true })
}
