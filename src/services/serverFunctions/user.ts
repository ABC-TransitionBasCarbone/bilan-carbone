// TO DELETE ts-nockeck
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
'use server'

import {
  AccountWithUser,
  changeAccountRole,
  getAccountByEmailAndOrganizationVersionId,
  getAccountById,
  getAccountFromUserOrganization,
} from '@/db/account'
import { prismaClient } from '@/db/client'
import { getOrganizationVersionById, isOrganizationVersionCR } from '@/db/organization'
import { FullStudy } from '@/db/study'
import {
  addUser,
  changeStatus,
  createOrUpdateUserCheckedStep,
  deleteUserFromOrga,
  finalizeUserChecklist,
  getUserApplicationSettings,
  getUserFormationFormStart,
  getUserFromUserOrganization,
  getUsersCheckedSteps,
  startUserFormationForm,
  getUserSourceById,
  organizationVersionActiveAccountsCount,
  updateUserApplicationSettings,
  updateUserResetTokenForEmail,
  validateUser,
} from '@/db/user'
import { getUserByEmail, updateUser } from '@/db/userImport'
import { processUsers } from '@/scripts/ftp/userImport'
import { DAY, HOUR, MIN, TIME_IN_MS } from '@/utils/time'
import { accountWithUserToUserSession, userSessionToDbUser } from '@/utils/userAccounts'
import { Organization, Role, User, UserChecklist, UserStatus } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { UserSession } from 'next-auth'
import { auth } from '../auth'
import { getUserCheckList } from '../checklist'
import {
  sendActivationEmail,
  sendActivationRequest,
  sendAddedUsersByFile,
  sendContributorInvitationEmail,
  sendNewContributorInvitationEmail,
  sendNewUserEmail,
  sendNewUserOnStudyInvitationEmail,
  sendResetPassword,
  sendUserOnStudyInvitationEmail,
} from '../email/email'
import { EMAIL_SENT, MORE_THAN_ONE, NOT_AUTHORIZED, REQUEST_SENT } from '../permissions/check'
import { canAddMember, canChangeRole, canDeleteMember, canEditSelfRole } from '../permissions/user'
import { AddMemberCommand, EditProfileCommand, EditSettingsCommand } from './user.command'

const updateUserResetToken = async (email: string, duration: number) => {
  const resetToken = Math.random().toString(36)
  const payload = {
    email,
    resetToken,
    exp: Math.round(Date.now() / TIME_IN_MS) + duration,
  }
  await updateUserResetTokenForEmail(email, resetToken)
  return jwt.sign(payload, process.env.NEXTAUTH_SECRET as string)
}

export const sendNewUser = async (email: string, user: User, newUserName: string) => {
  const token = await updateUserResetToken(email, 1 * DAY)
  return sendNewUserEmail(email, token, `${user.firstName} ${user.lastName}`, newUserName)
}

export const sendInvitation = async (
  email: string,
  study: FullStudy,
  organization: Organization,
  user: UserSession,
  role: string,
  newAccount?: AccountWithUser,
) => {
  if (newAccount) {
    return role
      ? sendUserOnStudyInvitationEmail(
          email,
          study.name,
          study.id,
          organization.name,
          `${user.firstName} ${user.lastName}`,
          newAccount.user.firstName,
          role,
        )
      : sendContributorInvitationEmail(
          email,
          study.name,
          study.id,
          organization.name,
          `${user.firstName} ${user.lastName}`,
          newAccount.user.firstName,
        )
  }

  const token = await updateUserResetToken(email, 1 * DAY)
  return role
    ? sendNewUserOnStudyInvitationEmail(
        email,
        token,
        study.name,
        study.id,
        organization.name,
        `${user.firstName} ${user.lastName}`,
        role,
      )
    : sendNewContributorInvitationEmail(
        email,
        token,
        study.name,
        study.id,
        organization.name,
        `${user.firstName} ${user.lastName}`,
      )
}

export const sendActivation = async (email: string, fromReset: boolean) => {
  const token = await updateUserResetToken(email, 1 * HOUR)
  return sendActivationEmail(email, token, fromReset)
}

export const addMember = async (member: AddMemberCommand) => {
  const session = await auth()
  if (!session || !session.user || !session.user.organizationVersionId || member.role === Role.SUPER_ADMIN) {
    return NOT_AUTHORIZED
  }

  if (!canAddMember(session.user, member, session.user.organizationVersionId)) {
    return NOT_AUTHORIZED
  }

  const memberExists = await getAccountByEmailAndOrganizationVersionId(
    member.email.toLowerCase(),
    session.user.organizationVersionId,
  )

  if (memberExists?.role === Role.SUPER_ADMIN) {
    return NOT_AUTHORIZED
  }

  const userFromDb = await getUserByEmail(session.user.email)
  if (!userFromDb) {
    return NOT_AUTHORIZED
  }

  if (!memberExists) {
    const { role, ...rest } = member
    const newMember = {
      ...rest,
      status: UserStatus.VALIDATED,
      level: null,
      source: userFromDb.source,
      accounts: {
        create: {
          role: role === Role.ADMIN || member.role === Role.GESTIONNAIRE ? Role.GESTIONNAIRE : Role.DEFAULT,
          organizationVersionId: session.user.organizationVersionId,
        },
      },
    }

    await addUser(newMember)
    addUserChecklistItem(UserChecklist.AddCollaborator)
  } else {
    if (memberExists.user.status === UserStatus.ACTIVE && memberExists.organizationVersionId) {
      return NOT_AUTHORIZED
    }

    const updateMember = {
      ...member,
      status: UserStatus.VALIDATED,
      level: memberExists.user.level ? memberExists.user.level : null,
      role: memberExists.user.level
        ? memberExists.role
        : member.role === Role.ADMIN || member.role === Role.GESTIONNAIRE
          ? Role.GESTIONNAIRE
          : Role.DEFAULT,
      organizationVersionId: session.user.organizationVersionId,
    }
    await updateUser(memberExists.id, updateMember)
  }

  await sendNewUser(member.email.toLowerCase(), userSessionToDbUser(session.user), member.firstName)
}

export const validateMember = async (email: string) => {
  const session = await auth()
  if (!session || !session.user || !session.user.organizationVersionId) {
    return NOT_AUTHORIZED
  }

  const member = await getAccountByEmailAndOrganizationVersionId(email, session.user.organizationVersionId)
  if (!member || !canAddMember(session.user, member, member.organizationVersionId)) {
    return NOT_AUTHORIZED
  }

  await validateUser(email)
  await sendNewUser(member.user.email.toLowerCase(), userSessionToDbUser(session.user), member.user.firstName)
}

export const resendInvitation = async (email: string) => {
  const session = await auth()
  if (!session || !session.user || !session.user.organizationVersionId) {
    return NOT_AUTHORIZED
  }

  const member = await getAccountByEmailAndOrganizationVersionId(email, session.user.organizationVersionId)
  if (!member || !canAddMember(session.user, member, member.organizationVersionId)) {
    return NOT_AUTHORIZED
  }

  await sendNewUser(member.user.email, userSessionToDbUser(session.user), member.user.firstName)
}

export const deleteMember = async (email: string) => {
  const session = await auth()
  if (!session || !session.user) {
    return NOT_AUTHORIZED
  }

  const userToRemove = await getUserByEmail(email)
  if (!canDeleteMember(session.user, userToRemove)) {
    return NOT_AUTHORIZED
  }
  await deleteUserFromOrga(email, session.user.organizationVersionId)
}

export const changeRole = async (email: string, role: Role) => {
  const session = await auth()
  if (!session || !session.user || !session.user.organizationVersionId) {
    return NOT_AUTHORIZED
  }

  const accountToChange = await getAccountByEmailAndOrganizationVersionId(email, session.user.organizationVersionId)

  if (!accountToChange) {
    return NOT_AUTHORIZED
  }

  if (!canChangeRole(session.user, accountToChange as AccountWithUser, role)) {
    return NOT_AUTHORIZED
  }

  const team = await getAccountFromUserOrganization(session.user)
  const selfEditRolesCount = team.filter((member) => canEditSelfRole(member.role)).length
  if (accountToChange && selfEditRolesCount === 1 && canEditSelfRole(accountToChange.role) && !canEditSelfRole(role)) {
    return MORE_THAN_ONE
  }

  const targetAccount = await getAccountById(accountToChange.id)
  if (!targetAccount || targetAccount.organizationVersionId !== session.user.organizationVersionId) {
    return NOT_AUTHORIZED
  }

  await changeAccountRole(accountToChange.id, role)
}

export const updateUserProfile = async (command: EditProfileCommand) => {
  const session = await auth()
  if (!session || !session.user) {
    return NOT_AUTHORIZED
  }

  await updateUser(session.user.userId, command)
}

export const resetPassword = async (email: string) => {
  const user = await getUserByEmail(email)
  if (!user || user.status !== UserStatus.ACTIVE) {
    return activateEmail(email, true)
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
}

export const activateEmail = async (email: string, fromReset: boolean = false) => {
  const user = await getUserByEmail(email)
  const account = (await getAccountById(user?.accounts[0]?.id || '')) as AccountWithUser
  if (!user || !account || !account.organizationVersionId || user.status === UserStatus.ACTIVE) {
    return { error: true, message: NOT_AUTHORIZED }
  }

  const accountOrgaVersion = await getOrganizationVersionById(account.organizationVersionId)
  if (!accountOrgaVersion || !accountOrgaVersion.activatedLicence) {
    return { error: true, message: NOT_AUTHORIZED }
  }

  if (
    (await organizationVersionActiveAccountsCount(account.organizationVersionId)) &&
    user.status !== UserStatus.VALIDATED
  ) {
    const accounts = await getAccountFromUserOrganization(accountWithUserToUserSession(account))
    await sendActivationRequest(
      accounts.filter((a) => a.role === Role.GESTIONNAIRE || a.role === Role.ADMIN).map((a) => a.user.email),
      email.toLowerCase(),
      `${user.firstName} ${user.lastName}`,
    )

    await changeStatus(user.id, UserStatus.PENDING_REQUEST)

    return { error: false, message: REQUEST_SENT }
  } else {
    await validateUser(email)
    await sendActivation(email, fromReset)

    return { error: false, message: EMAIL_SENT }
  }
}

export const getUserSettings = async () => {
  const session = await auth()
  if (!session || !session.user) {
    return null
  }
  return getUserApplicationSettings(session.user.accountId)
}

export const getUserSource = async () => {
  const session = await auth()
  if (!session || !session.user) {
    return null
  }

  return (await getUserSourceById(session.user.userId))?.source
}

export const updateUserSettings = async (command: EditSettingsCommand) => {
  const session = await auth()
  if (!session || !session.user) {
    return NOT_AUTHORIZED
  }
  await updateUserApplicationSettings(session.user.accountId, command)
}

export const getUserCheckedItems = async () => {
  const session = await auth()
  if (!session || !session.user) {
    return []
  }
  return getUsersCheckedSteps(session.user.accountId)
}

export const addUserChecklistItem = async (step: UserChecklist) => {
  const session = await auth()
  if (!session || !session.user) {
    return
  }
  const isCR = isOrganizationVersionCR(session.user.organizationVersionId)
  const checklist = getUserCheckList(session.user.role, !!isCR)
  if (!Object.values(checklist).includes(step)) {
    return
  }
  await createOrUpdateUserCheckedStep(session.user.accountId, step)
  const userChecklist = await getUserCheckedItems()
  if (userChecklist.length === Object.values(checklist).length - 1) {
    setTimeout(
      async () => {
        await finalizeUserChecklist(session.user.accountId)
      },
      1 * MIN * TIME_IN_MS,
    )
  }
}

export const sendAddedUsersAndProccess = async (results: Record<string, string>[]) => {
  sendAddedUsersByFile(results)
  processUsers(results, new Date())
}

export const verifyPasswordAndProcessUsers = async (uuid: string) => uuid !== process.env.ADMIN_PASSWORD

export const getFormationFormStart = async (userId: string) => getUserFormationFormStart(userId)

export const startFormationForm = async (userId: string, date: Date) => startUserFormationForm(userId, date)

export const changeUserRoleOnOnboarding = async () => {
  const session = await auth()
  if (!session || !session.user) {
    return
  }

  const newRole = session.user.level ? Role.ADMIN : Role.GESTIONNAIRE
  await changeUserRole(session.user.email, newRole)
}
