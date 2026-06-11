import { Prisma } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/authOptions'
import {
  displayOptionsForQuestion,
  normalizeOptions,
  parseQuestionOptions,
  serializeQuestionOptions,
} from '@/lib/question-utils'
import { prisma } from '@/lib/prisma'
import { isQuestionType } from '@/lib/types'

interface QuestionPayload {
  type?: unknown
  content?: unknown
  options?: unknown
  answer?: unknown
  explanation?: unknown
  category?: unknown
  difficulty?: unknown
}

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function parseDifficulty(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? Math.max(1, Math.min(5, Math.round(parsed))) : undefined
}

function parseQuestionBody(body: QuestionPayload) {
  if (!isQuestionType(body.type)) {
    return { error: '请选择有效题型' }
  }

  const content = typeof body.content === 'string' ? body.content.trim() : ''
  const answer = typeof body.answer === 'string' ? body.answer.trim() : ''

  if (!content || !answer) {
    return { error: '题干和答案不能为空' }
  }

  const normalizedOptions = displayOptionsForQuestion(body.type, normalizeOptions(body.options))
  const needsOptions = body.type === 'SINGLE_CHOICE' || body.type === 'MULTIPLE_CHOICE'
  if (needsOptions && !normalizedOptions) {
    return { error: '选择题必须填写有效选项 JSON' }
  }

  return {
    data: {
      type: body.type,
      content,
      options: serializeQuestionOptions(normalizedOptions),
      answer,
      explanation:
        typeof body.explanation === 'string' && body.explanation.trim()
          ? body.explanation.trim()
          : null,
      category:
        typeof body.category === 'string' && body.category.trim() ? body.category.trim() : null,
      difficulty: parseDifficulty(body.difficulty) ?? null,
    },
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = parsePositiveInt(searchParams.get('page'), 1)
  const limit = Math.min(parsePositiveInt(searchParams.get('limit'), 20), 100)
  const type = searchParams.get('type')
  const category = searchParams.get('category')
  const search = searchParams.get('search')?.trim()

  const where: Prisma.QuestionWhereInput = {}
  if (isQuestionType(type)) where.type = type
  if (category) where.category = category
  if (search) where.content = { contains: search }

  const [questions, total] = await Promise.all([
    prisma.question.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.question.count({ where }),
  ])

  return NextResponse.json({
    questions: questions.map((question) => ({
      ...question,
      options: parseQuestionOptions(question.options),
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    },
  })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const body = (await request.json()) as QuestionPayload
  const parsed = parseQuestionBody(body)
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  const question = await prisma.question.create({ data: parsed.data })

  return NextResponse.json(
    {
      ...question,
      options: parseQuestionOptions(question.options),
    },
    { status: 201 }
  )
}
