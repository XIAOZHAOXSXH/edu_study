'use client'

import { FormEvent, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError(result.error)
      } else {
        router.push('/')
      }
    } catch {
      setError('登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl"
      >
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">教育刷题平台</h1>
          <p className="mt-2 text-gray-600">中学教师资格考试练习系统</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="用户名"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="请输入用户名"
            required
          />

          <Input
            label="密码"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="请输入密码"
            required
          />

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-sm text-red-500"
            >
              {error}
            </motion.p>
          )}

          <Button type="submit" loading={loading} className="w-full" size="lg">
            登录 / 自动注册
          </Button>
        </form>
      </motion.div>
    </div>
  )
}
