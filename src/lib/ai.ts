import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'
import {
  extractJsonArray,
  extractJsonObject,
  isRecord,
  normalizeParsedQuestions,
} from './question-utils'
import { isAIProvider, type AIProvider, type AIProviderConfig, type QuestionOption } from './types'

const PROVIDER_ORDER: AIProvider[] = ['deepseek', 'openai', 'mimo']

interface GradeResult {
  score: number
  comment: string
}

export interface AIProviderStatus {
  source: 'env' | 'local' | 'none'
  effectiveProvider: AIProvider | string | null
  envConfiguredProviders: AIProvider[]
}

function isUsableApiKey(apiKey: string | undefined) {
  if (!apiKey) return false

  const normalized = apiKey.trim().toLowerCase()
  return Boolean(normalized) && !normalized.startsWith('your-') && !normalized.includes('replace-')
}

function isUsableConfig(config: Partial<AIProviderConfig> | undefined) {
  return Boolean(config?.baseURL && config.model && isUsableApiKey(config.apiKey))
}

function getEnvProviderConfig(provider: AIProvider): AIProviderConfig {
  switch (provider) {
    case 'openai':
      return {
        provider: 'openai',
        baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
        apiKey: process.env.OPENAI_API_KEY || '',
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      }
    case 'mimo':
      return {
        provider: 'mimo',
        baseURL: process.env.MIMO_BASE_URL || 'https://api.siliconflow.cn/v1',
        apiKey: process.env.MIMO_API_KEY || '',
        model: process.env.MIMO_MODEL || 'MiMo-7B-Chat',
      }
    case 'deepseek':
    default:
      return {
        provider: 'deepseek',
        baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
        apiKey: process.env.DEEPSEEK_API_KEY || '',
        model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      }
  }
}

function getEnvConfiguredProviders(): AIProvider[] {
  return PROVIDER_ORDER.filter((provider) => isUsableConfig(getEnvProviderConfig(provider)))
}

function resolveEnvConfig(requestedProvider: string): AIProviderConfig | null {
  const configuredProviders = getEnvConfiguredProviders()
  if (configuredProviders.length === 0) return null

  if (isAIProvider(requestedProvider) && configuredProviders.includes(requestedProvider)) {
    return getEnvProviderConfig(requestedProvider)
  }

  return getEnvProviderConfig(configuredProviders[0])
}

function getProviderConfig(
  provider: string = 'deepseek',
  customConfig?: Partial<AIProviderConfig>
): AIProviderConfig {
  const envConfig = resolveEnvConfig(provider)
  if (envConfig) return envConfig

  if (isUsableConfig(customConfig)) {
    return {
      provider: customConfig?.provider ?? provider,
      baseURL: customConfig?.baseURL ?? '',
      apiKey: customConfig?.apiKey ?? '',
      model: customConfig?.model ?? '',
    }
  }

  return getEnvProviderConfig(isAIProvider(provider) ? provider : 'deepseek')
}

function assertUsableConfig(config: AIProviderConfig) {
  if (!isUsableConfig(config)) {
    throw new Error(
      'No usable AI provider is configured. Set one of DEEPSEEK_API_KEY, OPENAI_API_KEY, or MIMO_API_KEY in .env, or save a complete local AI config.'
    )
  }
}

export function getAIProviderStatus(customConfig?: Partial<AIProviderConfig>): AIProviderStatus {
  const envConfiguredProviders = getEnvConfiguredProviders()

  if (envConfiguredProviders.length > 0) {
    return {
      source: 'env',
      effectiveProvider: envConfiguredProviders[0],
      envConfiguredProviders,
    }
  }

  if (isUsableConfig(customConfig)) {
    return {
      source: 'local',
      effectiveProvider: customConfig?.provider ?? 'custom',
      envConfiguredProviders,
    }
  }

  return {
    source: 'none',
    effectiveProvider: null,
    envConfiguredProviders,
  }
}

export function getAIModel(provider = 'deepseek', customConfig?: Partial<AIProviderConfig>) {
  const config = getProviderConfig(provider, customConfig)
  assertUsableConfig(config)

  const client = createOpenAI({
    baseURL: config.baseURL,
    apiKey: config.apiKey,
  })

  return client.chat(config.model)
}

export async function parseQuestionsWithAI(
  text: string,
  provider = 'deepseek',
  customConfig?: Partial<AIProviderConfig>
) {
  const model = getAIModel(provider, customConfig)
  const prompt = `Analyze the following education study material and extract or generate quiz questions. Return only a JSON array.

Study material:
${text}

Return shape:
[
  {
    "type": "SINGLE_CHOICE | MULTIPLE_CHOICE | TRUE_FALSE | FILL_BLANK | SHORT_ANSWER",
    "content": "Question stem",
    "options": [{"label": "A", "text": "Option text"}],
    "answer": "Standard answer",
    "explanation": "Explanation",
    "category": "Category",
    "difficulty": 1
  }
]

Rules:
1. If the material already contains questions, extract them first.
2. If the material is knowledge notes, generate high-quality related questions.
3. Use A/B/C/D for single choice, A,B,C for multiple choice, and true/false for true-false.
4. Fill-blank and short-answer questions must have clear standard answers.
5. difficulty must be an integer from 1 to 5.
6. Do not output Markdown or any prose outside the JSON array.`

  const { text: result } = await generateText({ model, prompt })
  const parsed = extractJsonArray(result)
  const questions = normalizeParsedQuestions(parsed)

  if (questions.length === 0) {
    throw new Error('AI did not return valid questions')
  }

  return questions
}

export async function gradeWithAI(
  question: string,
  standardAnswer: string,
  userAnswer: string,
  provider = 'deepseek',
  customConfig?: Partial<AIProviderConfig>
): Promise<GradeResult> {
  const model = getAIModel(provider, customConfig)
  const prompt = `Grade the following subjective question.

Question:
${question}

Standard answer:
${standardAnswer}

User answer:
${userAnswer}

Return only JSON:
{
  "score": 0-100,
  "comment": "Briefly explain the score, missing points, and improvement advice"
}`

  const { text: result } = await generateText({ model, prompt })
  const parsed = extractJsonObject(result)

  if (!isRecord(parsed)) {
    throw new Error('AI grading result is not an object')
  }

  const score = typeof parsed.score === 'number' ? parsed.score : Number(parsed.score)
  const comment = typeof parsed.comment === 'string' ? parsed.comment : ''

  if (!Number.isFinite(score)) {
    throw new Error('AI grading result is missing score')
  }

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    comment: comment || 'AI completed grading but did not return a detailed comment.',
  }
}

export async function explainWithAI(
  question: string,
  options: QuestionOption[] | null,
  correctAnswer: string,
  userAnswer: string | string[] | null,
  provider = 'deepseek',
  customConfig?: Partial<AIProviderConfig>
) {
  const model = getAIModel(provider, customConfig)
  const optionText =
    options && options.length > 0
      ? `\nOptions:\n${options.map((option) => `${option.label}. ${option.text}`).join('\n')}`
      : ''
  const answerText = Array.isArray(userAnswer) ? userAnswer.join(',') : userAnswer
  const userAnswerText = answerText ? `\nUser answer: ${answerText}` : ''

  const prompt = `Explain this question in Markdown for a learner preparing for a teacher qualification exam.

Question:
${question}${optionText}

Correct answer:
${correctAnswer}${userAnswerText}

Please cover:
1. Why the correct answer is correct.
2. If it is a choice question, why the other options are unsuitable.
3. The core knowledge points.
4. A short memory tip if useful.`

  const { text } = await generateText({ model, prompt })
  return text
}
