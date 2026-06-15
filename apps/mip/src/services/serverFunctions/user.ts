'use server'

import {
  changeAccountMipRole,
  getAccountMipByEmailAndOrganizationVersionMipId,
  getAccountMipById,
} from '@/db/accountMip'
import { getUserByEmail } from '@/db/user'
import { AccountMipWithUser } from '@/types/accountMip.types'
import { withServerResponse } from '@/utils/serverResponse'
import { updateUserResetTokenForEmail } from '@abc-transitionbascarbone/db-common/db'
import { Role } from '@abc-transitionbascarbone/db-common/enums'
import { sendResetPassword } from '@abc-transitionbascarbone/services/email/email'
import { NOT_AUTHORIZED } from '@abc-transitionbascarbone/services/permissions/check'
import { HOUR, TIME_IN_MS } from '@abc-transitionbascarbone/utils'
import jwt from 'jsonwebtoken'
import { dbActualizedAuth } from '../auth'
import { canChangeRole } from '../permissions/user'

export const resetPassword = async (email: string) =>
  withServerResponse('resetPassword', async () => {
    const user = await getUserByEmail(email)
    if (!user) {
      throw new Error(`No user found with email ${email}`)
    } else {
      if (user) {
        const resetToken = Math.random().toString(36)
        const payload = {
          email,
          resetToken,
          exp: Math.round(Date.now() / TIME_IN_MS) + HOUR, // 1 hour expiration
        }
        const token = jwt.sign(payload, process.env.NEXTAUTH_SECRET as string)
        await updateUserResetTokenForEmail(email, resetToken)
        await sendResetPassword(email, token)
      }
    }
  })

export const changeRole = async (email: string, role: Role) =>
  withServerResponse('changeRole', async () => {
    const session = await dbActualizedAuth()
    if (!session || !session.user || !session.user.organizationVersionMipId) {
      throw new Error(NOT_AUTHORIZED)
    }
    const accountMipToChange = await getAccountMipByEmailAndOrganizationVersionMipId(
      email,
      session.user.organizationVersionMipId,
    )
    if (!accountMipToChange) {
      throw new Error(NOT_AUTHORIZED)
    }
    if (!canChangeRole(session.user, accountMipToChange as AccountMipWithUser, role)) {
      throw new Error(NOT_AUTHORIZED)
    }

    const targetAccountMip = await getAccountMipById(accountMipToChange.id)
    if (!targetAccountMip || targetAccountMip.organizationVersionMipId !== session.user.organizationVersionMipId) {
      throw new Error(NOT_AUTHORIZED)
    }
    await changeAccountMipRole(accountMipToChange.id, role)
  })
