'use server'

import {
  AccountWithUser,
  changeAccountRole,
  getAccountByEmailAndOrganizationVersionId,
  getAccountById,
  getAccountFromUserOrganization,
  getAccountsFromUser,
} from '@/db/account'
import { getOrganizationVersionById, isOrganizationVersionCR } from '@/db/organization'
import { FullStudy } from '@/db/study'
import {
  addUser,
  changeStatus,
  createOrUpdateUserCheckedStep,
  deleteUserFromOrga,
  finalizeUserChecklist,
  getUserApplicationSettings,
  getUserByEmail,
  getUserFormationFormStart,
  getUsers,
  getUsersCheckedSteps,
  getUserSourceById,
  organizationVersionActiveAccountsCount,
  startUserFormationForm,
  updateUser,
  updateUserApplicationSettings,
  updateUserResetTokenForEmail,
  validateUser,
} from '@/db/user'
import { processUsers } from '@/scripts/ftp/userImport'
import { withServerResponse } from '@/utils/serverResponse'
import { DAY, HOUR, MIN, TIME_IN_MS } from '@/utils/time'
import { getRoleToSetForUntrained } from '@/utils/user'
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

export const sendNewUser = async (email: string, user: User, newUserName: string) =>
  withServerResponse('sendNewUser', async () => {
    const token = await updateUserResetToken(email, 1 * DAY)
    return sendNewUserEmail(email, token, `${user.firstName} ${user.lastName}`, newUserName)
  })

export const sendInvitation = async (
  email: string,
  study: FullStudy,
  organization: Organization,
  creator: UserSession,
  roleOnStudy: string,
  existingAccount?: AccountWithUser,
) =>
  withServerResponse('sendInvitation', async () => {
    if (existingAccount && existingAccount.user.status === UserStatus.ACTIVE) {
      return roleOnStudy
        ? sendUserOnStudyInvitationEmail(
            email,
            study.name,
            study.id,
            organization.name,
            `${creator.firstName} ${creator.lastName}`,
            existingAccount.user.firstName,
            roleOnStudy,
          )
        : sendNewContributorInvitationEmail(
            email,
            study.name,
            study.id,
            organization.name,
            `${creator.firstName} ${creator.lastName}`,
            existingAccount.user.firstName,
          )
    }

    const token = await updateUserResetToken(email, 1 * DAY)

    return roleOnStudy
      ? sendNewUserOnStudyInvitationEmail(
          email,
          token,
          study.name,
          study.id,
          organization.name,
          `${creator.firstName} ${creator.lastName}`,
          roleOnStudy,
        )
      : sendNewContributorInvitationEmail(
          email,
          token,
          study.name,
          study.id,
          organization.name,
          `${creator.firstName} ${creator.lastName}`,
        )
  })

const sendActivation = async (email: string, fromReset: boolean) => {
  const token = await updateUserResetToken(email, 1 * HOUR)
  return sendActivationEmail(email, token, fromReset)
}

export const addMember = async (member: AddMemberCommand) =>
  withServerResponse('addMember', async () => {
    const session = await auth()
    if (!session || !session.user || !session.user.organizationVersionId || member.role === Role.SUPER_ADMIN) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (!canAddMember(session.user, member, session.user.organizationVersionId)) {
      throw new Error(NOT_AUTHORIZED)
    }

    const memberExists = await getAccountByEmailAndOrganizationVersionId(
      member.email.toLowerCase(),
      session.user.organizationVersionId,
    )

    if (memberExists?.role === Role.SUPER_ADMIN) {
      throw new Error(NOT_AUTHORIZED)
    }

    const userFromDb = await getUserByEmail(session.user.email)
    if (!userFromDb) {
      throw new Error(NOT_AUTHORIZED)
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
            role: getRoleToSetForUntrained(role),
            organizationVersionId: session.user.organizationVersionId,
            environment: session.user.environment,
          },
        },
      }

      await addUser(newMember)
      addUserChecklistItem(UserChecklist.AddCollaborator)
    } else {
      if (memberExists.user.status === UserStatus.ACTIVE && memberExists.organizationVersionId) {
        throw new Error(NOT_AUTHORIZED)
      }

      const updateMember = {
        ...member,
        status: UserStatus.VALIDATED,
        level: memberExists.user.level ? memberExists.user.level : null,
        role: memberExists.user.level ? memberExists.role : getRoleToSetForUntrained(memberExists.role),
        organizationVersionId: session.user.organizationVersionId,
      }
      await updateUser(memberExists.id, updateMember)
    }

    await sendNewUser(member.email.toLowerCase(), userSessionToDbUser(session.user), member.firstName)
  })

export const validateMember = async (email: string) =>
  withServerResponse('validateMember', async () => {
    const session = await auth()
    if (!session || !session.user || !session.user.organizationVersionId) {
      throw new Error(NOT_AUTHORIZED)
    }

    const member = await getAccountByEmailAndOrganizationVersionId(email, session.user.organizationVersionId)
    if (!member || !canAddMember(session.user, member, member.organizationVersionId)) {
      throw new Error(NOT_AUTHORIZED)
    }

    await validateUser(email)
    await sendNewUser(member.user.email.toLowerCase(), userSessionToDbUser(session.user), member.user.firstName)
  })

export const resendInvitation = async (email: string) =>
  withServerResponse('resendInvitation', async () => {
    const session = await auth()
    if (!session || !session.user || !session.user.organizationVersionId) {
      throw new Error(NOT_AUTHORIZED)
    }

    const member = await getAccountByEmailAndOrganizationVersionId(email, session.user.organizationVersionId)
    if (!member || !canAddMember(session.user, member, member.organizationVersionId)) {
      throw new Error(NOT_AUTHORIZED)
    }

    await sendNewUser(member.user.email, userSessionToDbUser(session.user), member.user.firstName)
  })

export const deleteMember = async (email: string) =>
  withServerResponse('deleteMember', async () => {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    const accountToRemove = await getAccountByEmailAndOrganizationVersionId(email, session.user.organizationVersionId)
    if (!canDeleteMember(session.user, accountToRemove as AccountWithUser)) {
      throw new Error(NOT_AUTHORIZED)
    }
    await deleteUserFromOrga(email, session.user.organizationVersionId)
  })

export const changeRole = async (email: string, role: Role) =>
  withServerResponse('changeRole', async () => {
    const session = await auth()
    if (!session || !session.user || !session.user.organizationVersionId) {
      throw new Error(NOT_AUTHORIZED)
    }

    const accountToChange = await getAccountByEmailAndOrganizationVersionId(email, session.user.organizationVersionId)

    if (!accountToChange) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (!canChangeRole(session.user, accountToChange as AccountWithUser, role)) {
      throw new Error(NOT_AUTHORIZED)
    }

    const team = await getAccountFromUserOrganization(session.user)
    const selfEditRolesCount = team.filter((member) => canEditSelfRole(member.role)).length
    if (
      accountToChange &&
      selfEditRolesCount === 1 &&
      canEditSelfRole(accountToChange.role) &&
      !canEditSelfRole(role)
    ) {
      return MORE_THAN_ONE
    }

    const targetAccount = await getAccountById(accountToChange.id)
    if (!targetAccount || targetAccount.organizationVersionId !== session.user.organizationVersionId) {
      throw new Error(NOT_AUTHORIZED)
    }

    await changeAccountRole(accountToChange.id, role)
  })

export const updateUserProfile = async (command: EditProfileCommand) =>
  withServerResponse('updateUserProfile', async () => {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    await updateUser(session.user.userId, command)
  })

export const resetPassword = async (email: string) =>
  withServerResponse('resetPassword', async () => {
    const user = await getUserByEmail(email)
    if (!user || user.status !== UserStatus.ACTIVE) {
      const activation = await activateEmail(email, true)
      if (activation.success) {
        return activation.data
      } else {
        throw new Error(activation.errorMessage)
      }
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

export const activateEmail = async (email: string, fromReset: boolean = false) =>
  withServerResponse('activateEmail', async () => {
    const user = await getUserByEmail(email)
    const account = (await getAccountById(user?.accounts[0]?.id || '')) as AccountWithUser
    if (!user || !account || !account.organizationVersionId || user.status === UserStatus.ACTIVE) {
      throw new Error(NOT_AUTHORIZED)
    }

    const accountOrgaVersion = await getOrganizationVersionById(account.organizationVersionId)
    if (!accountOrgaVersion || !accountOrgaVersion.activatedLicence) {
      throw new Error(NOT_AUTHORIZED)
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

      return REQUEST_SENT
    } else {
      await validateUser(email)
      await sendActivation(email, fromReset)

      return EMAIL_SENT
    }
  })

export const getUserSettings = async () =>
  withServerResponse('getUserSettings', async () => {
    const session = await auth()
    if (!session || !session.user) {
      return null
    }
    return getUserApplicationSettings(session.user.accountId)
  })

export const getUserSource = async () =>
  withServerResponse('getUserSource', async () => {
    const session = await auth()
    if (!session || !session.user) {
      return null
    }

    return (await getUserSourceById(session.user.userId))?.source
  })

export const updateUserSettings = async (command: EditSettingsCommand) =>
  withServerResponse('updateUserSettings', async () => {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error(NOT_AUTHORIZED)
    }
    await updateUserApplicationSettings(session.user.accountId, command)
  })

export const getUserCheckedItems = async () =>
  withServerResponse('getUserCheckedItems', async () => {
    const session = await auth()
    if (!session || !session.user) {
      return []
    }
    return getUsersCheckedSteps(session.user.accountId)
  })

export const addUserChecklistItem = async (step: UserChecklist) =>
  withServerResponse('addUserChecklistItem', async () => {
    const session = await auth()
    if (!session || !session.user) {
      return
    }
    const isCR = await isOrganizationVersionCR(session.user.organizationVersionId)
    const checklist = getUserCheckList(session.user.role, !!isCR)
    if (!Object.values(checklist).includes(step)) {
      return
    }
    await createOrUpdateUserCheckedStep(session.user.accountId, step)
    const userChecklist = await getUserCheckedItems()
    if (userChecklist.success && userChecklist.data.length === Object.values(checklist).length - 1) {
      setTimeout(
        async () => {
          await finalizeUserChecklist(session.user.accountId)
        },
        1 * MIN * TIME_IN_MS,
      )
    }
  })

export const sendAddedUsersAndProccess = async (results: Record<string, string>[]) =>
  withServerResponse('sendAddedUsersAndProccess', async () => {
    sendAddedUsersByFile(results)
    processUsers(results, new Date())
  })

export const verifyPasswordAndProcessUsers = async (uuid: string) =>
  withServerResponse('verifyPasswordAndProcessUsers', async () => uuid === process.env.ADMIN_PASSWORD)

export const getFormationFormStart = async (userId: string) =>
  withServerResponse('getFormationFormStart', async () => getUserFormationFormStart(userId))

export const startFormationForm = async (userId: string, date: Date) =>
  withServerResponse('startFormationForm', async () => startUserFormationForm(userId, date))

export const changeUserRoleOnOnboarding = async () =>
  withServerResponse('changeUserRoleOnOnboarding', async () => {
    const session = await auth()
    if (!session || !session.user) {
      return
    }

    const newRole = session.user.level ? Role.ADMIN : getRoleToSetForUntrained(Role.ADMIN)
    await changeAccountRole(session.user.accountId, newRole)
  })

export const lowercaseUsersEmails = async () => {
  const users = await getUsers()

  const duplicated = users.filter(
    (user) => users.filter((u) => u.email.toLowerCase() === user.email.toLowerCase()).length > 1,
  )
  if (duplicated.length > 1) {
    const emails = duplicated.map((user) => user.email)
    console.log(`Migration impossible, il existe ${emails.length} adresses mail dupliquées : `)
    emails.sort((a, b) => a.localeCompare(b)).forEach((email) => console.log(`- ${email}`))
    console.log('Veuillez régler ces conflicts en premier lieu')
  } else {
    const capitalizedUsers = users.filter((user) => user.email !== user.email.toLowerCase())
    await Promise.all(capitalizedUsers.map((user) => updateUser(user.id, { email: user.email.toLowerCase() })))
    console.log(`Fait : ${capitalizedUsers.length} utilisateurs mis à jour`)
  }
}

export const getUserAccounts = async () =>
  withServerResponse('getUserAccounts', async () => {
    const session = await auth()
    if (!session || !session.user) {
      return []
    }
    const accounts = await getAccountsFromUser(session.user)
    return accounts
  })
