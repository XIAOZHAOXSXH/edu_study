'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  Bot,
  Check,
  Download,
  Edit,
  FileText,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  QUESTION_TYPE_LABELS,
  QUESTION_TYPES,
  type AIProviderConfig,
  type QuestionOption,
  type QuestionType,
} from '@/lib/types'

type ImportMode = 'ai' | 'template'

interface ParsedQuestion {
  type: QuestionType
  content: string
  options?: QuestionOption[] | null
  answer: string
  explanation?: string | null
  category?: string | null
  difficulty?: number | null
}

interface ImportResponse {
  questions?: ParsedQuestion[]
  truncated?: boolean
  fallback?: boolean
  aiError?: string | null
  error?: string
}

interface TemplateImportResponse {
  questions?: ParsedQuestion[]
  errors?: string[]
  totalRows?: number
  error?: string
}

interface SaveResponse {
  success?: boolean
  count?: number
  error?: string
}

interface EditForm {
  type: QuestionType
  content: string
  options: string
  answer: string
  explanation: string
  category: string
  difficulty: string
}

function getAIConfig(): Partial<AIProviderConfig> | undefined {
  try {
    const saved = window.localStorage.getItem('ai_config')
    return saved ? (JSON.parse(saved) as Partial<AIProviderConfig>) : undefined
  } catch {
    return undefined
  }
}

function toEditForm(question: ParsedQuestion): EditForm {
  return {
    type: question.type,
    content: question.content,
    options: question.options ? JSON.stringify(question.options, null, 2) : '',
    answer: question.answer,
    explanation: question.explanation || '',
    category: question.category || '',
    difficulty: question.difficulty ? String(question.difficulty) : '',
  }
}

function fromEditForm(form: EditForm): ParsedQuestion {
  const options = form.options.trim() ? (JSON.parse(form.options) as QuestionOption[]) : null
  const difficulty = form.difficulty ? Number(form.difficulty) : null

  return {
    type: form.type,
    content: form.content.trim(),
    options,
    answer: form.answer.trim(),
    explanation: form.explanation.trim() || null,
    category: form.category.trim() || null,
    difficulty: Number.isFinite(difficulty) ? difficulty : null,
  }
}

function formatOptionsSummary(question: ParsedQuestion) {
  if (!question.options?.length) return '无选项'
  return `${question.options.length} 个选项`
}

export default function ImportPage() {
  const router = useRouter()
  const [mode, setMode] = useState<ImportMode>('ai')
  const [aiFile, setAiFile] = useState<File | null>(null)
  const [templateFile, setTemplateFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [questions, setQuestions] = useState<ParsedQuestion[]>([])
  const [notice, setNotice] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [importSource, setImportSource] = useState('')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<EditForm | null>(null)

  const activeFile = mode === 'ai' ? aiFile : templateFile

  const resetPreview = () => {
    setQuestions([])
    setNotice('')
    setErrors([])
    setImportSource('')
  }

  const switchMode = (nextMode: ImportMode) => {
    setMode(nextMode)
    resetPreview()
  }

  const handleFileChange =
    (targetMode: ImportMode) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0]
      if (!selectedFile) return

      if (targetMode === 'ai') {
        setAiFile(selectedFile)
      } else {
        setTemplateFile(selectedFile)
      }
      resetPreview()
    }

  const handleAIParse = async () => {
    if (!aiFile) return

    setParsing(true)
    setNotice('')
    setErrors([])

    try {
      const formData = new FormData()
      formData.append('file', aiFile)

      const config = getAIConfig()
      if (config) {
        formData.append('provider', config.provider || 'deepseek')
        formData.append('config', JSON.stringify(config))
      }

      const response = await fetch('/api/import', { method: 'POST', body: formData })
      const data = (await response.json()) as ImportResponse
      if (!response.ok || data.error) throw new Error(data.error || '解析失败')

      const parsedQuestions = data.questions ?? []
      setQuestions(parsedQuestions)
      setImportSource(aiFile.name)

      const notices = []
      if (data.truncated) notices.push('文档较长，仅解析前 12000 字。')
      if (data.fallback) notices.push(`AI 不可用，已使用本地规则生成预览。原因：${data.aiError}`)
      if (parsedQuestions.length === 0) notices.push('未识别到有效题目，请检查文档格式或 AI 配置。')
      setNotice(notices.join(' '))
    } catch (parseError) {
      alert(parseError instanceof Error ? parseError.message : '解析失败，请重试')
    } finally {
      setParsing(false)
    }
  }

  const handleTemplateParse = async () => {
    if (!templateFile) return

    setParsing(true)
    setNotice('')
    setErrors([])

    try {
      const formData = new FormData()
      formData.append('file', templateFile)

      const response = await fetch('/api/import/template', { method: 'POST', body: formData })
      const data = (await response.json()) as TemplateImportResponse
      if (!response.ok || data.error) throw new Error(data.error || '模板解析失败')

      const parsedQuestions = data.questions ?? []
      setQuestions(parsedQuestions)
      setErrors(data.errors ?? [])
      setImportSource(templateFile.name)

      if (parsedQuestions.length === 0) {
        setNotice('模板中没有可导入的有效题目，请根据错误提示修改后重新上传。')
      } else if (data.errors?.length) {
        setNotice(`已解析 ${parsedQuestions.length} 道有效题目，另有 ${data.errors.length} 行需要修正。`)
      } else {
        setNotice(`已解析 ${parsedQuestions.length} 道题目，请确认无误后入库。`)
      }
    } catch (parseError) {
      alert(parseError instanceof Error ? parseError.message : '模板解析失败，请重试')
    } finally {
      setParsing(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      const response = await fetch('/api/import', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions, source: importSource || activeFile?.name }),
      })
      const data = (await response.json()) as SaveResponse
      if (!response.ok || data.error || !data.success) throw new Error(data.error || '保存失败')

      alert(`成功导入 ${data.count ?? 0} 道题目`)
      router.push('/admin/questions')
    } catch (saveError) {
      alert(saveError instanceof Error ? saveError.message : '保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (index: number) => {
    setEditingIndex(index)
    setEditForm(toEditForm(questions[index]))
  }

  const saveEdit = () => {
    if (editingIndex === null || !editForm) return

    try {
      const updated = fromEditForm(editForm)
      if (!updated.content || !updated.answer) throw new Error('题干和答案不能为空')
      setQuestions((prev) => prev.map((question, index) => (index === editingIndex ? updated : question)))
      setEditingIndex(null)
      setEditForm(null)
    } catch (editError) {
      alert(editError instanceof Error ? editError.message : '编辑内容格式不正确')
    }
  }

  const handleDeleteQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, currentIndex) => currentIndex !== index))
  }

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">导入题库</h1>
        <p className="mt-1 text-sm text-gray-500">
          支持 AI 解析 DOCX，也支持按模板整理后批量导入。
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => switchMode('ai')}
          className={`flex min-h-11 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'ai' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600'
          }`}
        >
          <Bot className="h-4 w-4" />
          AI 导入
        </button>
        <button
          type="button"
          onClick={() => switchMode('template')}
          className={`flex min-h-11 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'template' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600'
          }`}
        >
          <FileText className="h-4 w-4" />
          模板导入
        </button>
      </div>

      {mode === 'ai' ? (
        <section className="space-y-4">
          <div className="rounded-xl bg-primary-50 px-4 py-3 text-sm text-primary-800">
            上传 DOCX 后系统会调用已配置的大模型解析题目；如果 AI 不可用，会尝试用本地规则生成预览。
          </div>
          <div className="rounded-2xl border-2 border-dashed border-gray-300 p-8 text-center">
            <input
              type="file"
              accept=".docx"
              onChange={handleFileChange('ai')}
              className="hidden"
              id="ai-file-upload"
            />
            <label htmlFor="ai-file-upload" className="flex cursor-pointer flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
                <Upload className="h-8 w-8 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {aiFile ? aiFile.name : '点击上传 DOCX 文档'}
                </p>
                <p className="mt-1 text-sm text-gray-500">支持 .docx 格式</p>
              </div>
            </label>
          </div>
          {aiFile && questions.length === 0 && (
            <Button onClick={handleAIParse} loading={parsing} className="w-full" size="lg">
              <Sparkles className="mr-2 h-4 w-4" />
              开始 AI 解析
            </Button>
          )}
        </section>
      ) : (
        <section className="space-y-4">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">1. 下载模板并填写题库</h2>
                <p className="mt-1 text-sm text-gray-500">
                  CSV 可用 Excel/WPS 打开。题型支持单选题、多选题、判断题、填空题、简答题。
                </p>
              </div>
              <a
                href="/api/import/template"
                download
                className="inline-flex min-h-11 items-center justify-center rounded-lg border-2 border-primary-600 bg-white px-4 py-2 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50"
              >
                <Download className="mr-2 h-4 w-4" />
                下载模板
              </a>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-dashed border-gray-300 p-8 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange('template')}
              className="hidden"
              id="template-file-upload"
            />
            <label htmlFor="template-file-upload" className="flex cursor-pointer flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <Upload className="h-8 w-8 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {templateFile ? templateFile.name : '上传已填写的 CSV 模板'}
                </p>
                <p className="mt-1 text-sm text-gray-500">解析后会先预览，不会直接入库</p>
              </div>
            </label>
          </div>

          {templateFile && questions.length === 0 && (
            <Button onClick={handleTemplateParse} loading={parsing} className="w-full" size="lg">
              <FileText className="mr-2 h-4 w-4" />
              解析模板
            </Button>
          )}
        </section>
      )}

      {notice && <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{notice}</div>}

      {errors.length > 0 && (
        <div className="space-y-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="h-4 w-4" />
            模板中存在需要修正的行
          </div>
          <ul className="list-disc space-y-1 pl-5">
            {errors.slice(0, 8).map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
          {errors.length > 8 && <p>还有 {errors.length - 8} 条错误未显示。</p>}
        </div>
      )}

      {questions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">预览结果（{questions.length} 道）</h2>
            <Button variant="outline" size="sm" onClick={resetPreview}>
              清空
            </Button>
          </div>

          <div className="space-y-3">
            {questions.map((question, index) => (
              <motion.div
                key={`${question.content}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.03, 0.3) }}
                className="rounded-xl bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded bg-primary-100 px-2 py-1 text-xs text-primary-700">
                        {QUESTION_TYPE_LABELS[question.type]}
                      </span>
                      <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                        {formatOptionsSummary(question)}
                      </span>
                      {question.category && (
                        <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                          {question.category}
                        </span>
                      )}
                    </div>
                    <p className="line-clamp-2 text-sm text-gray-900">{question.content}</p>
                    <p className="mt-2 text-xs text-gray-500">答案：{question.answer}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(index)}
                      className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-primary-50 hover:text-primary-600"
                      aria-label="编辑题目"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(index)}
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

          <Button onClick={handleSave} loading={saving} className="w-full" size="lg">
            <Check className="mr-2 h-4 w-4" />
            确认导入 {questions.length} 道题目
          </Button>
        </div>
      )}

      <AnimatePresence>
        {editingIndex !== null && editForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => {
                setEditingIndex(null)
                setEditForm(null)
              }}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-h-[90vh] overflow-y-auto rounded-t-2xl bg-white p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">编辑导入题目</h2>
                <button
                  onClick={() => {
                    setEditingIndex(null)
                    setEditForm(null)
                  }}
                  aria-label="关闭"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <select
                  value={editForm.type}
                  onChange={(event) =>
                    setEditForm((prev) =>
                      prev ? { ...prev, type: event.target.value as QuestionType } : prev
                    )
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                >
                  {QUESTION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {QUESTION_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
                <textarea
                  value={editForm.content}
                  onChange={(event) =>
                    setEditForm((prev) => (prev ? { ...prev, content: event.target.value } : prev))
                  }
                  rows={3}
                  placeholder="题干"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                />
                <textarea
                  value={editForm.options}
                  onChange={(event) =>
                    setEditForm((prev) => (prev ? { ...prev, options: event.target.value } : prev))
                  }
                  rows={5}
                  placeholder="选择题选项 JSON，可留空"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-xs focus:border-transparent focus:ring-2 focus:ring-primary-500"
                />
                <input
                  value={editForm.answer}
                  onChange={(event) =>
                    setEditForm((prev) => (prev ? { ...prev, answer: event.target.value } : prev))
                  }
                  placeholder="答案"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                />
                <textarea
                  value={editForm.explanation}
                  onChange={(event) =>
                    setEditForm((prev) =>
                      prev ? { ...prev, explanation: event.target.value } : prev
                    )
                  }
                  rows={2}
                  placeholder="解析"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={editForm.category}
                    onChange={(event) =>
                      setEditForm((prev) =>
                        prev ? { ...prev, category: event.target.value } : prev
                      )
                    }
                    placeholder="分类"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                  />
                  <input
                    value={editForm.difficulty}
                    onChange={(event) =>
                      setEditForm((prev) =>
                        prev ? { ...prev, difficulty: event.target.value } : prev
                      )
                    }
                    placeholder="难度 1-5"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <Button onClick={saveEdit} className="w-full" size="lg">
                  保存修改
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
