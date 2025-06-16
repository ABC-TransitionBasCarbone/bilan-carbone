'use server'

import { getUserByEmailWithSensibleInformations, updateUserPasswordForEmail } from '@/db/user'
import { Environment } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { computePasswordValidation } from '../utils'

export const checkToken = async (token: string) => {
  try {
    const tokenValues = jwt.verify(token, process.env.NEXTAUTH_SECRET as string) as {
      email: string
      resetToken: string
    }

    const user = await getUserByEmailWithSensibleInformations(tokenValues.email)
    return !user?.resetToken
  } catch (error) {
    // Le token est expiré
    if (error instanceof jwt.TokenExpiredError) {
      return true
    }
    // Autres erreurs (token invalide, etc.)
    return true
  }
}

export const reset = async (email: string, password: string, token: string, userEnv: Environment | undefined) => {
  const env = userEnv || Environment.BC

  const tokenValues = jwt.verify(token, process.env.NEXTAUTH_SECRET as string) as {
    email: string
    resetToken: string
  }

  if (tokenValues && tokenValues.email === email) {
    const user = await getUserByEmailWithSensibleInformations(email)
    if (user && user.resetToken && user.resetToken === tokenValues.resetToken) {
      const passwordValidation = computePasswordValidation(password)
      if (Object.values(passwordValidation).every((value) => value)) {
        await updateUserPasswordForEmail(email, password, env)
        return true
      }
    }
  }
  return false
}
