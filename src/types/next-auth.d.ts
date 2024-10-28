import { User as PrismaUser } from '@prisma/client'
import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: User
  }

  interface User extends Pick<PrismaUser, 'firstName' | 'lastName' | 'id' | 'role' | 'organizationId' | 'level'> {
    // I don't get why email can be null if put on the list...
    email: PrismaUser['email']
  }
}
