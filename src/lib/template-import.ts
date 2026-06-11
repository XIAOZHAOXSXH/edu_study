import {
  isQuestionType,
  type ParsedQuestionInput,
  type QuestionOption,
  type QuestionType,
} from './types'
import { normalizeParsedQuestion } from './question-utils'

const TEMPLATE_HEADERS = [
  '题型',
  '题干',
  '选项A',
  '选项B',
  '选项C',
  '选项D',
  '选项E',
  '选项F',
  '答案',
  '解析',
  '分类',
  '难度',
]

const TEMPLATE_ROWS = [
  [
    '单选题',
    '教育目的对教育活动主要具有哪项作用？',
    '导向作用',
    '娱乐作用',
    '装饰作用',
    '随机作用',
    '',
    '',
    'A',
    '教育目的对教育实践具有导向作用。',
    '教育知识',
    '2',
  ],
  [
    '多选题',
    '教师职业道德规范包括哪些要求？',
    '爱国守法',
    '爱岗敬业',
    '关爱学生',
    '商业营销',
    '',
    '',
    'A,B,C',
    '教师职业道德规范包含爱国守法、爱岗敬业、关爱学生等内容。',
    '综合素质',
    '2',
  ],
  [
    '判断题',
    '教学评价只能在课程结束后进行。',
    '',
    '',
    '',
    '',
    '',
    '',
    '错误',
    '形成性评价可以贯穿教学全过程。',
    '教育知识',
    '1',
  ],
  [
    '填空题',
    '教师备课要做到备教材、备学生、备______。',
    '',
    '',
    '',
    '',
    '',
    '',
    '教法',
    '备教法是教学准备的重要内容。',
    '教育知识',
    '2',
  ],
  [
    '简答题',
    '简述班级授课制的主要优点。',
    '',
    '',
    '',
    '',
    '',
    '',
    '有利于大面积培养人才，提高教学效率，便于发挥教师主导作用。',
    '可围绕规模化培养、效率、教师主导等要点作答。',
    '教育知识',
    '3',
  ],
]

const REQUIRED_HEADERS = {
  type: ['题型', '类型', 'type', 'question type', 'question_type'],
  content: ['题干', '题目', '题目内容', 'content', 'question', 'stem'],
  answer: ['答案', '标准答案', '正确答案', 'answer', 'correct answer', 'correct_answer'],
}

const OPTIONAL_HEADERS = {
  explanation: ['解析', '答案解析', 'explanation', 'analysis'],
  category: ['分类', '类别', 'category', 'subject'],
  difficulty: ['难度', 'difficulty'],
}

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F']

export interface TemplateParseResult {
  questions: ParsedQuestionInput[]
  errors: string[]
  totalRows: number
}

function escapeCsvField(value: string) {
  if (!/[",\r\n]/.test(value)) return value
  return `"${value.replace(/"/g, '""')}"`
}

function formatCsvRow(values: string[]) {
  return values.map(escapeCsvField).join(',')
}

export function buildQuestionTemplateCsv() {
  return `\uFEFF${[TEMPLATE_HEADERS, ...TEMPLATE_ROWS].map(formatCsvRow).join('\r\n')}\r\n`
}

function parseCsvRows(text: string) {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const next = text[index + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      row.push(field)
      field = ''
      continue
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') index += 1
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      continue
    }

    field += char
  }

  if (field || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows
}

function normalizeHeader(value: string) {
  return value
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '')
}

function findHeaderIndex(headers: string[], aliases: string[]) {
  const normalizedAliases = aliases.map(normalizeHeader)
  return headers.findIndex((header) => normalizedAliases.includes(normalizeHeader(header)))
}

function findOptionHeaderIndex(headers: string[], label: string) {
  return findHeaderIndex(headers, [
    `选项${label}`,
    `${label}选项`,
    `option${label}`,
    `option ${label}`,
    label,
  ])
}

function valueAt(row: string[], index: number) {
  return index >= 0 ? (row[index] ?? '').trim() : ''
}

function parseQuestionType(value: string): QuestionType | null {
  const normalized = value.trim().toUpperCase().replace(/[\s_-]+/g, '')
  if (isQuestionType(value.trim())) return value.trim() as QuestionType

  const map: Record<string, QuestionType> = {
    SINGLECHOICE: 'SINGLE_CHOICE',
    SINGLE: 'SINGLE_CHOICE',
    SC: 'SINGLE_CHOICE',
    单选: 'SINGLE_CHOICE',
    单选题: 'SINGLE_CHOICE',
    MULTIPLECHOICE: 'MULTIPLE_CHOICE',
    MULTIPLE: 'MULTIPLE_CHOICE',
    MC: 'MULTIPLE_CHOICE',
    多选: 'MULTIPLE_CHOICE',
    多选题: 'MULTIPLE_CHOICE',
    TRUEFALSE: 'TRUE_FALSE',
    JUDGE: 'TRUE_FALSE',
    BOOLEAN: 'TRUE_FALSE',
    判断: 'TRUE_FALSE',
    判断题: 'TRUE_FALSE',
    FILLBLANK: 'FILL_BLANK',
    BLANK: 'FILL_BLANK',
    填空: 'FILL_BLANK',
    填空题: 'FILL_BLANK',
    SHORTANSWER: 'SHORT_ANSWER',
    SA: 'SHORT_ANSWER',
    简答: 'SHORT_ANSWER',
    简答题: 'SHORT_ANSWER',
    问答: 'SHORT_ANSWER',
    问答题: 'SHORT_ANSWER',
  }

  return map[normalized] ?? null
}

function parseDifficulty(value: string, rowNumber: number, errors: string[]) {
  if (!value) return null

  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    errors.push(`第 ${rowNumber} 行：难度必须是 1-5 的数字`)
    return null
  }

  return Math.max(1, Math.min(5, Math.round(parsed)))
}

function buildOptions(row: string[], optionIndexes: number[]) {
  const options: QuestionOption[] = []

  OPTION_LABELS.forEach((label, index) => {
    const text = valueAt(row, optionIndexes[index])
    if (text) options.push({ label, text })
  })

  return options.length > 0 ? options : null
}

function isEmptyRow(row: string[]) {
  return row.every((cell) => !cell.trim())
}

export function parseQuestionTemplateCsv(text: string): TemplateParseResult {
  const rows = parseCsvRows(text.replace(/^\uFEFF/, '')).filter((row) => !isEmptyRow(row))
  if (rows.length === 0) {
    return { questions: [], errors: ['模板文件为空'], totalRows: 0 }
  }

  const headers = rows[0]
  const typeIndex = findHeaderIndex(headers, REQUIRED_HEADERS.type)
  const contentIndex = findHeaderIndex(headers, REQUIRED_HEADERS.content)
  const answerIndex = findHeaderIndex(headers, REQUIRED_HEADERS.answer)
  const explanationIndex = findHeaderIndex(headers, OPTIONAL_HEADERS.explanation)
  const categoryIndex = findHeaderIndex(headers, OPTIONAL_HEADERS.category)
  const difficultyIndex = findHeaderIndex(headers, OPTIONAL_HEADERS.difficulty)
  const optionIndexes = OPTION_LABELS.map((label) => findOptionHeaderIndex(headers, label))
  const missingHeaders = [
    typeIndex < 0 ? '题型' : '',
    contentIndex < 0 ? '题干' : '',
    answerIndex < 0 ? '答案' : '',
  ].filter(Boolean)

  if (missingHeaders.length > 0) {
    return {
      questions: [],
      errors: [`缺少必填列：${missingHeaders.join('、')}`],
      totalRows: Math.max(0, rows.length - 1),
    }
  }

  const questions: ParsedQuestionInput[] = []
  const errors: string[] = []

  rows.slice(1).forEach((row, rowIndex) => {
    const rowNumber = rowIndex + 2
    const type = parseQuestionType(valueAt(row, typeIndex))
    const content = valueAt(row, contentIndex)
    const answer = valueAt(row, answerIndex)
    const explanation = valueAt(row, explanationIndex)
    const category = valueAt(row, categoryIndex)
    const difficulty = parseDifficulty(valueAt(row, difficultyIndex), rowNumber, errors)

    if (!type) {
      errors.push(`第 ${rowNumber} 行：题型无效`)
      return
    }

    if (!content) {
      errors.push(`第 ${rowNumber} 行：题干不能为空`)
      return
    }

    if (!answer) {
      errors.push(`第 ${rowNumber} 行：答案不能为空`)
      return
    }

    const options = buildOptions(row, optionIndexes)
    if ((type === 'SINGLE_CHOICE' || type === 'MULTIPLE_CHOICE') && (!options || options.length < 2)) {
      errors.push(`第 ${rowNumber} 行：选择题至少需要填写 2 个选项`)
      return
    }

    const question = normalizeParsedQuestion({
      type,
      content,
      options,
      answer,
      explanation,
      category,
      difficulty,
    })

    if (!question) {
      errors.push(`第 ${rowNumber} 行：题目内容无法识别`)
      return
    }

    questions.push(question)
  })

  return {
    questions,
    errors,
    totalRows: Math.max(0, rows.length - 1),
  }
}
