# 教育刷题平台实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个面向中学教师资格证考试的 H5 刷题平台，支持 DOCX 导入题库、多种刷题模式、AI 判分与解析。

**Architecture:** Next.js App Router 全栈架构，Prisma ORM + Supabase PostgreSQL，Vercel AI SDK 统一调用多个大模型。

**Tech Stack:** Next.js 14, Tailwind CSS, Framer Motion, Prisma, Supabase, Vercel AI SDK, mammoth.js, Zustand

---

## 文件结构

```
edu_study/
├── app/
│   ├── layout.tsx                 # 根布局
│   ├── page.tsx                   # 首页
│   ├── login/page.tsx             # 登录页
│   ├── practice/page.tsx          # 刷题页
│   ├── result/page.tsx            # 结果页
│   ├── exam/page.tsx              # 组卷页
│   ├── admin/
│   │   ├── questions/page.tsx     # 题目管理
│   │   └── import/page.tsx        # DOCX导入
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── questions/route.ts
│       ├── questions/[id]/route.ts
│       ├── practice/route.ts
│       ├── exam/route.ts
│       ├── import/route.ts
│       └── ai/route.ts
├── components/
│   ├── ui/                        # 基础UI组件
│   ├── layout/                    # 布局组件
│   ├── questions/                 # 题目相关组件
│   └── practice/                  # 刷题相关组件
├── lib/
│   ├── prisma.ts                  # Prisma客户端
│   ├── auth.ts                    # 认证工具
│   ├── ai.ts                      # AI调用封装
│   ├── docx.ts                    # DOCX解析
│   └── utils.ts                   # 工具函数
├── stores/                        # Zustand状态
├── prisma/schema.prisma           # 数据库模型
└── package.json
```

---

## Task 1: 项目初始化

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.js`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `.env.local`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`

- [ ] **Step 1: 初始化 Next.js 项目**

```bash
cd D:/Develop/edu_study
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
```

Expected: Next.js 项目创建成功

- [ ] **Step 2: 安装依赖**

```bash
npm install prisma @prisma/client next-auth bcryptjs zustand framer-motion mammoth @ai-sdk/openai ai
npm install -D @types/bcryptjs
```

Expected: 依赖安装成功

- [ ] **Step 3: 初始化 Prisma**

```bash
npx prisma init
```

Expected: `prisma/schema.prisma` 文件创建成功

- [ ] **Step 4: 配置环境变量**

Create `.env.local`:
```env
DATABASE_URL="postgresql://user:password@host:5432/edu_study"
NEXTAUTH_SECRET="your-secret-key"
OPENAI_API_KEY="your-openai-key"
DEEPSEEK_API_KEY="your-deepseek-key"
MIMO_API_KEY="your-mimo-key"
```

- [ ] **Step 5: 配置 Tailwind**

Update `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f4ff',
          100: '#dbe4ff',
          200: '#bac8ff',
          300: '#91a7ff',
          400: '#748ffc',
          500: '#5c7cfa',
          600: '#4c6ef5',
          700: '#4263eb',
          800: '#3b5bdb',
          900: '#364fc7',
        },
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 6: 创建根布局**

Create `app/layout.tsx`:
```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '教育刷题平台',
  description: '中学教师资格证考试刷题系统',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  )
}
```

- [ ] **Step 7: 创建首页占位**

Create `app/page.tsx`:
```tsx
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold text-primary-600">教育刷题平台</h1>
      <p className="mt-2 text-gray-600">中学教师资格证考试</p>
    </main>
  )
}
```

- [ ] **Step 8: 验证项目启动**

```bash
npm run dev
```

Expected: 项目在 http://localhost:3000 启动成功

- [ ] **Step 9: 提交代码**

```bash
git init
git add .
git commit -m "feat: 初始化 Next.js 项目"
```

---

## Task 2: 数据库模型

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `lib/prisma.ts`

- [ ] **Step 1: 定义 Prisma Schema**

Update `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  username  String   @unique
  password  String
  createdAt DateTime @default(now())
  answers   AnswerRecord[]
  exams     Exam[]
}

model Question {
  id          String       @id @default(cuid())
  type        QuestionType
  content     String
  options     Json?
  answer      String
  explanation String?
  category    String?
  difficulty  Int?
  source      String?
  createdAt   DateTime     @default(now())
  answers     AnswerRecord[]
}

model AnswerRecord {
  id         String      @id @default(cuid())
  userId     String
  user       User        @relation(fields: [userId], references: [id])
  questionId String
  question   Question    @relation(fields: [questionId], references: [id])
  userAnswer String
  isCorrect  Boolean?
  aiScore    Float?
  aiComment  String?
  mode       PracticeMode
  createdAt  DateTime    @default(now())
}

model Exam {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  title       String
  config      Json
  questionIds String[]
  score       Float?
  createdAt   DateTime @default(now())
}

model AIConfig {
  id       String @id @default(cuid())
  provider String
  apiKey   String
  model    String
  isActive Boolean @default(true)
}

enum QuestionType {
  SINGLE_CHOICE
  MULTIPLE_CHOICE
  TRUE_FALSE
  FILL_BLANK
  SHORT_ANSWER
}

enum PracticeMode {
  SEQUENTIAL
  RANDOM
  EXAM
}
```

- [ ] **Step 2: 创建 Prisma 客户端**

Create `lib/prisma.ts`:
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 3: 运行数据库迁移**

```bash
npx prisma migrate dev --name init
```

Expected: 数据库表创建成功

- [ ] **Step 4: 生成 Prisma 客户端**

```bash
npx prisma generate
```

Expected: Prisma 客户端生成成功

- [ ] **Step 5: 提交代码**

```bash
git add prisma/schema.prisma lib/prisma.ts
git commit -m "feat: 添加数据库模型"
```

---

## Task 3: 认证系统

**Files:**
- Create: `lib/auth.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`
- Create: `app/login/page.tsx`
- Create: `components/ui/Button.tsx`
- Create: `components/ui/Input.tsx`

- [ ] **Step 1: 创建认证工具**

Create `lib/auth.ts`:
```typescript
import { compare, hash } from 'bcryptjs'
import { prisma } from './prisma'

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword)
}

export async function findUserByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username },
  })
}

export async function createUser(username: string, password: string) {
  const hashedPassword = await hashPassword(password)
  return prisma.user.create({
    data: {
      username,
      password: hashedPassword,
    },
  })
}
```

- [ ] **Step 2: 创建 NextAuth 配置**

Create `app/api/auth/[...nextauth]/route.ts`:
```typescript
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { verifyPassword, findUserByUsername, createUser } from '@/lib/auth'

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error('请输入用户名和密码')
        }

        const user = await findUserByUsername(credentials.username)

        if (!user) {
          // 自动注册
          const newUser = await createUser(credentials.username, credentials.password)
          return { id: newUser.id, name: newUser.username }
        }

        const isValid = await verifyPassword(credentials.password, user.password)

        if (!isValid) {
          throw new Error('密码错误')
        }

        return { id: user.id, name: user.username }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
})

export { handler as GET, handler as POST }
```

- [ ] **Step 3: 创建 Button 组件**

Create `components/ui/Button.tsx`:
```tsx
'use client'

import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
    ghost: 'text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </motion.button>
  )
}
```

- [ ] **Step 4: 创建 Input 组件**

Create `components/ui/Input.tsx`:
```tsx
'use client'

import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${
            error ? 'border-red-500' : ''
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
```

- [ ] **Step 5: 创建登录页面**

Create `app/login/page.tsx`:
```tsx
'use client'

import { useState } from 'react'
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
    } catch (err) {
      setError('登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">教育刷题平台</h1>
          <p className="mt-2 text-gray-600">中学教师资格证考试</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="用户名"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="请输入用户名"
            required
          />

          <Input
            label="密码"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入密码"
            required
          />

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-red-500 text-center"
            >
              {error}
            </motion.p>
          )}

          <Button
            type="submit"
            loading={loading}
            className="w-full"
            size="lg"
          >
            登录 / 注册
          </Button>
        </form>
      </motion.div>
    </div>
  )
}
```

- [ ] **Step 6: 测试认证流程**

1. 访问 http://localhost:3000/login
2. 输入用户名和密码
3. 点击登录
4. 验证自动注册并登录成功

- [ ] **Step 7: 提交代码**

```bash
git add lib/auth.ts app/api/auth components/ui app/login
git commit -m "feat: 添加认证系统"
```

---

## Task 4: 题目管理 API

**Files:**
- Create: `app/api/questions/route.ts`
- Create: `app/api/questions/[id]/route.ts`

- [ ] **Step 1: 创建题目列表 API**

Create `app/api/questions/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const type = searchParams.get('type')
  const category = searchParams.get('category')
  const search = searchParams.get('search')

  const where: any = {}
  if (type) where.type = type
  if (category) where.category = category
  if (search) {
    where.content = { contains: search, mode: 'insensitive' }
  }

  const [questions, total] = await Promise.all([
    prisma.question.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.question.count({ where }),
  ])

  return NextResponse.json({
    questions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  })
}

export async function POST(request: Request) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const body = await request.json()
  const { type, content, options, answer, explanation, category, difficulty } = body

  if (!type || !content || !answer) {
    return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
  }

  const question = await prisma.question.create({
    data: {
      type,
      content,
      options,
      answer,
      explanation,
      category,
      difficulty,
    },
  })

  return NextResponse.json(question, { status: 201 })
}
```

- [ ] **Step 2: 创建单个题目 API**

Create `app/api/questions/[id]/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const question = await prisma.question.findUnique({
    where: { id: params.id },
  })

  if (!question) {
    return NextResponse.json({ error: '题目不存在' }, { status: 404 })
  }

  return NextResponse.json(question)
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const body = await request.json()
  const { type, content, options, answer, explanation, category, difficulty } = body

  const question = await prisma.question.update({
    where: { id: params.id },
    data: {
      type,
      content,
      options,
      answer,
      explanation,
      category,
      difficulty,
    },
  })

  return NextResponse.json(question)
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  await prisma.question.delete({
    where: { id: params.id },
  })

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 3: 测试 API**

```bash
# 获取题目列表
curl http://localhost:3000/api/questions

# 创建题目
curl -X POST http://localhost:3000/api/questions \
  -H "Content-Type: application/json" \
  -d '{"type":"SINGLE_CHOICE","content":"测试题目","options":[{"label":"A","text":"选项A"},{"label":"B","text":"选项B"}],"answer":"A"}'
```

- [ ] **Step 4: 提交代码**

```bash
git add app/api/questions
git commit -m "feat: 添加题目管理 API"
```

---

## Task 5: 刷题 API

**Files:**
- Create: `app/api/practice/route.ts`

- [ ] **Step 1: 创建刷题 API**

Create `app/api/practice/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('mode') || 'SEQUENTIAL'
  const category = searchParams.get('category')
  const limit = parseInt(searchParams.get('limit') || '50')

  const where: any = {}
  if (category) where.category = category

  let questions
  if (mode === 'RANDOM') {
    questions = await prisma.question.findMany({
      where,
      take: limit,
      orderBy: { id: 'asc' },
    })
    // 随机打乱
    questions = questions.sort(() => Math.random() - 0.5)
  } else {
    questions = await prisma.question.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'asc' },
    })
  }

  return NextResponse.json({ questions, mode })
}

export async function POST(request: Request) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const body = await request.json()
  const { questionId, userAnswer, mode } = body

  const question = await prisma.question.findUnique({
    where: { id: questionId },
  })

  if (!question) {
    return NextResponse.json({ error: '题目不存在' }, { status: 404 })
  }

  // 判断客观题
  let isCorrect = null
  let aiScore = null
  let aiComment = null

  if (['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE'].includes(question.type)) {
    isCorrect = question.answer === userAnswer
  } else if (question.type === 'FILL_BLANK') {
    // 填空题需要 AI 判断
    // 这里先用简单匹配，AI 判分在单独的 API 处理
    isCorrect = question.answer.toLowerCase().trim() === userAnswer.toLowerCase().trim()
  }

  // 保存答题记录
  const record = await prisma.answerRecord.create({
    data: {
      userId: session.user?.id || '',
      questionId,
      userAnswer,
      isCorrect,
      aiScore,
      aiComment,
      mode: mode as any,
    },
  })

  return NextResponse.json({
    record,
    correctAnswer: question.answer,
    explanation: question.explanation,
  })
}
```

- [ ] **Step 2: 测试刷题 API**

```bash
# 获取顺序刷题
curl http://localhost:3000/api/practice?mode=SEQUENTIAL

# 获取随机刷题
curl http://localhost:3000/api/practice?mode=RANDOM

# 提交答案
curl -X POST http://localhost:3000/api/practice \
  -H "Content-Type: application/json" \
  -d '{"questionId":"xxx","userAnswer":"A","mode":"SEQUENTIAL"}'
```

- [ ] **Step 3: 提交代码**

```bash
git add app/api/practice
git commit -m "feat: 添加刷题 API"
```

---

## Task 6: 组卷 API

**Files:**
- Create: `app/api/exam/route.ts`

- [ ] **Step 1: 创建组卷 API**

Create `app/api/exam/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const body = await request.json()
  const { title, config } = body
  // config 示例: { SINGLE_CHOICE: 10, MULTIPLE_CHOICE: 5, TRUE_FALSE: 10, FILL_BLANK: 5, SHORT_ANSWER: 3 }

  const questionIds: string[] = []

  // 按题型随机抽取
  for (const [type, count] of Object.entries(config)) {
    const questions = await prisma.question.findMany({
      where: { type: type as any },
      take: count as number,
      orderBy: { id: 'asc' },
    })

    // 随机打乱并取指定数量
    const shuffled = questions.sort(() => Math.random() - 0.5).slice(0, count as number)
    questionIds.push(...shuffled.map(q => q.id))
  }

  // 创建试卷
  const exam = await prisma.exam.create({
    data: {
      userId: session.user?.id || '',
      title: title || '模拟试卷',
      config,
      questionIds,
    },
  })

  return NextResponse.json(exam, { status: 201 })
}

export async function GET(request: Request) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const exams = await prisma.exam.findMany({
    where: { userId: session.user?.id || '' },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  return NextResponse.json(exams)
}
```

- [ ] **Step 2: 测试组卷 API**

```bash
# 创建试卷
curl -X POST http://localhost:3000/api/exam \
  -H "Content-Type: application/json" \
  -d '{"title":"模拟试卷1","config":{"SINGLE_CHOICE":10,"MULTIPLE_CHOICE":5,"TRUE_FALSE":10}}'

# 获取试卷列表
curl http://localhost:3000/api/exam
```

- [ ] **Step 3: 提交代码**

```bash
git add app/api/exam
git commit -m "feat: 添加组卷 API"
```

---

## Task 7: AI 集成

**Files:**
- Create: `lib/ai.ts`
- Create: `app/api/ai/route.ts`

- [ ] **Step 1: 创建 AI 工具库**

Create `lib/ai.ts`:
```typescript
import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'

// 创建 AI 客户端
const deepseek = createOpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY || '',
})

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

const mimo = createOpenAI({
  baseURL: 'https://api.xiaomi.com/v1',
  apiKey: process.env.MIMO_API_KEY || '',
})

// 获取 AI 模型
export function getAIModel(provider: string = 'deepseek') {
  switch (provider) {
    case 'deepseek':
      return deepseek('deepseek-chat')
    case 'openai':
      return openai('gpt-4o-mini')
    case 'mimo':
      return mimo('mimo-chat')
    default:
      return deepseek('deepseek-chat')
  }
}

// AI 解析题目
export async function parseQuestionsWithAI(text: string, provider: string = 'deepseek') {
  const model = getAIModel(provider)

  const prompt = `请分析以下教育内容，提取或生成题目。返回 JSON 数组格式。

内容：
${text}

返回格式：
[
  {
    "type": "SINGLE_CHOICE | MULTIPLE_CHOICE | TRUE_FALSE | FILL_BLANK | SHORT_ANSWER",
    "content": "题目内容",
    "options": [{"label": "A", "text": "选项内容"}], // 选择题需要
    "answer": "正确答案",
    "explanation": "解析",
    "category": "分类"
  }
]

注意：
1. 如果内容中已有题目，直接提取
2. 如果是知识点，根据知识点生成相关题目
3. 每个知识点可以生成 1-3 道题
4. 确保答案正确，解析详细`

  const { text: result } = await generateText({
    model,
    prompt,
  })

  try {
    return JSON.parse(result)
  } catch {
    // 尝试提取 JSON
    const jsonMatch = result.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    throw new Error('AI 返回格式错误')
  }
}

// AI 判分
export async function gradeWithAI(
  question: string,
  standardAnswer: string,
  userAnswer: string,
  provider: string = 'deepseek'
) {
  const model = getAIModel(provider)

  const prompt = `请对以下简答题进行评分。

题目：${question}
标准答案：${standardAnswer}
用户答案：${userAnswer}

请返回 JSON 格式：
{
  "score": 0-100,
  "comment": "详细评语，指出优点和不足"
}`

  const { text: result } = await generateText({
    model,
    prompt,
  })

  try {
    return JSON.parse(result)
  } catch {
    const jsonMatch = result.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    throw new Error('AI 返回格式错误')
  }
}

// AI 解析
export async function explainWithAI(
  question: string,
  options: any[] | null,
  correctAnswer: string,
  userAnswer: string | null,
  provider: string = 'deepseek'
) {
  const model = getAIModel(provider)

  let prompt = `请详细解析以下题目。

题目：${question}
`

  if (options && options.length > 0) {
    prompt += `选项：${options.map(o => `${o.label}. ${o.text}`).join('\n')}\n`
  }

  prompt += `正确答案：${correctAnswer}\n`

  if (userAnswer) {
    prompt += `用户答案：${userAnswer}\n`
  }

  prompt += `
请提供：
1. 为什么这个答案是正确的
2. 其他选项为什么错误（如果是选择题）
3. 相关知识点拓展
4. 记忆技巧或口诀（如果有）`

  const { text } = await generateText({
    model,
    prompt,
  })

  return text
}
```

- [ ] **Step 2: 创建 AI API**

Create `app/api/ai/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { parseQuestionsWithAI, gradeWithAI, explainWithAI } from '@/lib/ai'

export async function POST(request: Request) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const body = await request.json()
  const { action, ...data } = body

  try {
    switch (action) {
      case 'parse':
        const questions = await parseQuestionsWithAI(data.text, data.provider)
        return NextResponse.json({ questions })

      case 'grade':
        const gradeResult = await gradeWithAI(
          data.question,
          data.standardAnswer,
          data.userAnswer,
          data.provider
        )
        return NextResponse.json(gradeResult)

      case 'explain':
        const explanation = await explainWithAI(
          data.question,
          data.options,
          data.correctAnswer,
          data.userAnswer,
          data.provider
        )
        return NextResponse.json({ explanation })

      default:
        return NextResponse.json({ error: '未知操作' }, { status: 400 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

- [ ] **Step 3: 测试 AI API**

```bash
# 测试题目解析
curl -X POST http://localhost:3000/api/ai \
  -H "Content-Type: application/json" \
  -d '{"action":"parse","text":"教育学是研究教育现象和教育问题，揭示教育规律的一门科学。"}'

# 测试 AI 判分
curl -X POST http://localhost:3000/api/ai \
  -H "Content-Type: application/json" \
  -d '{"action":"grade","question":"简述教育学的研究对象","standardAnswer":"教育学是研究教育现象和教育问题，揭示教育规律的一门科学。","userAnswer":"教育学研究教育"}'

# 测试 AI 解析
curl -X POST http://localhost:3000/api/ai \
  -H "Content-Type: application/json" \
  -d '{"action":"explain","question":"教育学的研究对象是什么？","correctAnswer":"教育现象和教育问题","userAnswer":"教育"}'
```

- [ ] **Step 4: 提交代码**

```bash
git add lib/ai.ts app/api/ai
git commit -m "feat: 添加 AI 集成"
```

---

## Task 8: DOCX 导入

**Files:**
- Create: `lib/docx.ts`
- Create: `app/api/import/route.ts`

- [ ] **Step 1: 创建 DOCX 解析工具**

Create `lib/docx.ts`:
```typescript
import mammoth from 'mammoth'

export async function parseDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer })
  return result.value
}

export async function parseDocxFromFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  return parseDocx(buffer)
}
```

- [ ] **Step 2: 创建导入 API**

Create `app/api/import/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { parseDocxFromFile } from '@/lib/docx'
import { parseQuestionsWithAI } from '@/lib/ai'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const provider = (formData.get('provider') as string) || 'deepseek'

    if (!file) {
      return NextResponse.json({ error: '请上传文件' }, { status: 400 })
    }

    // 解析 DOCX
    const text = await parseDocxFromFile(file)

    // AI 提取题目
    const questions = await parseQuestionsWithAI(text, provider)

    return NextResponse.json({
      questions,
      filename: file.name,
      textLength: text.length,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { questions, source } = body

    if (!questions || !Array.isArray(questions)) {
      return NextResponse.json({ error: '题目数据格式错误' }, { status: 400 })
    }

    // 批量创建题目
    const created = await prisma.question.createMany({
      data: questions.map((q: any) => ({
        type: q.type,
        content: q.content,
        options: q.options || null,
        answer: q.answer,
        explanation: q.explanation || null,
        category: q.category || null,
        difficulty: q.difficulty || null,
        source: source || null,
      })),
    })

    return NextResponse.json({
      success: true,
      count: created.count,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

- [ ] **Step 3: 测试导入 API**

```bash
# 上传 DOCX 并解析
curl -X POST http://localhost:3000/api/import \
  -F "file=@/path/to/test.docx" \
  -F "provider=deepseek"

# 确认入库
curl -X PUT http://localhost:3000/api/import \
  -H "Content-Type: application/json" \
  -d '{"questions":[{"type":"SINGLE_CHOICE","content":"测试题目","answer":"A"}],"source":"test.docx"}'
```

- [ ] **Step 4: 提交代码**

```bash
git add lib/docx.ts app/api/import
git commit -m "feat: 添加 DOCX 导入功能"
```

---

## Task 9: 前端页面 - 首页

**Files:**
- Create: `components/layout/Header.tsx`
- Create: `components/layout/BottomNav.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: 创建 Header 组件**

Create `components/layout/Header.tsx`:
```tsx
'use client'

import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { User, LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'

export function Header() {
  const { data: session } = useSession()

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200"
    >
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="text-xl font-bold text-primary-600">教育刷题</h1>
        
        {session && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>{session.user?.name}</span>
            </div>
            <button
              onClick={() => signOut()}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </motion.header>
  )
}
```

- [ ] **Step 2: 创建底部导航**

Create `components/layout/BottomNav.tsx`:
```tsx
'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Home, BookOpen, FileText, Settings, User } from 'lucide-react'

const navItems = [
  { href: '/', icon: Home, label: '首页' },
  { href: '/practice', icon: BookOpen, label: '刷题' },
  { href: '/exam', icon: FileText, label: '组卷' },
  { href: '/admin/questions', icon: Settings, label: '题库' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <motion.nav
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom"
    >
      <div className="flex items-center justify-around px-4 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors"
            >
              <item.icon
                className={`h-5 w-5 ${
                  isActive ? 'text-primary-600' : 'text-gray-500'
                }`}
              />
              <span
                className={`text-xs ${
                  isActive ? 'text-primary-600 font-medium' : 'text-gray-500'
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="bottomNav"
                  className="absolute bottom-0 h-0.5 w-12 bg-primary-600"
                />
              )}
            </Link>
          )
        })}
      </div>
    </motion.nav>
  )
}
```

- [ ] **Step 3: 更新根布局**

Update `app/layout.tsx`:
```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '教育刷题平台',
  description: '中学教师资格证考试刷题系统',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.className} min-h-screen bg-gray-50`}>
        <Providers>
          <Header />
          <main className="pb-20">{children}</main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  )
}
```

- [ ] **Step 4: 创建 Providers**

Create `components/Providers.tsx`:
```tsx
'use client'

import { SessionProvider } from 'next-auth/react'

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
```

- [ ] **Step 5: 创建首页**

Update `app/page.tsx`:
```tsx
'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { BookOpen, Shuffle, FileText, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useEffect, useState } from 'react'

interface Stats {
  totalQuestions: number
  practicedToday: number
  correctRate: number
}

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<Stats>({
    totalQuestions: 0,
    practicedToday: 0,
    correctRate: 0,
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  const quickActions = [
    {
      icon: BookOpen,
      label: '顺序刷题',
      description: '按顺序练习所有题目',
      color: 'bg-blue-500',
      onClick: () => router.push('/practice?mode=SEQUENTIAL'),
    },
    {
      icon: Shuffle,
      label: '随机刷题',
      description: '随机打乱题目顺序',
      color: 'bg-green-500',
      onClick: () => router.push('/practice?mode=RANDOM'),
    },
    {
      icon: FileText,
      label: '组卷练习',
      description: '自定义试卷题目数量',
      color: 'bg-purple-500',
      onClick: () => router.push('/exam'),
    },
    {
      icon: BarChart3,
      label: '刷题统计',
      description: '查看学习数据分析',
      color: 'bg-orange-500',
      onClick: () => {},
    },
  ]

  return (
    <div className="p-4 space-y-6">
      {/* 欢迎语 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 text-white"
      >
        <h2 className="text-2xl font-bold">你好，{session.user?.name}！</h2>
        <p className="mt-2 opacity-90">今天也要加油学习哦</p>
      </motion.div>

      {/* 统计卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-4"
      >
        <div className="bg-white rounded-xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-primary-600">{stats.totalQuestions}</p>
          <p className="text-xs text-gray-500 mt-1">总题数</p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-green-600">{stats.practicedToday}</p>
          <p className="text-xs text-gray-500 mt-1">今日练习</p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-orange-600">{stats.correctRate}%</p>
          <p className="text-xs text-gray-500 mt-1">正确率</p>
        </div>
      </motion.div>

      {/* 快捷入口 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">快捷入口</h3>
        <div className="grid grid-cols-2 gap-4">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.label}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              onClick={action.onClick}
              className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left"
            >
              <div className={`${action.color} w-10 h-10 rounded-lg flex items-center justify-center mb-3`}>
                <action.icon className="h-5 w-5 text-white" />
              </div>
              <p className="font-medium text-gray-900">{action.label}</p>
              <p className="text-xs text-gray-500 mt-1">{action.description}</p>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
```

- [ ] **Step 6: 测试首页**

1. 访问 http://localhost:3000
2. 验证自动跳转到登录页
3. 登录后验证首页显示正常
4. 验证底部导航可以点击切换

- [ ] **Step 7: 提交代码**

```bash
git add components/layout components/Providers.tsx app/layout.tsx app/page.tsx
git commit -m "feat: 添加首页和布局组件"
```

---

## Task 10: 刷题页面

**Files:**
- Create: `components/questions/QuestionCard.tsx`
- Create: `components/questions/OptionList.tsx`
- Create: `components/questions/AnswerInput.tsx`
- Create: `components/practice/ProgressBar.tsx`
- Create: `app/practice/page.tsx`

- [ ] **Step 1: 创建进度条组件**

Create `components/practice/ProgressBar.tsx`:
```tsx
'use client'

import { motion } from 'framer-motion'

interface ProgressBarProps {
  current: number
  total: number
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const progress = (current / total) * 100

  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <motion.div
        className="bg-primary-600 h-2 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.3 }}
      />
    </div>
  )
}
```

- [ ] **Step 2: 创建选项列表组件**

Create `components/questions/OptionList.tsx`:
```tsx
'use client'

import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'

interface Option {
  label: string
  text: string
}

interface OptionListProps {
  options: Option[]
  selected: string | string[]
  correctAnswer: string
  showResult: boolean
  multiple?: boolean
  onSelect: (label: string) => void
}

export function OptionList({
  options,
  selected,
  correctAnswer,
  showResult,
  multiple = false,
  onSelect,
}: OptionListProps) {
  const isSelected = (label: string) => {
    if (multiple) {
      return Array.isArray(selected) && selected.includes(label)
    }
    return selected === label
  }

  const isCorrect = (label: string) => {
    if (multiple) {
      return correctAnswer.includes(label)
    }
    return correctAnswer === label
  }

  return (
    <div className="space-y-3">
      {options.map((option, index) => {
        const selected = isSelected(option.label)
        const correct = isCorrect(option.label)
        const showCorrect = showResult && correct
        const showWrong = showResult && selected && !correct

        return (
          <motion.button
            key={option.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => !showResult && onSelect(option.label)}
            disabled={showResult}
            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
              showCorrect
                ? 'border-green-500 bg-green-50'
                : showWrong
                ? 'border-red-500 bg-red-50'
                : selected
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  showCorrect
                    ? 'bg-green-500 text-white'
                    : showWrong
                    ? 'bg-red-500 text-white'
                    : selected
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {showCorrect ? (
                  <Check className="h-4 w-4" />
                ) : showWrong ? (
                  <X className="h-4 w-4" />
                ) : (
                  option.label
                )}
              </div>
              <span className="text-gray-900">{option.text}</span>
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: 创建答题输入组件**

Create `components/questions/AnswerInput.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface AnswerInputProps {
  type: 'FILL_BLANK' | 'SHORT_ANSWER'
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function AnswerInput({ type, value, onChange, disabled }: AnswerInputProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {type === 'FILL_BLANK' ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="请输入答案"
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors disabled:bg-gray-50"
        />
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="请输入你的答案..."
          rows={6}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors resize-none disabled:bg-gray-50"
        />
      )}
    </motion.div>
  )
}
```

- [ ] **Step 4: 创建题目卡片组件**

Create `components/questions/QuestionCard.tsx`:
```tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { OptionList } from './OptionList'
import { AnswerInput } from './AnswerInput'

interface Question {
  id: string
  type: string
  content: string
  options: { label: string; text: string }[] | null
  answer: string
  explanation?: string
}

interface QuestionCardProps {
  question: Question
  userAnswer: string | string[]
  showResult: boolean
  onAnswer: (answer: string | string[]) => void
}

export function QuestionCard({
  question,
  userAnswer,
  showResult,
  onAnswer,
}: QuestionCardProps) {
  const isObjective = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE'].includes(question.type)

  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="bg-white rounded-2xl p-6 shadow-sm"
    >
      {/* 题目类型标签 */}
      <div className="mb-4">
        <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
          {question.type === 'SINGLE_CHOICE' && '单选题'}
          {question.type === 'MULTIPLE_CHOICE' && '多选题'}
          {question.type === 'TRUE_FALSE' && '判断题'}
          {question.type === 'FILL_BLANK' && '填空题'}
          {question.type === 'SHORT_ANSWER' && '简答题'}
        </span>
      </div>

      {/* 题干 */}
      <p className="text-lg text-gray-900 leading-relaxed mb-6">
        {question.content}
      </p>

      {/* 答案区域 */}
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
              const newAnswer = current.includes(label)
                ? current.filter((l) => l !== label)
                : [...current, label]
              onAnswer(newAnswer)
            } else {
              onAnswer(label)
            }
          }}
        />
      ) : (
        <AnswerInput
          type={question.type as 'FILL_BLANK' | 'SHORT_ANSWER'}
          value={typeof userAnswer === 'string' ? userAnswer : ''}
          onChange={onAnswer}
          disabled={showResult}
        />
      )}

      {/* 结果显示 */}
      {showResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-gray-50 rounded-xl"
        >
          <p className="font-medium text-gray-900 mb-2">
            正确答案：{question.answer}
          </p>
          {question.explanation && (
            <p className="text-sm text-gray-600">
              解析：{question.explanation}
            </p>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
```

- [ ] **Step 5: 创建刷题页面**

Create `app/practice/page.tsx`:
```tsx
'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { QuestionCard } from '@/components/questions/QuestionCard'
import { ProgressBar } from '@/components/practice/ProgressBar'

interface Question {
  id: string
  type: string
  content: string
  options: { label: string; text: string }[] | null
  answer: string
  explanation?: string
}

export default function PracticePage() {
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') || 'SEQUENTIAL'

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Record<string, string | string[]>>({})
  const [showResults, setShowResults] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [showAI, setShowAI] = useState(false)
  const [aiExplanation, setAIExplanation] = useState('')

  useEffect(() => {
    fetchQuestions()
  }, [mode])

  const fetchQuestions = async () => {
    try {
      const res = await fetch(`/api/practice?mode=${mode}&limit=50`)
      const data = await res.json()
      setQuestions(data.questions)
    } catch (error) {
      console.error('获取题目失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const currentQuestion = questions[currentIndex]

  const handleAnswer = (answer: string | string[]) => {
    if (!currentQuestion) return
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: answer,
    }))
  }

  const handleSubmit = async () => {
    if (!currentQuestion) return

    const userAnswer = userAnswers[currentQuestion.id]
    if (!userAnswer) return

    // 提交答案
    try {
      const res = await fetch('/api/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          userAnswer: Array.isArray(userAnswer) ? userAnswer.join(',') : userAnswer,
          mode,
        }),
      })

      setShowResults((prev) => ({
        ...prev,
        [currentQuestion.id]: true,
      }))
    } catch (error) {
      console.error('提交答案失败:', error)
    }
  }

  const handleAIExplanation = async () => {
    if (!currentQuestion) return

    setShowAI(true)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'explain',
          question: currentQuestion.content,
          options: currentQuestion.options,
          correctAnswer: currentQuestion.answer,
          userAnswer: userAnswers[currentQuestion.id],
        }),
      })

      const data = await res.json()
      setAIExplanation(data.explanation)
    } catch (error) {
      console.error('获取 AI 解析失败:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-gray-500">暂无题目</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {/* 进度条 */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">
          {currentIndex + 1}/{questions.length}
        </span>
        <ProgressBar current={currentIndex + 1} total={questions.length} />
      </div>

      {/* 题目卡片 */}
      <AnimatePresence mode="wait">
        {currentQuestion && (
          <QuestionCard
            key={currentQuestion.id}
            question={currentQuestion}
            userAnswer={userAnswers[currentQuestion.id] || ''}
            showResult={showResults[currentQuestion.id] || false}
            onAnswer={handleAnswer}
          />
        )}
      </AnimatePresence>

      {/* 操作按钮 */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className="flex-1"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          上一题
        </Button>

        {!showResults[currentQuestion?.id] ? (
          <Button onClick={handleSubmit} className="flex-1">
            提交答案
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
            className="flex-1"
          >
            下一题
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>

      {/* AI 解析按钮 */}
      {showResults[currentQuestion?.id] && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            variant="ghost"
            onClick={handleAIExplanation}
            className="w-full"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            AI 解析
          </Button>
        </motion.div>
      )}

      {/* AI 解析弹窗 */}
      {showAI && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setShowAI(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">AI 解析</h3>
            {aiExplanation ? (
              <div className="prose prose-sm">{aiExplanation}</div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
              </div>
            )}
            <Button
              variant="outline"
              onClick={() => setShowAI(false)}
              className="w-full mt-4"
            >
              关闭
            </Button>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
```

- [ ] **Step 6: 测试刷题功能**

1. 访问 http://localhost:3000/practice?mode=SEQUENTIAL
2. 验证题目显示正常
3. 选择答案并提交
4. 验证结果显示
5. 点击 AI 解析按钮
6. 验证 AI 解析弹窗显示

- [ ] **Step 7: 提交代码**

```bash
git add components/questions components/practice app/practice
git commit -m "feat: 添加刷题页面"
```

---

## Task 11: 题库管理页面

**Files:**
- Create: `app/admin/questions/page.tsx`
- Create: `app/admin/import/page.tsx`

- [ ] **Step 1: 创建题库管理页面**

Create `app/admin/questions/page.tsx`:
```tsx
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Edit, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import Link from 'next/link'

interface Question {
  id: string
  type: string
  content: string
  category?: string
  createdAt: string
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchQuestions()
  }, [page, search])

  const fetchQuestions = async () => {
    try {
      const res = await fetch(
        `/api/questions?page=${page}&limit=20&search=${search}`
      )
      const data = await res.json()
      setQuestions(data.questions)
      setTotalPages(data.pagination.pages)
    } catch (error) {
      console.error('获取题目失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这道题目吗？')) return

    try {
      await fetch(`/api/questions/${id}`, { method: 'DELETE' })
      fetchQuestions()
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  const typeLabels: Record<string, string> = {
    SINGLE_CHOICE: '单选题',
    MULTIPLE_CHOICE: '多选题',
    TRUE_FALSE: '判断题',
    FILL_BLANK: '填空题',
    SHORT_ANSWER: '简答题',
  }

  return (
    <div className="p-4 space-y-4">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">题库管理</h1>
        <Link href="/admin/import">
          <Button size="sm">
            <Upload className="h-4 w-4 mr-2" />
            导入
          </Button>
        </Link>
      </div>

      {/* 搜索 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索题目..."
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* 题目列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          暂无题目，请先导入
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((question, index) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs">
                      {typeLabels[question.type]}
                    </span>
                    {question.category && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                        {question.category}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-900 line-clamp-2">
                    {question.content}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-gray-500 hover:text-primary-600 transition-colors">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(question.id)}
                    className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
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
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: 创建 DOCX 导入页面**

Create `app/admin/import/page.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, Check, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface ParsedQuestion {
  type: string
  content: string
  options?: { label: string; text: string }[]
  answer: string
  explanation?: string
  category?: string
}

export default function ImportPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [questions, setQuestions] = useState<ParsedQuestion[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const handleParse = async () => {
    if (!file) return

    setParsing(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (data.questions) {
        setQuestions(data.questions)
      }
    } catch (error) {
      console.error('解析失败:', error)
      alert('解析失败，请重试')
    } finally {
      setParsing(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/import', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions,
          source: file?.name,
        }),
      })

      const data = await res.json()
      if (data.success) {
        alert(`成功导入 ${data.count} 道题目`)
        router.push('/admin/questions')
      }
    } catch (error) {
      console.error('保存失败:', error)
      alert('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index))
  }

  const typeLabels: Record<string, string> = {
    SINGLE_CHOICE: '单选题',
    MULTIPLE_CHOICE: '多选题',
    TRUE_FALSE: '判断题',
    FILL_BLANK: '填空题',
    SHORT_ANSWER: '简答题',
  }

  return (
    <div className="p-4 space-y-6">
      {/* 头部 */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">导入题库</h1>
        <p className="text-sm text-gray-500 mt-1">
          上传 DOCX 文件，AI 自动提取题目
        </p>
      </div>

      {/* 上传区域 */}
      <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center">
        <input
          type="file"
          accept=".docx"
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <Upload className="h-8 w-8 text-primary-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {file ? file.name : '点击上传 DOCX 文件'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              支持 .docx 格式
            </p>
          </div>
        </label>
      </div>

      {/* 解析按钮 */}
      {file && questions.length === 0 && (
        <Button
          onClick={handleParse}
          loading={parsing}
          className="w-full"
          size="lg"
        >
          <FileText className="h-4 w-4 mr-2" />
          开始解析
        </Button>
      )}

      {/* 解析结果 */}
      {questions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              解析结果（{questions.length} 道题）
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuestions([])}
            >
              清空
            </Button>
          </div>

          <div className="space-y-3">
            {questions.map((question, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs">
                        {typeLabels[question.type]}
                      </span>
                      {question.category && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          {question.category}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-900 line-clamp-2">
                      {question.content}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      答案：{question.answer}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingIndex(index)}
                      className="p-2 text-gray-500 hover:text-primary-600 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(index)}
                      className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* 保存按钮 */}
          <Button
            onClick={handleSave}
            loading={saving}
            className="w-full"
            size="lg"
          >
            <Check className="h-4 w-4 mr-2" />
            确认导入 {questions.length} 道题目
          </Button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: 测试题库管理**

1. 访问 http://localhost:3000/admin/questions
2. 验证题目列表显示
3. 测试搜索功能
4. 测试删除功能

- [ ] **Step 4: 测试 DOCX 导入**

1. 访问 http://localhost:3000/admin/import
2. 上传一个 DOCX 文件
3. 点击解析
4. 验证解析结果显示
5. 点击确认导入
6. 验证题目已入库

- [ ] **Step 5: 提交代码**

```bash
git add app/admin
git commit -m "feat: 添加题库管理页面"
```

---

## Task 12: 组卷页面

**Files:**
- Create: `app/exam/page.tsx`

- [ ] **Step 1: 创建组卷页面**

Create `app/exam/page.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { FileText, Play, Settings } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface ExamConfig {
  SINGLE_CHOICE: number
  MULTIPLE_CHOICE: number
  TRUE_FALSE: number
  FILL_BLANK: number
  SHORT_ANSWER: number
}

export default function ExamPage() {
  const router = useRouter()
  const [title, setTitle] = useState('模拟试卷')
  const [config, setConfig] = useState<ExamConfig>({
    SINGLE_CHOICE: 10,
    MULTIPLE_CHOICE: 5,
    TRUE_FALSE: 10,
    FILL_BLANK: 5,
    SHORT_ANSWER: 3,
  })
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    setCreating(true)
    try {
      const res = await fetch('/api/exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, config }),
      })

      const exam = await res.json()
      router.push(`/practice?mode=EXAM&examId=${exam.id}`)
    } catch (error) {
      console.error('创建试卷失败:', error)
      alert('创建失败，请重试')
    } finally {
      setCreating(false)
    }
  }

  const totalQuestions = Object.values(config).reduce((a, b) => a + b, 0)

  const typeLabels: Record<keyof ExamConfig, string> = {
    SINGLE_CHOICE: '单选题',
    MULTIPLE_CHOICE: '多选题',
    TRUE_FALSE: '判断题',
    FILL_BLANK: '填空题',
    SHORT_ANSWER: '简答题',
  }

  return (
    <div className="p-4 space-y-6">
      {/* 头部 */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">组卷练习</h1>
        <p className="text-sm text-gray-500 mt-1">
          自定义试卷题目数量，随机抽取组卷
        </p>
      </div>

      {/* 试卷名称 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          试卷名称
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="请输入试卷名称"
        />
      </div>

      {/* 题型配置 */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">题型配置</h2>
        
        {Object.entries(config).map(([type, count]) => (
          <motion.div
            key={type}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-4 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-gray-900">
                {typeLabels[type as keyof ExamConfig]}
              </span>
              <span className="text-2xl font-bold text-primary-600">
                {count}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              value={count}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  [type]: parseInt(e.target.value),
                }))
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0</span>
              <span>20</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 总题数 */}
      <div className="bg-primary-50 rounded-xl p-4 text-center">
        <p className="text-sm text-gray-600">总题数</p>
        <p className="text-3xl font-bold text-primary-600">{totalQuestions}</p>
      </div>

      {/* 生成按钮 */}
      <Button
        onClick={handleCreate}
        loading={creating}
        disabled={totalQuestions === 0}
        className="w-full"
        size="lg"
      >
        <Play className="h-4 w-4 mr-2" />
        生成试卷并开始
      </Button>
    </div>
  )
}
```

- [ ] **Step 2: 测试组卷功能**

1. 访问 http://localhost:3000/exam
2. 调整题型数量
3. 点击生成试卷
4. 验证跳转到刷题页面

- [ ] **Step 3: 提交代码**

```bash
git add app/exam
git commit -m "feat: 添加组卷页面"
```

---

## Task 13: 最终测试与部署

**Files:**
- Create: `.env.example`
- Create: `README.md`

- [ ] **Step 1: 创建环境变量示例**

Create `.env.example`:
```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/edu_study"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# AI API Keys
DEEPSEEK_API_KEY="your-deepseek-key"
OPENAI_API_KEY="your-openai-key"
MIMO_API_KEY="your-mimo-key"
```

- [ ] **Step 2: 创建 README**

Create `README.md`:
```markdown
# 教育刷题平台

中学教师资格证考试刷题系统

## 功能特性

- 多种刷题模式：顺序刷题、随机刷题、组卷练习
- AI 智能判分：客观题自动判分，主观题 AI 评分
- AI 解析：每道题可获取 AI 详细解析
- DOCX 导入：上传 DOCX 文件，AI 自动提取题目
- 题库管理：支持题目的增删改查
- 移动端适配：专为 iPhone/iPad 优化

## 技术栈

- Next.js 14 (App Router)
- Tailwind CSS + Framer Motion
- Prisma + Supabase (PostgreSQL)
- Vercel AI SDK
- NextAuth.js

## 快速开始

1. 克隆项目
```bash
git clone <repo-url>
cd edu_study
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
```bash
cp .env.example .env.local
# 编辑 .env.local 填入你的配置
```

4. 初始化数据库
```bash
npx prisma migrate dev
```

5. 启动开发服务器
```bash
npm run dev
```

6. 访问 http://localhost:3000

## 部署到 Vercel

1. 在 Vercel 创建项目
2. 连接 GitHub 仓库
3. 配置环境变量
4. 部署

## 使用说明

1. 访问首页，登录/注册账号
2. 选择刷题模式开始练习
3. 在题库管理页面导入 DOCX 文件
4. 使用组卷功能创建模拟试卷
```

- [ ] **Step 3: 完整功能测试**

1. 测试登录/注册流程
2. 测试顺序刷题
3. 测试随机刷题
4. 测试组卷功能
5. 测试 DOCX 导入
6. 测试 AI 解析
7. 测试题库管理

- [ ] **Step 4: 最终提交**

```bash
git add .
git commit -m "feat: 完成教育刷题平台"
```

- [ ] **Step 5: 部署到 Vercel**

```bash
# 推送到 GitHub
git push origin main

# 在 Vercel 控制台导入项目并部署
```

---

## 完成

恭喜！教育刷题平台已完成开发。主要功能包括：

1. 用户认证系统
2. 多种刷题模式
3. AI 判分与解析
4. DOCX 文档导入
5. 自动组卷功能
6. 题库管理
7. 移动端优化 UI

如需扩展功能，可以考虑：
- 添加更多题型
- 支持图片题目
- 添加学习计划功能
- 社交分享功能
- 离线缓存支持
