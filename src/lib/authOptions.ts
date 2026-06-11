import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { createUser, findUserByUsername, verifyPassword } from '@/lib/auth'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: '账号密码',
      credentials: {
        username: { label: '用户名', type: 'text' },
        password: { label: '密码', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error('请输入用户名和密码')
        }

        const username = credentials.username.trim()
        if (!username) {
          throw new Error('请输入用户名')
        }

        const user = await findUserByUsername(username)

        if (!user) {
          const newUser = await createUser(username, credentials.password)
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
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
}
