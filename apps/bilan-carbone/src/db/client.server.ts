import 'server-only'
import { PrismaClient } from '@repo/db-common'
import { PrismaPg } from '@prisma/adapter-pg'

// https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
const globalForPrisma = global as unknown as {
  prismaClient: PrismaClient | undefined
}

const adapter = new PrismaPg({
  connectionString: process.env.POSTGRES_PRISMA_URL,
  ssl: { rejectUnauthorized: false },
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