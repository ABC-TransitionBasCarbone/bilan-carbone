'use server'

import { prismaClient } from '@/db/client.server'
import { getUserByEmailWithSensibleInformations } from '@/db/user'
import { withServerResponse } from '@/utils/serverResponse'
import { UserStatus } from '@abc-transitionbascarbone/common/db/enums'
import { computePasswordValidation, signPassword } from '@abc-transitionbascarbone/common/utils/auth'
import { hashResetToken } from '@abc-transitionbascarbone/common/utils/user.server'
import jwt from 'jsonwebtoken'

const updateUserPasswordForEmail = async (email: string, password: string) => {
  const signedPassword = await signPassword(password)
  const user = await prismaClient.user.update({
    where: { email },
    data: { resetToken: null, password: signedPassword },
  })

  if (!user) {
    throw new Error(`User with email ${email} not found`)
  }

  const accountMip = await prismaClient.accountMip.findFirst({ where: { userId: user.id } })
  if (!accountMip) {
    throw new Error(`Account with email ${email} not found`)
  }

  const accountsMip = await prismaClient.accountMip.findMany({ where: { userId: user.id } })
  if (accountsMip.length > 0) {
    await prismaClient.accountMip.updateMany({ where: { userId: user.id }, data: { status: UserStatus.ACTIVE } })
  }
  return user
}

export const checkToken = async (token: string) => {
  try {
    const tokenValues = jwt.verify(token, process.env.NEXTAUTH_SECRET as string) as {
      email: string
      resetToken: string
    }

    const user = await getUserByEmailWithSensibleInformations(tokenValues.email)
    return !user?.resetToken || user.resetToken !== hashResetToken(tokenValues.resetToken)
  } catch (error) {
    // The token has expired
    if (error instanceof jwt.TokenExpiredError) {
      return true
    }
    // Other errors (invalid token, etc.)
    return true
  }
}

export const reset = async (password: string, token: string) =>
  withServerResponse('reset', async () => {
    const tokenValues = jwt.verify(token, process.env.NEXTAUTH_SECRET as string) as {
      email: string
      resetToken: string
    }

    if (tokenValues) {
      const user = await getUserByEmailWithSensibleInformations(tokenValues.email)
      if (user && user.resetToken && user.resetToken === hashResetToken(tokenValues.resetToken)) {
        const passwordValidation = computePasswordValidation(password)
        if (Object.values(passwordValidation).every((value) => value)) {
          await updateUserPasswordForEmail(user.email, password)
          return true
        }
      }
    }

    throw new Error('Email or token is invalid')
  })
