import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@repo/db-common'
import { getPrismaConnectionString } from './prismaConnectionString'

const adapter = new PrismaPg({
  connectionString: getPrismaConnectionString(),
})

export const prismaClient = new PrismaClient({
  adapter,
  omit: {
    user: { password: true, resetToken: true },
  },
}) as PrismaClient
