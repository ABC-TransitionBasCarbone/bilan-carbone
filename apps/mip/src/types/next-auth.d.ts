import { MipAccount as PrismaMipAccount, User as PrismaUser } from '@abc-transitionbascarbone/db-common'
import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: UserSession
  }

  interface UserSession
    extends
      Pick<PrismaMipAccount, 'id' | 'userId' | 'role' | 'organizationVersionId'>,
      Pick<PrismaUser, 'firstName' | 'lastName' | 'level'> {
    email: PrismaUser['email']
    accountId: string
    organizationId: string | null
  }

  interface User extends DefaultUser {
    userId?: string
    accountId?: string
  }
}
