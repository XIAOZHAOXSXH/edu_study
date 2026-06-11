import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/authOptions'
import { buildQuestionTemplateCsv, parseQuestionTemplateCsv } from '@/lib/template-import'
import { getErrorMessage } from '@/lib/question-utils'

function decodeCsvFile(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer)
  const candidates = [
    { encoding: 'utf-8', fatal: false },
    { encoding: 'gb18030', fatal: false },
  ]

  let bestText = ''
  let bestScore = -1

  for (const candidate of candidates) {
    try {
      const text = new TextDecoder(candidate.encoding, { fatal: candidate.fatal }).decode(bytes)
      const header = text.split(/\r?\n/, 1)[0] ?? ''
      const score = ['题型', '题干', '答案'].filter((item) => header.includes(item)).length

      if (score > bestScore) {
        bestText = text
        bestScore = score
      }
    } catch {
      // Try the next encoding.
    }
  }

  return bestText
}

export async function GET() {
  const csv = buildQuestionTemplateCsv()
  const filename = encodeURIComponent('题库导入模板.csv')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="quiz-template.csv"; filename*=UTF-8''${filename}`,
      'Cache-Control': 'no-store',
    },
  })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: '请上传模板 CSV 文件' }, { status: 400 })
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json({ error: '仅支持 .csv 模板文件' }, { status: 400 })
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: '模板文件不能超过 2MB' }, { status: 400 })
    }

    const result = parseQuestionTemplateCsv(decodeCsvFile(await file.arrayBuffer()))

    return NextResponse.json({
      ...result,
      filename: file.name,
    })
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
  }
}
