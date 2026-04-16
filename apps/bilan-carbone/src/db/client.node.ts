import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@repo/db-common'
import { getPrismaConnectionString } from './prismaConnectionString'

const connectionString = getPrismaConnectionString()
if (!connectionString && process.env.NODE_ENV !== 'test') {
  throw new Error('Missing database connection string: set POSTGRES_PRISMA_URL or POSTGRES_PRISMA_POOL_URL')
}

export const prismaClient = (connectionString
  ? new PrismaClient({
      adapter: new PrismaPg({
        connectionString,
      }),
      omit: {
        user: { password: true, resetToken: true },
      },
    })
  : new PrismaClient({
      omit: {
        user: { password: true, resetToken: true },
      },
    })) as PrismaClient
