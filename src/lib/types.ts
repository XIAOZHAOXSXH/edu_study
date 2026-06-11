export const QUESTION_TYPES = [
  'SINGLE_CHOICE',
  'MULTIPLE_CHOICE',
  'TRUE_FALSE',
  'FILL_BLANK',
  'SHORT_ANSWER',
] as const

export type QuestionType = (typeof QUESTION_TYPES)[number]

export const PRACTICE_MODES = ['SEQUENTIAL', 'RANDOM', 'EXAM'] as const

export type PracticeMode = (typeof PRACTICE_MODES)[number]

export const AI_PROVIDERS = ['deepseek', 'openai', 'mimo'] as const

export type AIProvider = (typeof AI_PROVIDERS)[number]

export interface QuestionOption {
  label: string
  text: string
}

export interface ParsedQuestionInput {
  type: QuestionType
  content: string
  options?: QuestionOption[] | null
  answer: string
  explanation?: string | null
  category?: string | null
  difficulty?: number | null
}

export interface AIProviderConfig {
  provider?: AIProvider | string
  baseURL: string
  apiKey: string
  model: string
}

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  SINGLE_CHOICE: '单选题',
  MULTIPLE_CHOICE: '多选题',
  TRUE_FALSE: '判断题',
  FILL_BLANK: '填空题',
  SHORT_ANSWER: '简答题',
}

export function isQuestionType(value: unknown): value is QuestionType {
  return typeof value === 'string' && QUESTION_TYPES.includes(value as QuestionType)
}

export function isPracticeMode(value: unknown): value is PracticeMode {
  return typeof value === 'string' && PRACTICE_MODES.includes(value as PracticeMode)
}

export function isAIProvider(value: unknown): value is AIProvider {
  return typeof value === 'string' && AI_PROVIDERS.includes(value as AIProvider)
}
