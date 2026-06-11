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

function parseDifficulty(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? Math.max(1, Math.min(5, Math.round(parsed))) : null
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
      difficulty: parseDifficulty(body.difficulty),
    },
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const { id } = await params
  const question = await prisma.question.findUnique({ where: { id } })

  if (!question) {
    return NextResponse.json({ error: '题目不存在' }, { status: 404 })
  }

  return NextResponse.json({
    ...question,
    options: parseQuestionOptions(question.options),
  })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const body = (await request.json()) as QuestionPayload
  const parsed = parseQuestionBody(body)
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  const { id } = await params
  const question = await prisma.question.update({
    where: { id },
    data: parsed.data,
  })

  return NextResponse.json({
    ...question,
    options: parseQuestionOptions(question.options),
  })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const { id } = await params

  await prisma.$transaction([
    prisma.favorite.deleteMany({ where: { questionId: id } }),
    prisma.answerRecord.deleteMany({ where: { questionId: id } }),
    prisma.question.delete({ where: { id } }),
  ])

  return NextResponse.json({ success: true })
}
