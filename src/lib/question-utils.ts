import {
  isQuestionType,
  type ParsedQuestionInput,
  type QuestionOption,
  type QuestionType,
} from './types'

type UnknownRecord = Record<string, unknown>

export function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '未知错误'
}

export function parseQuestionOptions(value: string | null | undefined): QuestionOption[] | null {
  if (!value) return null

  try {
    const parsed: unknown = JSON.parse(value)
    return normalizeOptions(parsed)
  } catch {
    return null
  }
}

export function normalizeOptions(value: unknown): QuestionOption[] | null {
  if (!Array.isArray(value)) return null

  const options = value
    .map((item) => {
      if (!isRecord(item)) return null
      const label = typeof item.label === 'string' ? item.label.trim() : ''
      const text = typeof item.text === 'string' ? item.text.trim() : ''
      return label && text ? { label, text } : null
    })
    .filter((item): item is QuestionOption => item !== null)

  return options.length > 0 ? options : null
}

export function serializeQuestionOptions(value: unknown): string | null {
  const options = normalizeOptions(value)
  return options ? JSON.stringify(options) : null
}

function normalizeChoiceLabels(answer: string): string[] {
  const trimmed = answer.trim().toUpperCase()
  if (!trimmed) return []

  const hasSeparator = /[,，、\s;；|/]+/.test(trimmed)
  const parts = hasSeparator
    ? trimmed.split(/[,，、\s;；|/]+/)
    : /^[A-Z]+$/.test(trimmed)
      ? trimmed.split('')
      : [trimmed]

  return [...new Set(parts.map((part) => part.trim()).filter(Boolean))].sort()
}

export function normalizeAnswer(answer: string, type: QuestionType): string {
  const trimmed = answer.trim()

  if (type === 'MULTIPLE_CHOICE') {
    return normalizeChoiceLabels(trimmed).join(',')
  }

  if (type === 'SINGLE_CHOICE') {
    return trimmed.toUpperCase()
  }

  if (type === 'TRUE_FALSE') {
    const normalized = trimmed.toLowerCase()
    if (['true', 't', 'yes', 'y', '1', '对', '正确'].includes(normalized)) return 'true'
    if (['false', 'f', 'no', 'n', '0', '错', '错误'].includes(normalized)) return 'false'
    return normalized
  }

  return trimmed.replace(/\s+/g, ' ')
}

export function compareObjectiveAnswer(
  type: QuestionType,
  standardAnswer: string,
  userAnswer: string
): boolean {
  return normalizeAnswer(standardAnswer, type) === normalizeAnswer(userAnswer, type)
}

export function displayOptionsForQuestion(
  type: QuestionType,
  options: QuestionOption[] | null
): QuestionOption[] | null {
  if (options?.length) return options

  if (type === 'TRUE_FALSE') {
    return [
      { label: 'true', text: '正确' },
      { label: 'false', text: '错误' },
    ]
  }

  return null
}

export function normalizeParsedQuestion(value: unknown): ParsedQuestionInput | null {
  if (!isRecord(value)) return null

  const type = value.type
  const content = typeof value.content === 'string' ? value.content.trim() : ''
  const answer = typeof value.answer === 'string' ? value.answer.trim() : ''

  if (!isQuestionType(type) || !content || !answer) return null

  const explanation =
    typeof value.explanation === 'string' && value.explanation.trim()
      ? value.explanation.trim()
      : null
  const category =
    typeof value.category === 'string' && value.category.trim() ? value.category.trim() : null
  const difficulty =
    typeof value.difficulty === 'number' && Number.isFinite(value.difficulty)
      ? Math.round(value.difficulty)
      : null

  const options = displayOptionsForQuestion(type, normalizeOptions(value.options))
  if ((type === 'SINGLE_CHOICE' || type === 'MULTIPLE_CHOICE') && (!options || options.length < 2)) {
    return null
  }

  return {
    type,
    content,
    options,
    answer: normalizeAnswer(answer, type),
    explanation,
    category,
    difficulty: difficulty ? Math.max(1, Math.min(5, difficulty)) : null,
  }
}

export function normalizeParsedQuestions(value: unknown): ParsedQuestionInput[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => normalizeParsedQuestion(item))
    .filter((item): item is ParsedQuestionInput => item !== null)
}

export function extractJsonArray(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) throw new Error('未找到 JSON 数组')
    return JSON.parse(match[0])
  }
}

export function extractJsonObject(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('未找到 JSON 对象')
    return JSON.parse(match[0])
  }
}

export function parseHeuristicQuestions(text: string): ParsedQuestionInput[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 12)

  const questions: ParsedQuestionInput[] = []

  for (const line of lines.slice(0, 20)) {
    const sentence = line.replace(/\s+/g, ' ')
    const keywordMatch = sentence.match(/(.{2,16}?)(是|指|包括|体现|要求|原则|方法|规律)/)
    const keyword = keywordMatch?.[1]?.trim()

    if (!keyword) continue

    questions.push({
      type: 'FILL_BLANK',
      content: `${sentence.replace(keyword, '______')}`,
      options: null,
      answer: keyword,
      explanation: sentence,
      category: 'DOCX 自动导入',
      difficulty: 2,
    })

    if (questions.length >= 10) break
  }

  return questions
}
