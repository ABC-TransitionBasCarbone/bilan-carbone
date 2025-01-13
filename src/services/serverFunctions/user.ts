'use server'

import { FullStudy } from '@/db/study'
import {
  addUser,
  changeUserRole,
  deleteUser,
  getUserByEmail,
  updateProfile,
  updateUserResetTokenForEmail,
  validateUser,
} from '@/db/user'
import { User as DBUser, Organization, Role } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { User } from 'next-auth'
import { auth } from '../auth'
import {
  sendContributorInvitationEmail,
  sendNewContributorInvitationEmail,
  sendNewUserEmail,
  sendNewUserOnStudyInvitationEmail,
  sendUserOnStudyInvitationEmail,
} from '../email/email'
import { NOT_AUTHORIZED } from '../permissions/check'
import { canAddMember, canChangeRole, canDeleteMember } from '../permissions/user'
import { AddMemberCommand, EditProfileCommand } from './user.command'

const updateUserResetToken = async (email: string) => {
  const resetToken = Math.random().toString(36)
  const payload = {
    email,
    resetToken,
    exp: Math.round(Date.now() / 1000) + 24 * 60 * 60, // 24 hours expiration
  }

  await updateUserResetTokenForEmail(email, resetToken)
  return jwt.sign(payload, process.env.NEXTAUTH_SECRET as string)
}

export const sendNewUser = async (email: string) => {
  const token = await updateUserResetToken(email)
  return sendNewUserEmail(email, token)
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

  const token = await updateUserResetToken(email)
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
  }

  if (!canAddMember(session.user, newMember, session.user.organizationId)) {
    return NOT_AUTHORIZED
  }

  //TODO: que fait on si l'utilisateur existe déjà ?
  await addUser(newMember)
  await sendNewUser(member.email)
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
  await sendNewUser(member.email)
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

  await sendNewUser(member.email)
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
