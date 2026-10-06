import { Prisma } from '@abc-transitionbascarbone/common/db'

const baseUserInfoSelect = {
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
} satisfies Prisma.AccountSelect & Prisma.AccountMipSelect

export const findAccountSelect = (extra?: Prisma.AccountSelect): Prisma.AccountSelect => ({
  ...baseUserInfoSelect,
  ...(extra || {}),
})

export const findAccountMipSelect = (extra?: Prisma.AccountMipSelect): Prisma.AccountMipSelect => ({
  ...baseUserInfoSelect,
  ...(extra || {}),
})
