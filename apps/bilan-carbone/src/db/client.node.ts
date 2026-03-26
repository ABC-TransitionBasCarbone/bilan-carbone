import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@repo/db-common'

const adapter = new PrismaPg({
  connectionString: process.env.POSTGRES_PRISMA_URL,
})

export const prismaClient = new PrismaClient({
  adapter,
  omit: {
    user: { password: true, resetToken: true },
  },
}) as PrismaClient
