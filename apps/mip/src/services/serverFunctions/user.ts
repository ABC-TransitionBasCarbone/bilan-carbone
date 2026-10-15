'use server'

import {
  addAccountMip,
  changeAccountMipRole,
  getAccountMipByEmailAndEnvironment,
  getAccountMipByEmailAndOrganizationVersionMipId,
  getAccountMipById,
  updateAccountMip,
} from '@/db/accountMip'
import { addOrganizationVersionMipIdToModelCampaign } from '@/db/campaign'
import { createOrganizationWithVersionMip, getOrgNameByOrgVersionMipId } from '@/db/organization'
import {
  addUser,
  deleteAccountMipFromOrgaVersionMip,
  getUserByEmail,
  UserWithAccountsMip,
  validateUser,
} from '@/db/user'
import { AccountMipWithUser } from '@/types/accountMip.types'
import { withServerResponse } from '@/utils/serverResponse'
import { isAdmin } from '@/utils/user'
import { userSessionToDbUser } from '@/utils/userAccounts'
import { User } from '@abc-transitionbascarbone/common/db'
import { updateUserResetTokenForEmail } from '@abc-transitionbascarbone/common/db/db'
import { Environment, Role, RoleMip, UserStatus } from '@abc-transitionbascarbone/common/db/enums'
import {
  sendAddedActiveUserEmail,
  sendNewUserEmail,
  sendResetPassword,
} from '@abc-transitionbascarbone/common/services/email/email'
import { EMAIL_SENT, MORE_THAN_ONE, NOT_AUTHORIZED } from '@abc-transitionbascarbone/common/services/permissions/check'
import { updateUserResetToken } from '@abc-transitionbascarbone/common/services/serverFunctions/user'
import { AddMemberCommand } from '@abc-transitionbascarbone/common/services/serverFunctions/user.command'
import { DAY, HOUR, TIME_IN_MS } from '@abc-transitionbascarbone/common/utils'
import { generateResetToken, hashResetToken } from '@abc-transitionbascarbone/common/utils/user.server'
import jwt from 'jsonwebtoken'
import { UserSession } from 'next-auth'
import { dbActualizedAuth } from '../auth'
import { canAddMember, canChangeRole, canDeleteMember } from '../permissions/user'
import { getAccountMipFromUserOrganization } from '../team'

export const resetPassword = async (email: string) =>
  withServerResponse('resetPassword', async () => {
    const user = await getUserByEmail(email)
    if (!user) {
      throw new Error(`No user found with email ${email}`)
    } else {
      if (user) {
        const resetToken = generateResetToken()
        const payload = {
          email,
          resetToken,
          exp: Math.round(Date.now() / TIME_IN_MS) + HOUR, // 1 hour expiration
        }
        const token = jwt.sign(payload, process.env.NEXTAUTH_SECRET as string)
        await updateUserResetTokenForEmail(email, hashResetToken(resetToken))
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

const handleAddingUser = async (creator: UserSession, newUser: AddMemberCommand) => {
  const memberExists = await getUserByEmail(newUser.email.toLowerCase())
  const isMemberActiveInSomeEnv = memberExists?.accountsMip.some((account) => account.status === UserStatus.ACTIVE)
  const memberAccountMip = memberExists?.accountsMip[0]

  if (memberAccountMip?.role === RoleMip.SUPER_ADMIN || newUser.role === RoleMip.SUPER_ADMIN) {
    console.error('handleAddingUser', creator.email, newUser.email)
    throw new Error(NOT_AUTHORIZED)
  }

  const userFromDb = await getUserByEmail(creator.email)
  if (!userFromDb || !creator.organizationVersionMipId) {
    console.error('handleAddingUser', creator.email, creator.organizationVersionMipId)
    throw new Error(NOT_AUTHORIZED)
  }

  if (!memberExists) {
    await addUser({
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email.toLowerCase(),
      level: null,
      source: userFromDb.source,
      accountsMip: {
        create: {
          role: newUser.role as RoleMip,
          status: UserStatus.VALIDATED,
          organizationVersionMip: { connect: { id: creator.organizationVersionMipId } },
        },
      },
    })
  } else if (!memberAccountMip) {
    await addAccountMip({
      status: isMemberActiveInSomeEnv ? UserStatus.ACTIVE : UserStatus.VALIDATED,
      role: newUser.role as Exclude<RoleMip, 'SUPER_ADMIN'>,
      user: { connect: { id: memberExists.id } },
      organizationVersionMip: { connect: { id: creator.organizationVersionMipId } },
    })
  } else {
    if (memberAccountMip.status === UserStatus.ACTIVE && memberAccountMip.organizationVersionMipId) {
      console.error('handleAddingUser', creator.email, memberAccountMip.id)
      throw new Error(NOT_AUTHORIZED)
    }

    await updateAccountMip(
      memberAccountMip.id,
      {
        status: isMemberActiveInSomeEnv ? UserStatus.ACTIVE : UserStatus.VALIDATED,
        role: memberAccountMip.role,
        organizationVersionMip: { connect: { id: creator.organizationVersionMipId } },
      },
      { firstName: newUser.firstName, lastName: newUser.lastName },
    )
  }

  await sendEmailToAddedUser(
    newUser.email.toLowerCase(),
    userSessionToDbUser(creator),
    newUser.firstName,
    creator.organizationVersionMipId,
  )
}

export const addMember = async (member: AddMemberCommand) =>
  withServerResponse('addMember', async () => {
    const session = await dbActualizedAuth()
    if (!session || !session.user || !session.user.organizationVersionMipId || member.role === Role.SUPER_ADMIN) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (
      !canAddMember(session.user, { ...member, role: member.role as RoleMip }, session.user.organizationVersionMipId)
    ) {
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

export const resendInvitation = async (email: string) =>
  withServerResponse('resendInvitation', async () => {
    const session = await dbActualizedAuth()
    if (!session || !session.user || !session.user.organizationVersionMipId) {
      throw new Error(NOT_AUTHORIZED)
    }

    const member = await getAccountMipByEmailAndOrganizationVersionMipId(email, session.user.organizationVersionMipId)
    if (!member || !canAddMember(session.user, member, member.organizationVersionMipId)) {
      throw new Error(NOT_AUTHORIZED)
    }

    await sendEmailToAddedUser(
      member.user.email,
      userSessionToDbUser(session.user),
      member.user.firstName,
      session.user.organizationVersionMipId,
    )
  })

export const deleteMember = async (email: string) =>
  withServerResponse('deleteMember', async () => {
    const session = await dbActualizedAuth()
    if (!session || !session.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    const accountMipToRemove = await getAccountMipByEmailAndOrganizationVersionMipId(
      email,
      session.user.organizationVersionMipId,
    )
    if (!canDeleteMember(session.user, accountMipToRemove as AccountMipWithUser)) {
      throw new Error(NOT_AUTHORIZED)
    }
    await deleteAccountMipFromOrgaVersionMip(email, session.user.organizationVersionMipId)
  })

const sendActivation = async (email: string, user: User, organizationVersionMipId: string) => {
  return sendEmailToAddedUser(email, user, '', organizationVersionMipId)
}

export const signUpWithModelCampaign = async (email: string, modelCampaignId: string) =>
  withServerResponse('signUpWithModelCampaign', async () => {
    const trimmedEmail = email.trim().toLowerCase()
    if (!modelCampaignId) {
      throw new Error(NOT_AUTHORIZED)
    }

    const accountMipAlreadyCreated = await getAccountMipByEmailAndEnvironment(trimmedEmail, Environment.MIP)
    if (accountMipAlreadyCreated && accountMipAlreadyCreated.organizationVersionMipId) {
      throw new Error(NOT_AUTHORIZED)
    }

    let user = await getUserByEmail(trimmedEmail)
    let accountMip = null

    if (!user) {
      user = (await addUser({
        email: trimmedEmail,
        firstName: '',
        lastName: '',
        accountsMip: {
          create: {
            status: UserStatus.PENDING_REQUEST,
            role: Role.ADMIN,
          },
        },
      })) as UserWithAccountsMip
      accountMip = user?.accountsMip[0]
    } else {
      accountMip =
        accountMipAlreadyCreated ||
        ((await addAccountMip({
          user: { connect: { id: user.id } },
          role: Role.ADMIN,
          status: UserStatus.PENDING_REQUEST,
        })) as AccountMipWithUser)
    }
    if (!user || !accountMip) {
      throw new Error(NOT_AUTHORIZED)
    }

    const organizationVersionMip = await createOrganizationWithVersionMip(
      { name: '' },
      { name: '', environment: Environment.MIP },
    )

    if (!organizationVersionMip) {
      throw new Error(NOT_AUTHORIZED)
    }

    await updateAccountMip(accountMip.id, {
      role: Role.ADMIN,
      organizationVersionMip: { connect: { id: organizationVersionMip.id } },
    })
    await addOrganizationVersionMipIdToModelCampaign(modelCampaignId, organizationVersionMip.id)

    await validateUser(accountMip.id)
    await sendActivation(trimmedEmail, user, organizationVersionMip.id)
    return EMAIL_SENT
  })
