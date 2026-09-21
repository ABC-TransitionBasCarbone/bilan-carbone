import { getAccountById, getAccountsFromUser } from '@/db/account'
import { getUserByEmailWithSensibleInformations } from '@/db/user'
import { AccountWithUser } from '@/types/account.types'
import { Environment, Level, Role, UserStatus } from '@abc-transitionbascarbone/db-common/enums'
import { DAY } from '@abc-transitionbascarbone/utils'
import bcrypt from 'bcryptjs'
import { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from 'next'
import { getServerSession, NextAuthOptions, Session } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

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
        const account = accountId ? await getAccountById(accountId) : null

        if (account && account.status === UserStatus.ACTIVE) {
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
        } else {
          return { sessionInvalid: true }
        }
      }

      if (trigger === 'update') {
        const dbAccount = await getAccountById(token.accountId as string)
        if (dbAccount && dbAccount.status === UserStatus.ACTIVE && token.id === dbAccount.user.id) {
          return {
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
          if (!account || account.status !== UserStatus.ACTIVE) {
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
  if (!account || account.status !== UserStatus.ACTIVE) {
    return null
  }
  return {
    ...session,
    user: {
      ...session.user,
      role: account.role,
      organizationVersionId: account.organizationVersionId,
      level: account.user.level,
    },
  }
}
