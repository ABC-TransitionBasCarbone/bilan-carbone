'use server'

import { DAY, HOUR, TIME_IN_MS } from '@/utils/time'
import { User as DBUser, Level, Organization, Prisma, Role, UserStatus } from '@prisma/client'
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
import { EMAIL_SENT, NOT_AUTHORIZED, REQUEST_SENT } from '../permissions/check'
import { canAddMember, canChangeRole, canDeleteMember } from '../permissions/user'
import {
  createOrUpdateOrganization,
  getOrganizationById,
  getRawOrganizationById,
  getRawOrganizationBySiret,
} from './../../db/organization'
import { FullStudy } from './../../db/study'
import {
  addUser,
  changeStatus,
  changeUserRole,
  createUsers,
  deleteUserFromOrga,
  getUserApplicationSettings,
  getUserByEmail,
  getUserFromUserOrganization,
  organizationActiveUsersCount,
  updateUser,
  updateUserApplicationSettings,
  updateUserResetTokenForEmail,
  validateUser,
} from './../../db/user'
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
  if (!session || !session.user || !session.user.organizationId || member.role === Role.SUPER_ADMIN) {
    return NOT_AUTHORIZED
  }

  if (!canAddMember(session.user, member, session.user.organizationId)) {
    return NOT_AUTHORIZED
  }

  const memberExists = await getUserByEmail(member.email)

  if (memberExists?.role === Role.SUPER_ADMIN) {
    return NOT_AUTHORIZED
  }

  if (!memberExists) {
    const newMember = {
      ...member,
      role: Role.COLLABORATOR,
      status: UserStatus.VALIDATED,
      level: null,
      organizationId: session.user.organizationId,
    }
    await addUser(newMember)
  } else {
    if (memberExists.status === UserStatus.ACTIVE && memberExists.organizationId) {
      return NOT_AUTHORIZED
    }

    const updateMember = {
      ...member,
      status: UserStatus.VALIDATED,
      level: memberExists.level ? memberExists.level : null,
      role: memberExists.level ? memberExists.role : Role.COLLABORATOR,
      organizationId: session.user.organizationId,
    }
    await updateUser(memberExists.id, updateMember)
  }

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
  await deleteUserFromOrga(email)
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

  const targetUser = await getUserByEmail(email)
  if (!targetUser || targetUser.organizationId !== session.user.organizationId) {
    return NOT_AUTHORIZED
  }

  if (!targetUser.level && role !== Role.GESTIONNAIRE) {
    return NOT_AUTHORIZED
  }

  await changeUserRole(email, role)
}

export const updateUserProfile = async (command: EditProfileCommand) => {
  const session = await auth()
  if (!session || !session.user) {
    return NOT_AUTHORIZED
  }

  await updateUser(session.user.id, command)
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
  if (!user || !user.organizationId || user.status === UserStatus.ACTIVE) {
    return { error: true, message: NOT_AUTHORIZED }
  }

  const userOrga = await getOrganizationById(user.organizationId)
  if (!userOrga || !userOrga.activatedLicence) {
    return { error: true, message: NOT_AUTHORIZED }
  }

  if ((await organizationActiveUsersCount(user.organizationId)) && user.status !== UserStatus.VALIDATED) {
    const users = await getUserFromUserOrganization(user)
    await sendActivationRequest(
      users.filter((u) => u.role === Role.GESTIONNAIRE || u.role === Role.ADMIN).map((u) => u.email),
      email,
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
  return getUserApplicationSettings(session.user.id)
}

export const updateUserSettings = async (command: EditSettingsCommand) => {
  const session = await auth()
  if (!session || !session.user) {
    return NOT_AUTHORIZED
  }
  await updateUserApplicationSettings(session.user.id, command)
}

const processUser = async (value: Record<string, string>, importedFileDate: Date) => {
  const {
    User_Email: email,
    Firstname: firstName = '',
    Lastname: lastName = '',
    Session_Code: sessionCodeTraining,
    Company_Name: name,
    SIRET: siret,
    SIREN: siren,
    Purchased_Products: purchasedProducts,
    Membership_Year: membershipYear,
  } = value

  const siretOrSiren = siret || siren
  const isCR = ['adhesion_conseil', 'licence_exploitation'].includes(purchasedProducts)
  const activatedLicence = membershipYear.includes(new Date().getFullYear().toString())

  const dbUser = (await getUserByEmail(email)) as Prisma.UserCreateManyInput

  const user: Prisma.UserCreateManyInput = {
    id: dbUser?.id,
    email,
    firstName,
    lastName,
    role: Role.COLLABORATOR,
    status: UserStatus.IMPORTED,
    importedFileDate,
  }

  if (sessionCodeTraining) {
    user.level = sessionCodeTraining.includes('BCM2') ? Level.Advanced : Level.Initial
  }

  if (siretOrSiren) {
    let organisation = dbUser?.organizationId
      ? await getRawOrganizationById(dbUser.organizationId)
      : await getRawOrganizationBySiret(siretOrSiren)

    organisation = await createOrUpdateOrganization(
      {
        id: organisation?.id,
        name,
        siret: siretOrSiren,
      } as Prisma.OrganizationCreateInput,
      isCR,
      activatedLicence,
      importedFileDate,
    )

    user.organizationId = organisation?.id
  }

  if (dbUser) {
    await updateUser(dbUser.id || '', {
      level: user.level,
      ...(dbUser.status === UserStatus.IMPORTED && {
        role: user.role as Exclude<Role, 'SUPER_ADMIN'>,
        organizationId: user.organizationId,
      }),
    })
    console.log(`Updating ${email} because already exists`)
    return null
  }

  return user
}

export const processUsers = async (values: Record<string, string>[], importedFileDate: Date) => {
  const users: Prisma.UserCreateManyInput[] = []
  for (let i = 0; i < values.length; i++) {
    const user = await processUser(values[i] as Record<string, string>, importedFileDate)
    if (user) {
      users.push(user)
    }
    if (i % 50 === 0) {
      console.log(`${i}/${values.length}`)
    }
  }
  console.log('users', users)
  const created = await createUsers(users)
  console.log(`${created.count} users created`)
}
