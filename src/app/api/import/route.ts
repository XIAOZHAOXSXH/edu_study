import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/authOptions'
import { parseQuestionsWithAI } from '@/lib/ai'
import { parseDocxFromFile } from '@/lib/docx'
import {
  getErrorMessage,
  normalizeParsedQuestions,
  parseHeuristicQuestions,
  serializeQuestionOptions,
} from '@/lib/question-utils'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const provider = (formData.get('provider') as string | null) || 'deepseek'
    const configRaw = formData.get('config')
    const config =
      typeof configRaw === 'string' && configRaw.trim() ? JSON.parse(configRaw) : undefined

    if (!(file instanceof File)) {
      return NextResponse.json({ error: '请上传 DOCX 文件' }, { status: 400 })
    }

    if (!file.name.toLowerCase().endsWith('.docx')) {
      return NextResponse.json({ error: '仅支持 .docx 文件' }, { status: 400 })
    }

    let text = await parseDocxFromFile(file)
    const maxChars = 12000
    const truncated = text.length > maxChars
    if (truncated) text = text.slice(0, maxChars)

    let questions = []
    let aiError: string | null = null

    try {
      questions = await parseQuestionsWithAI(text, provider, config)
    } catch (error) {
      aiError = getErrorMessage(error)
      questions = parseHeuristicQuestions(text)
    }

    return NextResponse.json({
      questions,
      filename: file.name,
      textLength: text.length,
      truncated,
      fallback: Boolean(aiError),
      aiError,
    })
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  try {
    const body = (await request.json()) as { questions?: unknown; source?: unknown }
    const submittedCount = Array.isArray(body.questions) ? body.questions.length : 0
    const questions = normalizeParsedQuestions(body.questions)
    const source = typeof body.source === 'string' && body.source.trim() ? body.source.trim() : null

    if (questions.length === 0) {
      return NextResponse.json({ error: '没有可入库的有效题目' }, { status: 400 })
    }

    if (submittedCount !== questions.length) {
      return NextResponse.json(
        { error: '导入预览中存在无效题目，请修改后再入库' },
        { status: 400 }
      )
    }

    const created = await prisma.question.createMany({
      data: questions.map((question) => ({
        type: question.type,
        content: question.content,
        options: serializeQuestionOptions(question.options),
        answer: question.answer,
        explanation: question.explanation,
        category: question.category,
        difficulty: question.difficulty,
        source,
      })),
    })

    return NextResponse.json({ success: true, count: created.count })
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
  }
}
