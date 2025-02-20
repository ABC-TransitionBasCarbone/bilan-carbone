'use server'

import { FullStudy } from '@/db/study'
import {
  addUser,
  changeUserRole,
  deleteUser,
  getUserApplicationSettings,
  getUserByEmail,
  getUserFromUserOrganization,
  hasActiveUserInOrganization,
  updateProfile,
  updateUserApplicationSettings,
  updateUserResetTokenForEmail,
  validateUser,
} from '@/db/user'
import { DAY, HOUR, TIME_IN_MS } from '@/utils/time'
import { User as DBUser, Organization, Role } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { User } from 'next-auth'
import { auth } from '../auth'
import {
  sendActivationEmail,
  sendActivationRequest,
  sendContributorInvitationEmail,
  sendNewContributorInvitationEmail,
  sendNewUserEmail,
  sendNewUserOnStudyInvitationEmail,
  sendResetPassword,
  sendUserOnStudyInvitationEmail,
} from '../email/email'
import { NOT_AUTHORIZED, REQUEST_SENT } from '../permissions/check'
import { canAddMember, canChangeRole, canDeleteMember } from '../permissions/user'
import { hasEmptyPassword } from './auth'
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
  user: User,
  role: string,
  newUser?: DBUser,
) => {
  if (newUser) {
    return role
      ? sendUserOnStudyInvitationEmail(
          email,
          study.name,
          study.id,
          organization.name,
          `${user.firstName} ${user.lastName}`,
          newUser.firstName,
          role,
        )
      : sendContributorInvitationEmail(
          email,
          study.name,
          study.id,
          organization.name,
          `${user.firstName} ${user.lastName}`,
          newUser.firstName,
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
  if (!session || !session.user || !session.user.organizationId) {
    return NOT_AUTHORIZED
  }

  const newMember = {
    ...member,
    isActive: false,
    isValidated: true,
    organization: { connect: { id: session.user.organizationId } },
    importedFileDate: new Date(),
  }

  if (!canAddMember(session.user, newMember, session.user.organizationId)) {
    return NOT_AUTHORIZED
  }

  //TODO: que fait on si l'utilisateur existe déjà ?
  await addUser(newMember)
  await sendNewUser(member.email, session.user, member.firstName)
}

export const validateMember = async (email: string) => {
  const session = await auth()
  if (!session || !session.user) {
    return NOT_AUTHORIZED
  }

  const member = await getUserByEmail(email)
  if (!member || !canAddMember(session.user, member, member.organizationId)) {
    return NOT_AUTHORIZED
  }

  await validateUser(email)
  await sendNewUser(member.email, session.user, member.firstName)
}

export const resendInvitation = async (email: string) => {
  const session = await auth()
  if (!session || !session.user) {
    return NOT_AUTHORIZED
  }

  const member = await getUserByEmail(email)
  if (!member || !canAddMember(session.user, member, member.organizationId)) {
    return NOT_AUTHORIZED
  }

  await sendNewUser(member.email, session.user, member.firstName)
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
  await deleteUser(email)
}

export const changeRole = async (email: string, role: Role) => {
  const session = await auth()
  if (!session || !session.user) {
    return NOT_AUTHORIZED
  }

  const userToChange = await getUserByEmail(email)
  if (!canChangeRole(session.user, userToChange, role)) {
    return NOT_AUTHORIZED
  }
  await changeUserRole(email, role)
}

export const updateUserProfile = async (command: EditProfileCommand) => {
  const session = await auth()
  if (!session || !session.user) {
    return NOT_AUTHORIZED
  }
  await updateProfile(session.user.id, command)
}

export const resetPassword = async (email: string) => {
  const user = await getUserByEmail(email)
  if (await hasEmptyPassword(email)) {
    await activateEmail(email, true)
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
  // TODO ajouter un check sur le fait que l'orga a une licence active
  if (!user || user.isActive || !user.organizationId) {
    return NOT_AUTHORIZED
  }
  if (await hasActiveUserInOrganization(user.organizationId)) {
    const users = await getUserFromUserOrganization(user)
    await sendActivationRequest(
      users.filter((u) => u.role === Role.GESTIONNAIRE || u.role === Role.ADMIN).map((u) => u.email),
      email,
      `${user.firstName} ${user.lastName}`,
    )
    return REQUEST_SENT
  } else {
    await validateUser(email)
    await sendActivation(email, fromReset)
  }
}

export const getUserSettings = async () => {
  const session = await auth()
  if (!session || !session.user) {
    return null
  }
  return getUserApplicationSettings(session.user.id)
}

export const updateUserSettings = async (command: EditSettingsCommand) => {
  const session = await auth()
  if (!session || !session.user) {
    return NOT_AUTHORIZED
  }
  await updateUserApplicationSettings(session.user.id, command)
}
