'use server'

import {
  activateStudyInvitationAccount,
  getUserByEmailWithSensibleInformations,
  updateUserPasswordForEmail,
} from '@/db/user'
import { withServerResponse } from '@/utils/serverResponse'
import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import { NOT_AUTHORIZED } from '@abc-transitionbascarbone/common/services/permissions/check'
import { computePasswordValidation } from '@abc-transitionbascarbone/common/utils/auth'
import { hashResetToken } from '@abc-transitionbascarbone/common/utils/userTokens'
import jwt from 'jsonwebtoken'

const STUDY_INVITATION_ACTIVATION_PURPOSE = 'study-invitation-activation'

const getStudyInvitationActivationPayload = (token: string) => {
  try {
    const payload = jwt.verify(token, process.env.NEXTAUTH_SECRET as string)
    if (typeof payload === 'string' || payload.purpose !== STUDY_INVITATION_ACTIVATION_PURPOSE) {
      return null
    }

    const { email, resetToken, accountId, environment } = payload
    if (
      typeof email !== 'string' ||
      typeof resetToken !== 'string' ||
      typeof accountId !== 'string' ||
      typeof environment !== 'string' ||
      !Object.values(Environment).includes(environment as Environment)
    ) {
      return null
    }

    return { email, resetToken, accountId, environment: environment as Environment }
  } catch {
    return null
  }
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

export const checkStudyInvitationActivationToken = async (token: string) =>
  getStudyInvitationActivationPayload(token) !== null

export const activateStudyInvitation = async (token: string) =>
  withServerResponse('activateStudyInvitation', async () => {
    const payload = getStudyInvitationActivationPayload(token)
    if (!payload) {
      console.error('activateStudyInvitation: invalid or expired activation token')
      throw new Error(NOT_AUTHORIZED)
    }

    await activateStudyInvitationAccount(
      payload.email,
      payload.accountId,
      payload.environment,
      hashResetToken(payload.resetToken),
    )
  })

export const reset = async (password: string, token: string, userEnv: Environment | undefined) =>
  withServerResponse('reset', async () => {
    const env = userEnv || Environment.BC

    const tokenValues = jwt.verify(token, process.env.NEXTAUTH_SECRET as string) as {
      email: string
      resetToken: string
      purpose?: string
    }

    if (tokenValues && tokenValues.purpose !== STUDY_INVITATION_ACTIVATION_PURPOSE) {
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
