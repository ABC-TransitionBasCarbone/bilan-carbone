'use server'

import { prismaClient } from '@/db/client.server'
import { getUserByEmailWithSensibleInformations } from '@/db/user'
import { AuthorizedInOrgaUserStatus } from '@/services/users'
import { withServerResponse } from '@/utils/serverResponse'
import { Environment, UserChecklist, UserStatus } from '@abc-transitionbascarbone/common/db/enums'
import { computePasswordValidation, signPassword } from '@abc-transitionbascarbone/common/utils/auth'
import { environmentsWithChecklist } from '@abc-transitionbascarbone/common/utils/environments'
import { hashResetToken } from '@abc-transitionbascarbone/common/utils/user.server'
import jwt from 'jsonwebtoken'

const updateUserPasswordForEmail = async (email: string, password: string, env: Environment) => {
  const signedPassword = await signPassword(password)
  const user = await prismaClient.user.update({
    where: { email },
    data: { resetToken: null, password: signedPassword },
  })

  if (!user) {
    throw new Error(`User with email ${email} not found`)
  }

  const account = await prismaClient.account.findFirst({
    where: { userId: user.id, environment: env, status: { in: AuthorizedInOrgaUserStatus } },
  })
  if (!account) {
    throw new Error(`Account with email ${email} for environment ${env} not found or has a wrong status`)
  }

  const accounts = await prismaClient.account.findMany({
    where: { userId: user.id, status: { in: AuthorizedInOrgaUserStatus } },
  })
  if (accounts.length > 0) {
    await Promise.all([
      ...accounts
        .filter((item) => environmentsWithChecklist.includes(item.environment))
        .map((item) =>
          prismaClient.userCheckedStep.upsert({
            where: { accountId_step: { accountId: item.id, step: UserChecklist.CreateAccount } },
            update: {},
            create: { accountId: item.id, step: UserChecklist.CreateAccount },
          }),
        ),
      prismaClient.account.update({
        where: { userId_environment: { userId: user.id, environment: env } },
        data: { activationRequestedAt: null, status: UserStatus.ACTIVE },
      }),
    ])
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

export const reset = async (password: string, token: string, userEnv: Environment | undefined) =>
  withServerResponse('reset', async () => {
    const env = userEnv || Environment.BC

    const tokenValues = jwt.verify(token, process.env.NEXTAUTH_SECRET as string) as {
      email: string
      resetToken: string
    }

    if (tokenValues) {
      const user = await getUserByEmailWithSensibleInformations(tokenValues.email)
      if (user && user.resetToken && user.resetToken === hashResetToken(tokenValues.resetToken)) {
        const passwordValidation = computePasswordValidation(password)
        if (Object.values(passwordValidation).every((value) => value)) {
          await updateUserPasswordForEmail(user.email, password, env)
          return true
        }
      }
    }

    throw new Error('Email or token is invalid')
  })
