import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@repo/db-common'
import { getPrismaConnectionString } from './prismaConnectionString'
// Au lieu de : import 'server-only' pour pas casser la seed
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
  throw new Error('prismaClient cannot be used client-side')
}

// https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
const globalForPrisma = global as unknown as {
  prismaClient: PrismaClient | undefined
}

const connectionString = getPrismaConnectionString()
if (!connectionString) {
  throw new Error('Missing database connection string: set POSTGRES_PRISMA_URL or POSTGRES_PRISMA_POOL_URL')
}

const adapter = new PrismaPg({
  connectionString,
})

// https://www.prisma.io/docs/orm/prisma-client/queries/excluding-fields
const defaultPrismaClient = new PrismaClient({
  adapter,
  omit: {
    user: { password: true, resetToken: true },
  },
}) as PrismaClient

export const prismaClient = globalForPrisma.prismaClient ?? defaultPrismaClient

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prismaClient = prismaClient
}
