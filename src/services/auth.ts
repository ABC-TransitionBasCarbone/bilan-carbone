import { AccountWithUser, getAccountById } from '@/db/account'
import { getUserByEmailWithSensibleInformations } from '@/db/user'
import { Environment, Level, Role, UserStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from 'next'
import { getServerSession, NextAuthOptions, Session } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { signIn } from 'next-auth/react'
import { DAY } from '../utils/time'

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
        if (user.needsAccountSelection) {
          token.id = user.userId
          token.needsAccountSelection = true
          return token
        }

        const accountId = user.accountId
        const account = accountId ? ((await getAccountById(accountId)) as AccountWithUser) : null

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
            role: account.role,
            level: account.user.level,
            environment: account.environment,
            needsAccountSelection: false,
          }
        }
      }

      if (trigger === 'update') {
        const dbAccount = (await getAccountById(token.accountId as string)) as AccountWithUser

        return dbAccount
          ? {
              ...token,
              id: dbAccount.user.id,
              userId: dbAccount.user.id,
              accountId: dbAccount.id,
              firstName: dbAccount.user.firstName,
              lastName: dbAccount.user.lastName,
              role: dbAccount?.role,
              organizationVersionId: dbAccount?.organizationVersionId,
              organizationId: '',
              level: dbAccount.user.level,
              environment: dbAccount?.organizationVersion?.environment,
              needsAccountSelection: false,
            }
          : token
      }

      return token
    },
    async session({ session, token }) {
      if (token.needsAccountSelection) {
        session.user = { ...session.user, userId: token.id as string, needsAccountSelection: true }
        return session
      }

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
          needsAccountSelection: false,
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
        accountId: { label: 'accountId', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials) {
          return null
        }

        const buildSession = (account: AccountWithUser) => {
          if (!account) {
            return null
          }
          return {
            id: account.user.id,
            userId: account.user.id,
            accountId: account.id,
            firstName: account.user.firstName,
            lastName: account.user.lastName,
            role: account.role,
            email: account.user.email,
            organizationVersionId: account.organizationVersionId,
            organizationId: account.organizationVersion?.organizationId,
            level: account.user.level,
            environment: account.environment,
            needsAccountSelection: false,
          }
        }

        if (credentials.accountId) {
          const account = (await getAccountById(credentials.accountId)) as AccountWithUser
          return buildSession(account)
        }

        const user = await getUserByEmailWithSensibleInformations(credentials.email)
        if (!user || !user.password || user.status !== UserStatus.ACTIVE) {
          return null
        }

        const passwordMatch = await bcrypt.compare(credentials.password, user.password)
        if (!passwordMatch) {
          return null
        }

        const accounts = user.accounts

        if (accounts.length > 1) {
          return {
            id: user.id,
            userId: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            level: user.level,
            needsAccountSelection: true,
          }
        }

        const account = (await getAccountById(accounts[0].id)) as AccountWithUser
        return buildSession(account)
      },
    }),
  ],
}

export function auth(
  ...args: [GetServerSidePropsContext['req'], GetServerSidePropsContext['res']] | [NextApiRequest, NextApiResponse] | []
) {
  return getServerSession(...args, authOptions)
}

export async function dbActualizedAuth(
  ...args: [GetServerSidePropsContext['req'], GetServerSidePropsContext['res']] | [NextApiRequest, NextApiResponse] | []
): Promise<Session | null> {
  const session = await getServerSession(...args, authOptions)
  if (!session || !session.user) {
    return null
  }
  const account = await getAccountById(session.user.accountId)
  if (!account) {
    return null
  }
  return {
    ...session,
    user: {
      ...session.user,
      role: account.role,
      organizationVersionId: account.organizationVersionId,
    },
  }
}

export async function accountHandler(accountId: string) {
  return await signIn('credentials', {
    redirect: false,
    accountId,
  })
}
