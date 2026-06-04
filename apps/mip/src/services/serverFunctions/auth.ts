'use server'

import { getUserByEmailWithSensibleInformations, updateUserPasswordForEmail } from '@/db/user'
import { withServerResponse } from '@/utils/serverResponse'
import { computePasswordValidation } from '@abc-transitionbascarbone/utils/auth'
import jwt from 'jsonwebtoken'

export const checkToken = async (token: string) => {
  try {
    const tokenValues = jwt.verify(token, process.env.NEXTAUTH_SECRET as string) as {
      email: string
      resetToken: string
    }

    const user = await getUserByEmailWithSensibleInformations(tokenValues.email)
    return !user?.resetToken
  } catch (error) {
    // The token has expired
    if (error instanceof jwt.TokenExpiredError) {
      return true
    }
    // Other errors (invalid token, etc.)
    return true
  }
}

export const reset = async (email: string, password: string, token: string) =>
  withServerResponse('reset', async () => {
    const tokenValues = jwt.verify(token, process.env.NEXTAUTH_SECRET as string) as {
      email: string
      resetToken: string
    }

    if (tokenValues && tokenValues.email === email) {
      const user = await getUserByEmailWithSensibleInformations(email)
      if (user && user.resetToken && user.resetToken === tokenValues.resetToken) {
        const passwordValidation = computePasswordValidation(password)
        if (Object.values(passwordValidation).every((value) => value)) {
          await updateUserPasswordForEmail(email, password)
          return true
        }
      }
    }

    throw new Error('Email or token is invalid')
  })
