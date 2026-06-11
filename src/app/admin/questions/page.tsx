'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Edit, Plus, Search, Trash2, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { QUESTION_TYPE_LABELS, QUESTION_TYPES, type QuestionOption, type QuestionType } from '@/lib/types'

interface Question {
  id: string
  type: QuestionType
  content: string
  options?: QuestionOption[] | null
  answer: string
  explanation?: string | null
  category?: string | null
  difficulty?: number | null
}

interface QuestionsResponse {
  questions?: Question[]
  pagination?: { pages: number }
  error?: string
}

interface FormState {
  type: QuestionType
  content: string
  options: string
  answer: string
  explanation: string
  category: string
  difficulty: string
}

const emptyForm: FormState = {
  type: 'SINGLE_CHOICE',
  content: '',
  options: JSON.stringify(
    [
      { label: 'A', text: '' },
      { label: 'B', text: '' },
      { label: 'C', text: '' },
      { label: 'D', text: '' },
    ],
    null,
    2
  ),
  answer: '',
  explanation: '',
  category: '',
  difficulty: '',
}

function parseOptionsInput(value: string): QuestionOption[] | undefined {
  if (!value.trim()) return undefined
  const parsed = JSON.parse(value) as unknown
  if (!Array.isArray(parsed)) throw new Error('选项必须是数组')

  const options = parsed.map((item) => {
    if (
      typeof item !== 'object' ||
      item === null ||
      !('label' in item) ||
      !('text' in item) ||
      typeof item.label !== 'string' ||
      typeof item.text !== 'string'
    ) {
      throw new Error('每个选项必须包含 label 和 text')
    }

    return { label: item.label.trim(), text: item.text.trim() }
  })

  if (options.some((option) => !option.label || !option.text)) {
    throw new Error('选项 label 和 text 不能为空')
  }

  return options
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [modal, setModal] = useState<{ open: boolean; id?: string }>({ open: false })
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchQuestions = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
      })
      if (search.trim()) params.set('search', search.trim())

      const response = await fetch(`/api/questions?${params.toString()}`)
      const data = (await response.json()) as QuestionsResponse
      if (!response.ok || data.error) throw new Error(data.error || '获取题目失败')

      setQuestions(data.questions ?? [])
      setTotalPages(data.pagination?.pages ?? 1)
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : '获取题目失败')
      setQuestions([])
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchQuestions()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [fetchQuestions])

  const openAdd = () => {
    setForm(emptyForm)
    setModal({ open: true })
  }

  const openEdit = (question: Question) => {
    setForm({
      type: question.type,
      content: question.content,
      options: question.options ? JSON.stringify(question.options, null, 2) : '',
      answer: question.answer,
      explanation: question.explanation || '',
      category: question.category || '',
      difficulty: question.difficulty ? String(question.difficulty) : '',
    })
    setModal({ open: true, id: question.id })
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      const needsOptions = form.type === 'SINGLE_CHOICE' || form.type === 'MULTIPLE_CHOICE'
      const options = needsOptions ? parseOptionsInput(form.options) : undefined
      if (needsOptions && !options) throw new Error('选择题必须填写选项')

      const body = {
        type: form.type,
        content: form.content,
        answer: form.answer,
        explanation: form.explanation || undefined,
        category: form.category || undefined,
        difficulty: form.difficulty || undefined,
        options,
      }

      const response = await fetch(modal.id ? `/api/questions/${modal.id}` : '/api/questions', {
        method: modal.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = (await response.json()) as { error?: string }
      if (!response.ok || data.error) throw new Error(data.error || '保存失败')

      setModal({ open: false })
      await fetchQuestions()
    } catch (saveError) {
      alert(saveError instanceof Error ? saveError.message : '保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除这道题目吗？相关收藏和答题记录也会一起删除。')) return

    try {
      const response = await fetch(`/api/questions/${id}`, { method: 'DELETE' })
      const data = (await response.json()) as { error?: string }
      if (!response.ok || data.error) throw new Error(data.error || '删除失败')
      await fetchQuestions()
    } catch (deleteError) {
      alert(deleteError instanceof Error ? deleteError.message : '删除失败，请重试')
    }
  }

  const showOptions = form.type === 'SINGLE_CHOICE' || form.type === 'MULTIPLE_CHOICE'

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">题库管理</h1>
        <div className="flex gap-2">
          <Button size="sm" onClick={openAdd}>
            <Plus className="mr-1 h-4 w-4" />
            新增
          </Button>
          <Link href="/admin/import">
            <Button size="sm" variant="outline">
              <Upload className="mr-1 h-4 w-4" />
              导入
            </Button>
          </Link>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(1)
          }}
          placeholder="搜索题干..."
          className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 transition-all focus:border-transparent focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600" />
        </div>
      ) : questions.length === 0 ? (
        <div className="py-12 text-center text-gray-500">暂无题目，请先新增或导入。</div>
      ) : (
        <div className="space-y-3">
          {questions.map((question, index) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="rounded-xl bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded bg-primary-100 px-2 py-1 text-xs text-primary-700">
                      {QUESTION_TYPE_LABELS[question.type]}
                    </span>
                    {question.category && (
                      <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                        {question.category}
                      </span>
                    )}
                  </div>
                  <p className="line-clamp-2 text-sm text-gray-900">{question.content}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(question)}
                    className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-primary-50 hover:text-primary-600"
                    aria-label="编辑题目"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(question.id)}
                    className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
                    aria-label="删除题目"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
          >
            上一页
          </Button>
          <span className="text-sm text-gray-600">
            {page}/{totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
          >
            下一页
          </Button>
        </div>
      )}

      <AnimatePresence>
        {modal.open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setModal({ open: false })}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-h-[90vh] overflow-y-auto rounded-t-2xl bg-white p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  {modal.id ? '编辑题目' : '新增题目'}
                </h2>
                <button onClick={() => setModal({ open: false })} aria-label="关闭">
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">题目类型</label>
                  <select
                    value={form.type}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, type: event.target.value as QuestionType }))
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                  >
                    {QUESTION_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {QUESTION_TYPE_LABELS[type]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">题干</label>
                  <textarea
                    value={form.content}
                    onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
                    rows={3}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {showOptions && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      选项 JSON
                    </label>
                    <textarea
                      value={form.options}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, options: event.target.value }))
                      }
                      rows={6}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-xs focus:border-transparent focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">答案</label>
                  <input
                    type="text"
                    value={form.answer}
                    onChange={(event) => setForm((prev) => ({ ...prev, answer: event.target.value }))}
                    placeholder="单选填 A，多选填 A,B，判断填 true/false"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">解析</label>
                  <textarea
                    value={form.explanation}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, explanation: event.target.value }))
                    }
                    rows={2}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">分类</label>
                    <input
                      type="text"
                      value={form.category}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, category: event.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">难度 1-5</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={form.difficulty}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, difficulty: event.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <Button onClick={handleSave} loading={saving} className="w-full" size="lg">
                  保存
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
