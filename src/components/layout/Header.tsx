'use client'

import { signOut, useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { LogOut, User } from 'lucide-react'

export function Header() {
  const { data: session } = useSession()

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 border-b border-gray-200 bg-white/85 backdrop-blur-md"
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
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
              aria-label="退出登录"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </motion.header>
  )
}
