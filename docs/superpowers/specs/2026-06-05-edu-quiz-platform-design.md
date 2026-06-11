# 教育刷题平台设计文档

## 概述

一个面向中学教师资格证考试的 H5 刷题平台，支持 iPhone/iPad 访问。核心功能包括：DOCX 文档导入题库、多种刷题模式、AI 判分与解析、自动组卷。

## 技术栈

- **前端框架**：Next.js 14+ (App Router)
- **UI 样式**：Tailwind CSS + Framer Motion
- **状态管理**：Zustand
- **ORM**：Prisma
- **数据库**：Supabase (PostgreSQL)
- **部署**：Vercel
- **DOCX 解析**：mammoth.js
- **AI 调用**：Vercel AI SDK

## 数据模型

```prisma
model User {
  id        String   @id @default(cuid())
  username  String   @unique
  password  String   // bcrypt 加密
  createdAt DateTime @default(now())
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
}

model AnswerRecord {
  id         String      @id @default(cuid())
  userId     String
  questionId String
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
  title       String
  config      Json
  questionIds String[]
  score       Float?
  createdAt   DateTime @default(now())
}

model AIConfig {
  id       String @id @default(cuid())
  provider String // deepseek, openai, mimo
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

## 页面设计

### 1. 首页 `/`
- 题库统计（总题数、已练习、正确率）
- 快捷入口：顺序刷题、随机刷题、组卷练习
- 最近答题记录
- 底部导航栏

### 2. 刷题页 `/practice`
- 顶部：进度条 + 题号
- 中部：题干 + 选项/输入区
- 底部：上一题/下一题 + AI解析按钮
- 答题后显示对错反馈动画
- 主观题调用 AI 判分

### 3. 答题结果页 `/result`
- 统计：正确率、用时、各题型得分
- 题目列表：点击查看详情
- 每题可点击"AI解析"

### 4. 组卷页 `/exam`
- 配置：各题型数量、难度范围
- 生成试卷 → 进入答题模式

### 5. 题库管理 `/admin/questions`
- 题目列表（搜索、筛选、分页）
- 新增/编辑/删除题目
- 批量导入 DOCX

### 6. DOCX 导入 `/admin/import`
- 上传 DOCX 文件
- AI 解析预览（可编辑）
- 确认入库

## AI 集成

### 场景一：DOCX 内容提取
DOCX → mammoth.js 提取纯文本 → AI 解析 → 结构化题目 JSON

### 场景二：主观题判分
用户答案 + 标准答案 → AI 判分 → 分数 + 评语

### 场景三：AI 解析
题目 + 用户答案 → AI → 详细解析

### 配置管理
- 管理员在后台配置 AI 模型（DeepSeek/OpenAI/MiMo）
- 用户直接使用，无需选择模型
- API Key 仅存后端环境变量

## UI 设计规范

- 移动优先，适配 iPhone/iPad
- 圆角卡片 + 柔和阴影
- 主色调：蓝紫渐变
- 页面切换：左右滑动过渡
- 答题反馈：正确/错误动画
- 底部固定导航栏
- 选项按钮最小 44px 高度

## 补充功能

- 答题进度保存
- 错题本
- 收藏题目
- 刷题统计图表
- 暗色模式

## 异常处理

- AI 调用失败：友好提示 + 重试
- DOCX 解析失败：格式问题提示
- 网络异常：离线提示
- AI 并发：排队机制

## 安全措施

- 密码 bcrypt 加密
- API 路由 JWT 鉴权
- AI API Key 仅存后端
- 输入校验防 XSS
