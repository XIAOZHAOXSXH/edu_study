import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/authOptions'
import { explainWithAI, getAIProviderStatus, gradeWithAI, parseQuestionsWithAI } from '@/lib/ai'
import { getErrorMessage, isRecord, normalizeOptions } from '@/lib/question-utils'
import type { AIProviderConfig } from '@/lib/types'

interface AIRequestBody {
  action?: unknown
  provider?: unknown
  config?: unknown
  text?: unknown
  question?: unknown
  options?: unknown
  standardAnswer?: unknown
  correctAnswer?: unknown
  userAnswer?: unknown
}

function readAIConfig(value: unknown): Partial<AIProviderConfig> | undefined {
  if (!isRecord(value)) return undefined

  const config: Partial<AIProviderConfig> = {}
  if (typeof value.provider === 'string') config.provider = value.provider
  if (typeof value.baseURL === 'string') config.baseURL = value.baseURL
  if (typeof value.apiKey === 'string') config.apiKey = value.apiKey
  if (typeof value.model === 'string') config.model = value.model

  return Object.keys(config).length > 0 ? config : undefined
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  return NextResponse.json(getAIProviderStatus())
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const body = (await request.json()) as AIRequestBody
  const provider = typeof body.provider === 'string' ? body.provider : 'deepseek'
  const config = readAIConfig(body.config)

  try {
    switch (body.action) {
      case 'parse': {
        if (typeof body.text !== 'string') {
          return NextResponse.json({ error: '缺少解析文本' }, { status: 400 })
        }
        const questions = await parseQuestionsWithAI(body.text, provider, config)
        return NextResponse.json({ questions })
      }
      case 'grade': {
        if (
          typeof body.question !== 'string' ||
          typeof body.standardAnswer !== 'string' ||
          typeof body.userAnswer !== 'string'
        ) {
          return NextResponse.json({ error: '缺少判分参数' }, { status: 400 })
        }
        const result = await gradeWithAI(
          body.question,
          body.standardAnswer,
          body.userAnswer,
          provider,
          config
        )
        return NextResponse.json(result)
      }
      case 'explain': {
        if (typeof body.question !== 'string' || typeof body.correctAnswer !== 'string') {
          return NextResponse.json({ error: '缺少解析参数' }, { status: 400 })
        }
        const explanation = await explainWithAI(
          body.question,
          normalizeOptions(body.options),
          body.correctAnswer,
          typeof body.userAnswer === 'string' || Array.isArray(body.userAnswer)
            ? body.userAnswer
            : null,
          provider,
          config
        )
        return NextResponse.json({ explanation })
      }
      default:
        return NextResponse.json({ error: '未知操作' }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
  }
}
