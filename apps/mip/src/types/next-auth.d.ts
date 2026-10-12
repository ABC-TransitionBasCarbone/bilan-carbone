import { AccountMip as PrismaMipAccount, User as PrismaUser } from '@abc-transitionbascarbone/common/db'
import { DefaultUser } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: UserSession
  }

  interface UserSession
    extends
    Pick<PrismaMipAccount, 'id' | 'userId' | 'role' | 'organizationVersionMipId'>,
    Pick<PrismaUser, 'firstName' | 'lastName'> {
    email: PrismaUser['email']
    accountMipId: string
    organizationId: string | null
  }

  interface User extends DefaultUser {
    userId?: string
    accountMipId?: string
  }
}
