import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@repo/db-common'
import { getPrismaConnectionString } from './prismaConnectionString'

const connectionString = getPrismaConnectionString()
if (!connectionString && process.env.NODE_ENV !== 'test') {
  throw new Error('Missing database connection string: set POSTGRES_PRISMA_URL or POSTGRES_PRISMA_POOL_URL')
}

const adapter = new PrismaPg({
  connectionString,
})

export const prismaClient = new PrismaClient({
  adapter,
  omit: {
    user: { password: true, resetToken: true },
  },
}) as PrismaClient
