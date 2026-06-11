'use client'

import { motion } from 'framer-motion'
import { AnswerInput } from './AnswerInput'
import { OptionList } from './OptionList'
import { QUESTION_TYPE_LABELS, type QuestionOption, type QuestionType } from '@/lib/types'

interface Question {
  id: string
  type: QuestionType
  content: string
  options: QuestionOption[] | null
  answer: string
  explanation?: string | null
}

interface QuestionCardProps {
  question: Question
  userAnswer: string | string[]
  showResult: boolean
  isCorrect?: boolean | null
  onAnswer: (answer: string | string[]) => void
}

export function QuestionCard({
  question,
  userAnswer,
  showResult,
  isCorrect,
  onAnswer,
}: QuestionCardProps) {
  const isObjective = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE'].includes(question.type)

  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="rounded-2xl bg-white p-6 shadow-sm"
    >
      <div className="mb-4">
        <span className="inline-block rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700">
          {QUESTION_TYPE_LABELS[question.type]}
        </span>
      </div>

      <p className="mb-6 text-lg leading-relaxed text-gray-900">{question.content}</p>

      {isObjective && question.options ? (
        <OptionList
          options={question.options}
          selected={userAnswer}
          correctAnswer={question.answer}
          showResult={showResult}
          multiple={question.type === 'MULTIPLE_CHOICE'}
          onSelect={(label) => {
            if (question.type === 'MULTIPLE_CHOICE') {
              const current = Array.isArray(userAnswer) ? userAnswer : []
              const nextAnswer = current.includes(label)
                ? current.filter((item) => item !== label)
                : [...current, label]
              onAnswer(nextAnswer)
            } else {
              onAnswer(label)
            }
          }}
        />
      ) : (
        <AnswerInput
          type={question.type === 'SHORT_ANSWER' ? 'SHORT_ANSWER' : 'FILL_BLANK'}
          value={typeof userAnswer === 'string' ? userAnswer : ''}
          onChange={onAnswer}
          disabled={showResult}
        />
      )}

      {showResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 rounded-xl bg-gray-50 p-4"
        >
          {isCorrect !== undefined && isCorrect !== null && (
            <p className={`mb-2 font-semibold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
              {isCorrect ? '本题回答正确' : '本题回答错误'}
            </p>
          )}
          <p className="mb-2 font-medium text-gray-900">正确答案：{question.answer}</p>
          {question.explanation && (
            <p className="text-sm leading-6 text-gray-600">解析：{question.explanation}</p>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
