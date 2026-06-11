# 教育刷题平台

面向 iPhone、iPad 和 H5 的教师资格考试刷题系统。

## 功能

- 顺序刷题、随机刷题、错题练习、收藏练习
- 按题型数量自动组卷
- 题库新增、编辑、删除、搜索、分页
- DOCX AI 导入题库
- CSV 模板下载、上传解析、预览确认后批量入库
- 主观题 AI 判分
- AI 解析，支持 Markdown 渲染
- DeepSeek、OpenAI、小米 MiMo/OpenAI 兼容接口配置

## 技术栈

- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- Prisma + PostgreSQL
- NextAuth
- Vercel AI SDK
- Mammoth DOCX 解析

## 本地运行

先复制环境变量：

```bash
cp .env.example .env.local
```

将 `.env.local` 里的 `DATABASE_URL` 改成 Neon、Supabase 或其他 PostgreSQL 连接串，然后执行：

```bash
npm install
npm run db:generate
npm run db:deploy
npm run dev
```

访问 http://localhost:3000 ，首次使用任意用户名和密码会自动注册。

## 部署到 Vercel

推荐使用 Neon Postgres。

1. 在 Vercel 创建项目并连接 GitHub 仓库。
2. 在 Vercel Marketplace 添加 Neon 数据库。
3. 在 Vercel 项目环境变量中配置：

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"
NEXTAUTH_URL="https://your-project.vercel.app"

# 三选一即可
DEEPSEEK_API_KEY="..."
# OPENAI_API_KEY="..."
# MIMO_API_KEY="..."
```

4. 首次部署前或部署后，对空库执行一次：

```bash
npm run db:deploy
```

如果在本地执行，需要让本地 `.env.local` 的 `DATABASE_URL` 指向生产 Neon 数据库。

5. 部署完成后打开网站，登录后台，通过“模板导入”上传 CSV 题库。

## 验证

```bash
npm run lint
npm run build
npx prisma validate
```
