import { BCEnvironment } from '@/types/environment'
import { Account as PrismaAccount, User as PrismaUser } from '@abc-transitionbascarbone/common/db'
import { DefaultUser } from 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface DefaultSession {
    sessionInvalid?: boolean
  }

  interface Session {
    user: UserSession
    sessionInvalid?: boolean
  }

  interface UserSession
    extends
    Pick<PrismaAccount, 'id' | 'userId' | 'role' | 'organizationVersionId'>,
    Pick<PrismaUser, 'firstName' | 'lastName' | 'level'> {
    email: PrismaUser['email']
    accountId: string
    organizationId: string | null
    environment: BCEnvironment
    needsAccountSelection?: boolean
  }

  interface User extends DefaultUser {
    userId?: string
    accountId?: string
    needsAccountSelection?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    sessionInvalid?: boolean
  }
}
