import { OrganizationVersion, Account as PrismaAccount, User as PrismaUser } from '@abc-transitionbascarbone/db-common'
import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: UserSession
    sessionInvalid?: boolean
  }

  interface UserSession
    extends
      Pick<PrismaAccount, 'id' | 'userId' | 'role' | 'organizationVersionId'>,
      Pick<PrismaUser, 'firstName' | 'lastName' | 'level'>,
      Pick<OrganizationVersion, 'environment'> {
    email: PrismaUser['email']
    accountId: string
    organizationId: string | null
    environment: PrismaOrganizationVersion['environment']
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
