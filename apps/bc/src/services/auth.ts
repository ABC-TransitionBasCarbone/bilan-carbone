import 'server-only'

import { getAccountById, getAccountsFromUser } from '@/db/account'
import { getUserByEmailWithSensibleInformations } from '@/db/user'
import { isBCEnvironment } from '@/services/permissions/environment'
import { AccountWithUser } from '@/types/account.types'
import { accountWithUserToUserSession } from '@/utils/userAccounts'
import { Level, Role, UserStatus } from '@abc-transitionbascarbone/common/db/enums'
import { DAY } from '@abc-transitionbascarbone/common/utils'
import bcrypt from 'bcryptjs'
import { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from 'next'
import { getServerSession, NextAuthOptions, Session } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

const buildSession = (account: AccountWithUser) => {
  if (
    account.status !== UserStatus.ACTIVE ||
    !isBCEnvironment(account.environment) ||
    (account.organizationVersion && !isBCEnvironment(account.organizationVersion.environment))
  ) {
    return null
  }

  return {
    ...accountWithUserToUserSession(account),
    environment: account.environment,
    needsAccountSelection: false,
  }
}

const switchAccount = async (accountId: string) => {
  const session = await auth()

  if (!session) {
    throw new Error('User is not authenticated')
  }

  const accounts = await getAccountsFromUser(session.user)
  const allUserAccounts = accounts.filter((account) => account.status === UserStatus.ACTIVE)
  if (!allUserAccounts || allUserAccounts.length === 0) {
    throw new Error('No active accounts found for the user')
  }

  const newAccount = allUserAccounts.find((account) => account.id === accountId)

  if (!newAccount) {
    throw new Error(`Account with ID ${accountId} not found`)
  }

  return getAccountById(newAccount.id)
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: DAY,
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
        const account = accountId ? await getAccountById(accountId) : null
        const accountSession = account ? buildSession(account) : null

        if (accountSession) {
          return {
            ...token,
            ...accountSession,
          }
        } else {
          return { sessionInvalid: true }
        }
      }

      if (trigger === 'update') {
        const dbAccount = await getAccountById(token.accountId as string)
        const accountSession = dbAccount ? buildSession(dbAccount) : null
        if (accountSession && token.id === accountSession.userId) {
          return {
            ...token,
            ...accountSession,
          }
        } else {
          return { sessionInvalid: true }
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token.sessionInvalid) {
        return { sessionInvalid: true, expires: '' }
      }

      if (token.needsAccountSelection) {
        session.user = { ...session.user, userId: token.id as string, needsAccountSelection: true }
        return session
      }

      if (!isBCEnvironment(token.environment)) {
        return { sessionInvalid: true, expires: '' }
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
          environment: token.environment,
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

        if (credentials.accountId) {
          const updatedAccount = await switchAccount(credentials.accountId)

          if (!updatedAccount) {
            return null
          }

          return buildSession(updatedAccount)
        }

        const user = await getUserByEmailWithSensibleInformations(credentials.email)

        if (!user || !user.password || user.accounts.every((a) => a.status !== UserStatus.ACTIVE)) {
          return null
        }

        const passwordMatch = await bcrypt.compare(credentials.password, user.password)
        if (!passwordMatch) {
          return null
        }

        const accounts = user.accounts.filter((a) => a.status === UserStatus.ACTIVE)

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

        // L'utilisateur n'a qu'un seul compte donc on peut prendre le premier
        const account = await getAccountById(accounts[0].id)

        if (!account) {
          return null
        }
        return buildSession(account)
      },
    }),
  ],
}

export async function auth(
  ...args: [GetServerSidePropsContext['req'], GetServerSidePropsContext['res']] | [NextApiRequest, NextApiResponse] | []
) {
  const session = await getServerSession(...args, authOptions)

  return session?.sessionInvalid ? null : session
}

export async function dbActualizedAuth(
  ...args: [GetServerSidePropsContext['req'], GetServerSidePropsContext['res']] | [NextApiRequest, NextApiResponse] | []
): Promise<Session | null> {
  const session = await getServerSession(...args, authOptions)
  if (!session || !session.user || session.sessionInvalid || session.user.needsAccountSelection) {
    return null
  }
  const account = await getAccountById(session.user.accountId)
  const accountSession = account ? buildSession(account) : null
  if (!accountSession) {
    return null
  }
  return {
    ...session,
    user: {
      ...session.user,
      ...accountSession,
    },
  }
}
