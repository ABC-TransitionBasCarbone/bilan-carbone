import { getAccountMipById } from '@/db/accountMip'
import { getUserByEmailWithSensibleInformations } from '@/db/user'
import { AccountMipWithUser } from '@/types/accountMip.types'
import { RoleMip, UserStatus } from '@abc-transitionbascarbone/db-common/enums'
import { DAY } from '@abc-transitionbascarbone/utils'
import bcrypt from 'bcryptjs'
import { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from 'next'
import { getServerSession, NextAuthOptions, Session } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

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
        const accountMipId = user.accountMipId
        const accountMip = accountMipId ? ((await getAccountMipById(accountMipId)) as AccountMipWithUser) : null

        if (accountMip) {
          return {
            ...token,
            id: accountMip.user.id,
            userId: accountMip.user.id,
            accountMipId: accountMip.id,
            firstName: accountMip.user.firstName,
            lastName: accountMip.user.lastName,
            organizationVersionMipId: accountMip.organizationVersionMipId,
            organizationId: accountMip?.organizationVersionMip?.organizationId,
            role: accountMip.role,
          }
        }
      }

      if (trigger === 'update') {
        const dbAccountMip = (await getAccountMipById(token.accountMipId as string)) as AccountMipWithUser

        return dbAccountMip
          ? {
              ...token,
              id: dbAccountMip.user.id,
              userId: dbAccountMip.user.id,
              accountMipId: dbAccountMip.id,
              firstName: dbAccountMip.user.firstName,
              lastName: dbAccountMip.user.lastName,
              role: dbAccountMip?.role,
              organizationVersionMipId: dbAccountMip?.organizationVersionMipId,
              organizationId: '',
            }
          : token
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user = {
          ...session.user,
          id: token.id as string,
          userId: token.userId as string,
          accountMipId: token.accountMipId as string,
          firstName: token.firstName as string,
          lastName: token.lastName as string,
          role: token.role as RoleMip,
          organizationVersionMipId: token.organizationVersionMipId as string,
          organizationId: token.organizationId as string,
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
        if (!user || !user.password) {
          return null
        }

        const passwordMatch = await bcrypt.compare(credentials.password, user.password)
        if (!passwordMatch) {
          return null
        }

        const accounstMip = user.accountsMip.filter((a) => a.status === UserStatus.ACTIVE)
        if (accounstMip.length === 0) {
          return null
        }

        const accountMip = (await getAccountMipById(accounstMip[0].id)) as AccountMipWithUser

        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          accountMipId: accountMip.id,
          organizationVersionMipId: accountMip.organizationVersionMipId,
          organizationId: accountMip.organizationVersionMip.organizationId,
          role: accountMip.role,
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

export async function dbActualizedAuth(
  ...args: [GetServerSidePropsContext['req'], GetServerSidePropsContext['res']] | [NextApiRequest, NextApiResponse] | []
): Promise<Session | null> {
  const session = await getServerSession(...args, authOptions)
  if (!session || !session.user) {
    return null
  }
  const accountMip = await getAccountMipById(session.user.accountMipId)
  if (!accountMip) {
    return null
  }
  return {
    ...session,
    user: {
      ...session.user,
      role: accountMip.role,
      organizationVersionMipId: accountMip.organizationVersionMipId,
    },
  }
}
