import { getOrganizationVersionById } from '@/db/organization'
import { getUserByEmail, getUserByEmailWithSensibleInformations } from '@/db/user'
import { Environment, Level, PrismaClient, Role, UserStatus } from '@prisma/client'
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
        const accounts = await prisma.account.findMany({
          where: { userId: user.id },
          select: {
            id: true,
            role: true,
            organizationVersionId: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                level: true,
                email: true,
              },
            },
            organizationVersion: {
              select: {
                organizationId: true,
                environment: true,
              },
            },
          },
        })

        const account = accounts?.[accounts.length - 1]

        if (account) {
          return {
            ...token,
            id: account.user.id,
            userId: account.user.id,
            accountId: account.id,
            firstName: account.user.firstName,
            lastName: account.user.lastName,
            organizationVersionId: account.organizationVersionId,
            organizationId: account?.organizationVersion?.organizationId,
            environment: account.organizationVersion?.environment,
            role: account.role,
            level: account.user.level,
          }
        }
      }

      if (trigger === 'update') {
        const dbUser = await getUserByEmail(token.email || '')

        // TODO GET THE RIGHT ACCOUNT
        const account = dbUser?.accounts[dbUser.accounts.length - 1] || {
          id: '',
          role: Role.DEFAULT,
          organizationVersionId: '',
        }

        return dbUser
          ? {
              ...token,
              id: dbUser.id,
              userId: dbUser.id,
              accountId: account.id,
              firstName: dbUser.firstName,
              lastName: dbUser.lastName,
              role: account.role,
              organizationVersionId: account.organizationVersionId,
              organizationId: '',
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
          userId: token.id as string,
          accountId: token.accountId as string,
          firstName: token.firstName as string,
          lastName: token.lastName as string,
          organizationVersionId: token.organizationVersionId as string,
          environment: token.environment as Environment,
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
        const account = user?.accounts[user.accounts.length - 1]

        if (!user || !user.password || user.status !== UserStatus.ACTIVE) {
          return null
        }

        const passwordMatch = await bcrypt.compare(credentials.password, user.password)
        if (!passwordMatch) {
          return null
        }

        let organizationVersion = null
        if (account?.organizationVersionId) {
          organizationVersion = await getOrganizationVersionById(account.organizationVersionId)
        }

        return {
          id: user.id,
          userId: user.id,
          accountId: account?.id,
          firstName: user.firstName,
          lastName: user.lastName,
          role: account?.role,
          email: user.email,
          organizationVersionId: account?.organizationVersionId,
          organizationId: organizationVersion?.organizationId,
          level: user.level,
          environment: organizationVersion?.environment,
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
