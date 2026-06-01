import { PrismaClient } from '@abc-transitionbascarbone/db-common'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
  connectionString: process.env.POSTGRES_PRISMA_URL,
})

export const prismaClient = new PrismaClient({
  adapter,
  omit: {
    user: { password: true, resetToken: true },
  },
}) as PrismaClient
