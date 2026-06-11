import type { Metadata } from 'next'
import { BottomNav } from '@/components/layout/BottomNav'
import { Header } from '@/components/layout/Header'
import { Providers } from '@/components/Providers'
import './globals.css'

export const metadata: Metadata = {
  title: '教育刷题平台',
  description: '中学教师资格考试刷题系统',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gray-50">
        <Providers>
          <Header />
          <main className="pb-24">{children}</main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  )
}
