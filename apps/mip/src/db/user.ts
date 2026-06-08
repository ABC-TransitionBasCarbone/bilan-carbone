import { UserStatus } from '@abc-transitionbascarbone/db-common/enums'
import { signPassword } from '@abc-transitionbascarbone/utils/auth'
import { prismaClient } from './client.server'

export const getUserByEmail = (email: string) =>
  prismaClient.user.findUnique({ where: { email }, include: { accountsMip: true } })

export const getUserByEmailWithSensibleInformations = (email: string) =>
  prismaClient.user.findUnique({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      level: true,
      password: true,
      resetToken: true,
      accountsMip: true,
    },
    where: { email },
  })

export const updateUserPasswordForEmail = async (email: string, password: string) => {
  const signedPassword = await signPassword(password)
  const user = await prismaClient.user.update({
    where: { email },
    data: { resetToken: null, password: signedPassword },
  })

  if (!user) {
    throw new Error(`User with email ${email} not found`)
  }

  const accountMip = await prismaClient.accountMip.findFirst({
    where: {
      userId: user.id,
    },
  })

  if (!accountMip) {
    throw new Error(`Account with email ${email} not found`)
  }

  const accountsMip = await prismaClient.accountMip.findMany({
    where: {
      userId: user.id,
    },
  })

  if (accountsMip.length > 0) {
    await prismaClient.accountMip.updateMany({
      where: { userId: user.id },
      data: { status: UserStatus.ACTIVE },
    })
  }

  return user
}

export const updateUserResetTokenForEmail = async (email: string, resetToken: string) =>
  prismaClient.user.update({
    where: { email: email.toLowerCase() },
    data: { resetToken },
  })
