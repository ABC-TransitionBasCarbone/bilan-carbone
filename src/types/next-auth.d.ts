import { User as PrismaUser } from '@prisma/client'
import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: User
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface User extends Pick<PrismaUser, 'firstName' | 'lastName' | 'email' | 'id' | 'role' | 'organizationId'> {}
}
