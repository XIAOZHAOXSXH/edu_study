'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Save } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { AIProviderConfig } from '@/lib/types'

interface AIStatus {
  source: 'env' | 'local' | 'none'
  effectiveProvider: string | null
  envConfiguredProviders: string[]
  error?: string
}

const defaultConfigs: Record<string, AIProviderConfig> = {
  deepseek: {
    provider: 'deepseek',
    baseURL: 'https://api.deepseek.com/v1',
    apiKey: '',
    model: 'deepseek-chat',
  },
  openai: {
    provider: 'openai',
    baseURL: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4o-mini',
  },
  mimo: {
    provider: 'mimo',
    baseURL: 'https://api.siliconflow.cn/v1',
    apiKey: '',
    model: 'MiMo-7B-Chat',
  },
}

export default function SettingsPage() {
  const [activeProvider, setActiveProvider] = useState('deepseek')
  const [configs, setConfigs] = useState<Record<string, AIProviderConfig>>(defaultConfigs)
  const [status, setStatus] = useState<AIStatus | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const savedConfig = window.localStorage.getItem('ai_config')
        if (savedConfig) {
          const parsed = JSON.parse(savedConfig) as AIProviderConfig
          if (parsed.provider) {
            setConfigs((prev) => ({ ...prev, [String(parsed.provider)]: parsed }))
            setActiveProvider(String(parsed.provider))
          }
        }
      } catch {
        window.localStorage.removeItem('ai_config')
      }

      fetch('/api/ai')
        .then((response) => response.json())
        .then((data: AIStatus) => setStatus(data))
        .catch(() =>
          setStatus({
            source: 'none',
            effectiveProvider: null,
            envConfiguredProviders: [],
            error: '无法读取服务端 AI 配置状态',
          })
        )
    }, 0)

    return () => window.clearTimeout(timer)
  }, [])

  const handleSave = () => {
    setSaving(true)
    const config = { ...configs[activeProvider], provider: activeProvider }
    window.localStorage.setItem('ai_config', JSON.stringify(config))

    window.setTimeout(() => {
      setSaving(false)
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2000)
    }, 300)
  }

  const updateConfig = (field: keyof AIProviderConfig, value: string) => {
    setConfigs((prev) => ({
      ...prev,
      [activeProvider]: {
        ...prev[activeProvider],
        [field]: value,
      },
    }))
  }

  const currentConfig = configs[activeProvider]
  const envProviders = status?.envConfiguredProviders ?? []
  const hasEnvConfig = envProviders.length > 0

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">AI 设置</h1>
        <p className="mt-1 text-sm text-gray-500">
          服务端优先读取 .env；DeepSeek、OpenAI、小米 MiMo 三者只需配置一个，配置哪家就会使用哪家。
        </p>
      </div>

      <div
        className={`rounded-xl p-4 text-sm leading-6 ${
          hasEnvConfig ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-800'
        }`}
      >
        {hasEnvConfig ? (
          <>
            <p className="font-medium">已检测到 .env 配置</p>
            <p>可用 Provider：{envProviders.join(' / ')}</p>
            <p>当前默认优先使用：{status?.effectiveProvider}</p>
            <p>本页保存的浏览器本地配置不会覆盖 .env。</p>
          </>
        ) : (
          <>
            <p className="font-medium">未检测到 .env 中的可用 API Key</p>
            <p>请在 .env 中配置 DEEPSEEK_API_KEY、OPENAI_API_KEY 或 MIMO_API_KEY 任意一个。</p>
            <p>没有 .env 配置时，才会使用下方保存到浏览器的本地配置。</p>
          </>
        )}
        {status?.error && <p>{status.error}</p>}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">本地兜底 Provider</label>
        <div className="grid grid-cols-3 gap-3">
          {Object.keys(defaultConfigs).map((provider) => (
            <button
              key={provider}
              onClick={() => setActiveProvider(provider)}
              className={`rounded-xl border-2 p-3 text-center transition-all ${
                activeProvider === provider
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <span className="font-medium capitalize">{provider}</span>
            </button>
          ))}
        </div>
      </div>

      <motion.div
        key={activeProvider}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Base URL</label>
          <input
            type="text"
            value={currentConfig.baseURL}
            onChange={(event) => updateConfig('baseURL', event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 transition-all focus:border-transparent focus:ring-2 focus:ring-primary-500"
            placeholder="https://api.example.com/v1"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">API Key</label>
          <input
            type="password"
            value={currentConfig.apiKey}
            onChange={(event) => updateConfig('apiKey', event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 transition-all focus:border-transparent focus:ring-2 focus:ring-primary-500"
            placeholder="sk-..."
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">模型名称</label>
          <input
            type="text"
            value={currentConfig.model}
            onChange={(event) => updateConfig('model', event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 transition-all focus:border-transparent focus:ring-2 focus:ring-primary-500"
            placeholder="deepseek-chat"
          />
        </div>
      </motion.div>

      <Button onClick={handleSave} loading={saving} className="w-full" size="lg">
        {saved ? (
          <>
            <Check className="mr-2 h-4 w-4" />
            已保存
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            保存本地兜底配置
          </>
        )}
      </Button>

      <div className="rounded-xl bg-gray-50 p-4 text-sm leading-6 text-gray-600">
        <p className="mb-2 font-medium text-gray-900">优先级</p>
        <p>1. 服务端 .env 中任意已配置的 Provider。</p>
        <p>2. 多个 .env Provider 同时可用时，请求指定的 Provider 优先；否则按 DeepSeek、OpenAI、MiMo 顺序选择。</p>
        <p>3. .env 三家都未配置时，才使用本页保存的本地兜底配置。</p>
      </div>
    </div>
  )
}
