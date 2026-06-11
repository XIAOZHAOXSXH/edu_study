'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { BarChart3, BookOpen, Cog, FileText, Home, Settings } from 'lucide-react'

const navItems = [
  { href: '/', icon: Home, label: '首页' },
  { href: '/practice', icon: BookOpen, label: '刷题' },
  { href: '/result', icon: BarChart3, label: '统计' },
  { href: '/exam', icon: FileText, label: '组卷' },
  { href: '/admin/questions', icon: Settings, label: '题库' },
  { href: '/admin/settings', icon: Cog, label: 'AI' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <motion.nav
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white"
    >
      <div className="grid grid-cols-6 px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-1 transition-colors"
            >
              <item.icon className={`h-5 w-5 ${isActive ? 'text-primary-600' : 'text-gray-500'}`} />
              <span className={`text-xs ${isActive ? 'font-medium text-primary-600' : 'text-gray-500'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </motion.nav>
  )
}
