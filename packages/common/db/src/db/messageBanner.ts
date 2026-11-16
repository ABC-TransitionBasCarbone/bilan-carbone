import { Environment } from '../enums'
import type { Prisma } from '../generated/prisma/client'

export const getActiveMessageBannerWhere = (
  environment: Environment,
  now: Date = new Date(),
): Prisma.MessageBannerWhereInput => ({
  active: true,
  environments: { has: environment },
  startAt: { lte: now },
  endAt: { gte: now },
})
