'use server'

import {
  changeAccountMipRole,
  getAccountMipByEmailAndOrganizationVersionMipId,
  getAccountMipById,
  getAccountMipFromUserOrganization,
} from '@/db/accountMip'
import { getOrgNameByOrgVersionMipId } from '@/db/organization'
import { getUserByEmail, handleAddingUser } from '@/db/user'
import { AccountMipWithUser } from '@/types/accountMip.types'
import { withServerResponse } from '@/utils/serverResponse'
import { isAdmin } from '@/utils/user'
import { updateUserResetTokenForEmail } from '@abc-transitionbascarbone/db-common/db'
import { MORE_THAN_ONE, NOT_AUTHORIZED } from '@abc-transitionbascarbone/services/permissions/check'
import { User } from '@abc-transitionbascarbone/db-common'
import { Environment, RoleMip, Role, UserStatus } from '@abc-transitionbascarbone/db-common/enums'
import {
  sendAddedActiveUserEmail,
  sendNewUserEmail,
  sendResetPassword,
} from '@abc-transitionbascarbone/services/email/email'
import { updateUserResetToken } from '@abc-transitionbascarbone/services/serverFunctions/user'
import { AddMemberCommand } from '@abc-transitionbascarbone/services/serverFunctions/user.command'
import { DAY, HOUR, TIME_IN_MS } from '@abc-transitionbascarbone/utils'
import jwt from 'jsonwebtoken'
import { dbActualizedAuth } from '../auth'
import { canAddMember, canChangeRole } from '../permissions/user'

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

export const changeRole = async (email: string, role: RoleMip | Role) =>
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
    if (!canChangeRole(session.user, accountMipToChange as AccountMipWithUser, role as RoleMip)) {
      throw new Error(NOT_AUTHORIZED)
    }

    const team = await getAccountMipFromUserOrganization(session.user)
    const adminCount = team.filter((member) => isAdmin(member.role)).length
    if (isAdmin(accountMipToChange.role) && adminCount === 1) {
      return MORE_THAN_ONE
    }

    const targetAccountMip = await getAccountMipById(accountMipToChange.id)
    if (!targetAccountMip || targetAccountMip.organizationVersionMipId !== session.user.organizationVersionMipId) {
      throw new Error(NOT_AUTHORIZED)
    }
    await changeAccountMipRole(accountMipToChange.id, role as RoleMip)
  })

export const addMember = async (member: AddMemberCommand) =>
  withServerResponse('addMember', async () => {
    const session = await dbActualizedAuth()
    if (!session || !session.user || !session.user.organizationVersionMipId || member.role === Role.SUPER_ADMIN) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (member.role === Role.GESTIONNAIRE) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (!canAddMember(session.user, { ...member, role: member.role as RoleMip }, session.user.organizationVersionMipId)) {
      throw new Error(NOT_AUTHORIZED)
    }

    await handleAddingUser(session.user, member)
  })

export const sendEmailToAddedUser = async (email: string, user: User, newUserName: string, orgaVersionMipId: string) =>
  withServerResponse('sendEmailToAddedUser', async () => {
    const addedMember = await getUserByEmail(email)
    const activeAccountMips = addedMember?.accountsMip.filter((accountMip) => accountMip.status === UserStatus.ACTIVE)
    const name = await getOrgNameByOrgVersionMipId(orgaVersionMipId)

    if (activeAccountMips?.length && activeAccountMips.length > 0) {
      return sendAddedActiveUserEmail(
        email,
        `${user.firstName} ${user.lastName}`,
        newUserName,
        Environment.MIP,
        activeAccountMips.map((accountMip) => accountMip.environment),
        name || '',
      )
    }

    const token = await updateUserResetToken(email, 1 * DAY)
    return sendNewUserEmail(email, token, `${user.firstName} ${user.lastName}`, newUserName, Environment.MIP)
  })
