import { Prisma } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/authOptions'
import { gradeWithAI } from '@/lib/ai'
import {
  compareObjectiveAnswer,
  displayOptionsForQuestion,
  getErrorMessage,
  parseQuestionOptions,
} from '@/lib/question-utils'
import { getSessionUserId } from '@/lib/session'
import { isPracticeMode, isQuestionType, type PracticeMode } from '@/lib/types'
import { prisma } from '@/lib/prisma'

interface SubmitAnswerPayload {
  questionId?: unknown
  userAnswer?: unknown
  mode?: unknown
  provider?: unknown
  config?: unknown
}

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5)
}

function parseMode(value: unknown): PracticeMode {
  return isPracticeMode(value) ? value : 'SEQUENTIAL'
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  const userId = getSessionUserId(session)
  if (!userId) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const mode = parseMode(searchParams.get('mode'))
  const category = searchParams.get('category')
  const examId = searchParams.get('examId')
  const wrongOnly = searchParams.get('wrongOnly') === 'true'
  const favoriteOnly = searchParams.get('favoriteOnly') === 'true'
  const limit = Math.min(Number.parseInt(searchParams.get('limit') || '50', 10) || 50, 100)

  let questions = []

  if (mode === 'EXAM' && examId) {
    const exam = await prisma.exam.findFirst({ where: { id: examId, userId } })
    if (!exam) {
      return NextResponse.json({ error: '试卷不存在' }, { status: 404 })
    }

    const ids = JSON.parse(exam.questionIds) as string[]
    const found = await prisma.question.findMany({ where: { id: { in: ids } } })
    const byId = new Map(found.map((question) => [question.id, question]))
    questions = ids.map((id) => byId.get(id)).filter((item): item is (typeof found)[number] => Boolean(item))
  } else if (wrongOnly) {
    const wrongRecords = await prisma.answerRecord.findMany({
      where: { userId, isCorrect: false },
      select: { questionId: true },
      orderBy: { createdAt: 'desc' },
    })
    const wrongIds = [...new Set(wrongRecords.map((record) => record.questionId))]
    const found = await prisma.question.findMany({ where: { id: { in: wrongIds } } })
    const byId = new Map(found.map((question) => [question.id, question]))
    questions = wrongIds
      .map((id) => byId.get(id))
      .filter((item): item is (typeof found)[number] => Boolean(item))
      .slice(0, limit)
  } else if (favoriteOnly) {
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      select: { questionId: true },
      orderBy: { createdAt: 'desc' },
    })
    const favoriteIds = favorites.map((favorite) => favorite.questionId)
    const found = await prisma.question.findMany({ where: { id: { in: favoriteIds } } })
    const byId = new Map(found.map((question) => [question.id, question]))
    questions = favoriteIds
      .map((id) => byId.get(id))
      .filter((item): item is (typeof found)[number] => Boolean(item))
      .slice(0, limit)
  } else {
    const where: Prisma.QuestionWhereInput = {}
    if (category) where.category = category

    const found = await prisma.question.findMany({
      where,
      take: mode === 'RANDOM' ? undefined : limit,
      orderBy: { createdAt: 'asc' },
    })
    questions = mode === 'RANDOM' ? shuffle(found).slice(0, limit) : found
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId, questionId: { in: questions.map((question) => question.id) } },
    select: { questionId: true },
  })
  const favoriteSet = new Set(favorites.map((favorite) => favorite.questionId))

  return NextResponse.json({
    questions: questions.map((question) => {
      const type = isQuestionType(question.type) ? question.type : 'SINGLE_CHOICE'
      return {
        ...question,
        options: displayOptionsForQuestion(type, parseQuestionOptions(question.options)),
        isFavorite: favoriteSet.has(question.id),
      }
    }),
    mode,
  })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  const userId = getSessionUserId(session)
  if (!userId) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const body = (await request.json()) as SubmitAnswerPayload
  const questionId = typeof body.questionId === 'string' ? body.questionId : ''
  const userAnswer =
    typeof body.userAnswer === 'string'
      ? body.userAnswer.trim()
      : Array.isArray(body.userAnswer)
        ? body.userAnswer.join(',')
        : ''
  const mode = parseMode(body.mode)
  const provider = typeof body.provider === 'string' ? body.provider : 'deepseek'

  if (!questionId || !userAnswer) {
    return NextResponse.json({ error: '题目 ID 和答案不能为空' }, { status: 400 })
  }

  const question = await prisma.question.findUnique({ where: { id: questionId } })
  if (!question) {
    return NextResponse.json({ error: '题目不存在' }, { status: 404 })
  }

  if (!isQuestionType(question.type)) {
    return NextResponse.json({ error: '题型不受支持' }, { status: 400 })
  }

  let isCorrect: boolean | null = null
  let aiScore: number | null = null
  let aiComment: string | null = null

  if (['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE'].includes(question.type)) {
    isCorrect = compareObjectiveAnswer(question.type, question.answer, userAnswer)
  } else if (question.type === 'FILL_BLANK') {
    isCorrect = compareObjectiveAnswer(question.type, question.answer, userAnswer)
    if (!isCorrect) {
      try {
        const result = await gradeWithAI(
          question.content,
          question.answer,
          userAnswer,
          provider,
          body.config as Parameters<typeof gradeWithAI>[4]
        )
        aiScore = result.score
        aiComment = result.comment
        isCorrect = result.score >= 60
      } catch {
        isCorrect = false
        aiComment = 'AI 暂不可用，已按精确匹配判为不正确。'
      }
    }
  } else if (question.type === 'SHORT_ANSWER') {
    try {
      const result = await gradeWithAI(
        question.content,
        question.answer,
        userAnswer,
        provider,
        body.config as Parameters<typeof gradeWithAI>[4]
      )
      aiScore = result.score
      aiComment = result.comment
      isCorrect = result.score >= 60
    } catch (error) {
      aiComment = `AI 判分失败：${getErrorMessage(error)}`
    }
  }

  const record = await prisma.answerRecord.create({
    data: {
      userId,
      questionId,
      userAnswer,
      isCorrect,
      aiScore,
      aiComment,
      mode,
    },
  })

  return NextResponse.json({
    record,
    correctAnswer: question.answer,
    explanation: question.explanation,
    aiScore,
    aiComment,
    isCorrect,
  })
}
