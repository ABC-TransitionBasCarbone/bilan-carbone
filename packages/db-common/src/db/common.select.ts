import { Prisma } from '@abc-transitionbascarbone/db-common'

export const findUserInfoSelect = (accountSelect?: Prisma.AccountSelect | Prisma.AccountMipSelect) => ({
  select: {
    user: {
      select: {
        email: true,
        firstName: true,
        lastName: true,
        level: true,
        updatedAt: true,
      },
    },
    status: true,
    role: true,
    updatedAt: true,
    ...(accountSelect || {}),
  }
})