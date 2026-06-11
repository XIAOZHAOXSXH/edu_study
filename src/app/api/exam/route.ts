import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/authOptions'
import { getSessionUserId } from '@/lib/session'
import { isRecord } from '@/lib/question-utils'
import { isQuestionType, type QuestionType } from '@/lib/types'
import { prisma } from '@/lib/prisma'

interface ExamConfigResult {
  config: Partial<Record<QuestionType, number>>
  total: number
}

function parseExamConfig(value: unknown): ExamConfigResult {
  if (!isRecord(value)) return { config: {}, total: 0 }

  const config: Partial<Record<QuestionType, number>> = {}
  let total = 0

  for (const [type, count] of Object.entries(value)) {
    if (!isQuestionType(type)) continue
    const parsed = typeof count === 'number' ? count : Number(count)
    const safeCount = Number.isFinite(parsed) ? Math.max(0, Math.min(50, Math.round(parsed))) : 0
    config[type] = safeCount
    total += safeCount
  }

  return { config, total }
}

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  const userId = getSessionUserId(session)
  if (!userId) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const body = (await request.json()) as { title?: unknown; config?: unknown }
  const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim() : '模拟试卷'
  const { config, total } = parseExamConfig(body.config)

  if (total === 0) {
    return NextResponse.json({ error: '请至少选择 1 道题' }, { status: 400 })
  }

  const questionIds: string[] = []
  const shortages: Partial<Record<QuestionType, { requested: number; available: number }>> = {}

  for (const [type, count] of Object.entries(config) as [QuestionType, number][]) {
    if (count <= 0) continue
    const questions = await prisma.question.findMany({ where: { type } })
    const selected = shuffle(questions).slice(0, count)
    questionIds.push(...selected.map((question) => question.id))

    if (questions.length < count) {
      shortages[type] = { requested: count, available: questions.length }
    }
  }

  if (questionIds.length === 0) {
    return NextResponse.json({ error: '题库中没有满足条件的题目' }, { status: 400 })
  }

  const exam = await prisma.exam.create({
    data: {
      userId,
      title,
      config: JSON.stringify(config),
      questionIds: JSON.stringify(questionIds),
    },
  })

  return NextResponse.json(
    { ...exam, questionCount: questionIds.length, shortages },
    { status: 201 }
  )
}

export async function GET() {
  const session = await getServerSession(authOptions)
  const userId = getSessionUserId(session)
  if (!userId) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const exams = await prisma.exam.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  return NextResponse.json(exams)
}
