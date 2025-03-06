import { Prisma } from '@prisma/client'

export const uploadStudies = async (
  transaction: Prisma.TransactionClient,
  data: (string | number)[][],
  indexes: Record<string, number>,
) => {
  return false
}