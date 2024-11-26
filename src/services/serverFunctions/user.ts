'use server'

import { addUser, changeUserRole, deleteUser, getUserByEmail, updateUserResetTokenForEmail } from '@/db/user'
import { Role } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { auth } from '../auth'
import { sendNewInvitation } from '../email/email'
import { NOT_AUTHORIZED } from '../permissions/check'
import { canAddMember, canChangeRole, canDeleteMember } from '../permissions/user'
import { AddMemberCommand } from './user.command'

export const sendInvitation = async (email: string) => {
  const resetToken = Math.random().toString(36)
  const payload = {
    email,
    resetToken,
    exp: Math.round(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days expiration
  }

  const token = jwt.sign(payload, process.env.NEXTAUTH_SECRET as string)
  await updateUserResetTokenForEmail(email, resetToken)
  return sendNewInvitation(email, token)
}

export const addMember = async (member: AddMemberCommand) => {
  const session = await auth()
  if (!session || !session.user || !session.user.organizationId) {
    return NOT_AUTHORIZED
  }

  const newMember = { ...member, isActive: false, organization: { connect: { id: session.user.organizationId } } }

  if (!canAddMember(session.user, newMember, session.user.organizationId)) {
    return NOT_AUTHORIZED
  }

  //TODO: que fait on si l'utilisateur existe déjà ?
  await addUser(newMember)
  await sendInvitation(member.email)
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

  await sendInvitation(member.email)
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
