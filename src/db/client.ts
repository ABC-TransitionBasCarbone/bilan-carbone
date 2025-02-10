import { PrismaClient } from '@prisma/client'

// https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
const globalForPrisma = global as unknown as {
  prismaClient: PrismaClient | undefined
}

// https://www.prisma.io/docs/orm/prisma-client/queries/excluding-fields
const defaultPrismaClient = new PrismaClient({
  omit: {
    user: { password: true, resetToken: true },
  },
}) as PrismaClient

export const prismaClient = globalForPrisma.prismaClient ?? defaultPrismaClient

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prismaClient = prismaClient
}
