'use server'

import { getUserByEmailWithSensibleInformations, updateUserPasswordForEmail } from '@/db/user'
import { withServerResponse } from '@/utils/serverResponse'
import { Environment } from '@abc-transitionbascarbone/db-common/enums'
import { computePasswordValidation } from '@abc-transitionbascarbone/utils/auth'
import jwt from 'jsonwebtoken'

export const checkToken = async (token: string) => {
  try {
    const tokenValues = jwt.verify(token, process.env.NEXTAUTH_SECRET as string) as {
      email: string
      resetToken: string
    }

    const user = await getUserByEmailWithSensibleInformations(tokenValues.email)
    return !user?.resetToken || user.resetToken !== tokenValues.resetToken
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
      if (user && user.resetToken && user.resetToken === tokenValues.resetToken) {
        const passwordValidation = computePasswordValidation(password)
        if (Object.values(passwordValidation).every((value) => value)) {
          await updateUserPasswordForEmail(user.email, password, env)
          return true
        }
      }
    }

    throw new Error('Email or token is invalid')
  })
