import { getUserByEmail } from '@/db/userImport'
import { getUserByEmailWithSensibleInformations } from '@/db/user'
import { Level, PrismaClient, Role, UserStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from 'next'
import { getServerSession, NextAuthOptions } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { DAY } from '../utils/time'

const prisma = new PrismaClient()

export const signPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hashSync(password, salt)
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: DAY * 7,
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      return url || baseUrl
    },
    async jwt({ token, trigger, user }) {
      if (user) {
        // TODO GET THE RIGHT ACCOUNT
        const account = await prisma.account.findFirst({
          where: { userId: user.id },
          select: {
            id: true,
            role: true,
            organizationId: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                level: true,
                email: true,
              },
            },
          },
        })

        if (account) {
          return {
            ...token,
            id: account.user.id,
            accountId: account.id,
            firstName: account.user.firstName,
            lastName: account.user.lastName,
            organizationId: account.organizationId,
            role: account.role,
            level: account.user.level,
          }
        }
      }

      if (trigger === 'update') {
        const dbUser = await getUserByEmail(token.email || '')

        // TODO GET THE RIGHT ACCOUNT
        const account = dbUser?.accounts[0] || { id: '', role: Role.DEFAULT, organizationId: '' }

        return dbUser
          ? {
              ...token,
              id: dbUser.id,
              accountId: account.id,
              firstName: dbUser.firstName,
              lastName: dbUser.lastName,
              role: account.role,
              organizationId: account.organizationId,
              level: dbUser.level,
            }
          : token
      }

      return token
    },
    async session({ session, token }) {
      // TODO GET THE RIGHT ACCOUNT
      if (session.user) {
        session.user = {
          ...session.user,
          id: token.id as string,
          accountId: token.accountId as string,
          firstName: token.firstName as string,
          lastName: token.lastName as string,
          organizationId: token.organizationId as string,
          role: token.role as Role,
          level: token.level as Level,
        }
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'email', type: 'text' },
        password: { label: 'password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials) {
          return null
        }

        const user = await getUserByEmailWithSensibleInformations(credentials.email)
        // TODO GET THE RIGHT ACCOUNT
        const account = user?.accounts[0]
        if (!user || !user.password || user.status !== UserStatus.ACTIVE) {
          return null
        }

        const passwordMatch = await bcrypt.compare(credentials.password, user.password)
        if (!passwordMatch) {
          return null
        }

        return {
          id: user.id,
          accountId: account?.id,
          firstName: user.firstName,
          lastName: user.lastName,
          role: account?.role,
          email: user.email,
          organizationId: account?.organizationId,
          level: user.level,
        }
      },
    }),
  ],
}

export function auth(
  ...args: [GetServerSidePropsContext['req'], GetServerSidePropsContext['res']] | [NextApiRequest, NextApiResponse] | []
) {
  return getServerSession(...args, authOptions)
}
