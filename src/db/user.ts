import { signPassword } from '@/services/auth'
import { findUserInfo } from '@/services/permissions/user'
import { Prisma, Role, UserStatus } from '@prisma/client'
import { User } from 'next-auth'
import { prismaClient } from './client'

export const getUserByEmailWithSensibleInformations = (email: string) =>
  prismaClient.user.findUnique({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      role: true,
      email: true,
      organizationId: true,
      level: true,
      password: true,
      resetToken: true,
      status: true,
    },
    where: { email },
  })

export const getUserByEmail = (email: string) => prismaClient.user.findUnique({ where: { email } })

export const getUserById = (id: string) =>
  prismaClient.user.findUnique({ where: { id }, select: { organizationId: true } })

export const getUserByEmailWithAllowedStudies = (email: string) =>
  prismaClient.user.findUnique({ where: { email }, include: { allowedStudies: true, contributors: true } })

export type UserWithAllowedStudies = AsyncReturnType<typeof getUserByEmailWithAllowedStudies>

export const updateUserPasswordForEmail = async (email: string, password: string) => {
  const signedPassword = await signPassword(password)
  return prismaClient.user.update({
    where: { email },
    data: {
      resetToken: null,
      password: signedPassword,
      status: UserStatus.ACTIVE,
      updatedAt: new Date(),
    },
  })
}

export const updateUserResetTokenForEmail = async (email: string, resetToken: string) =>
  prismaClient.user.update({
    where: { email },
    data: {
      resetToken,
      updatedAt: new Date(),
    },
  })

export const getUserOrganizations = async (email: string) => {
  if (!email) {
    return []
  }

  const organizationSelect = { include: { sites: { select: { name: true, etp: true, ca: true, id: true } } } }

  const user = await prismaClient.user.findUnique({
    select: {
      role: true,
      organization: organizationSelect,
    },
    where: { email },
  })

  if (!user) {
    return []
  }

  if (user.organization && user.organization.isCR) {
    const childOrganizations = await prismaClient.organization.findMany({
      ...organizationSelect,
      where: { parentId: user.organization.id },
    })
    return [user.organization, ...childOrganizations]
  }

  return user.organization ? [user.organization] : []
}

export type OrganizationWithSites = AsyncReturnType<typeof getUserOrganizations>[0]

export const getUserFromUserOrganization = async (user: User) =>
  prismaClient.user.findMany({ ...findUserInfo(user), orderBy: { email: 'asc' } })
export type TeamMember = AsyncReturnType<typeof getUserFromUserOrganization>[0]

export const getOnlyActiveUsersForOrganization = (organizationId: string) =>
  prismaClient.user.findMany({ where: { organizationId, status: UserStatus.ACTIVE } })

export const addUser = (user: Prisma.UserCreateInput) => {
  if (user.role === Role.SUPER_ADMIN) {
    throw Error('Cannot create a super admin')
  }

  prismaClient.user.create({
    data: user,
  })
}

export const deleteUser = (email: string) =>
  prismaClient.user.update({
    where: { email },
    data: { status: UserStatus.IMPORTED, organizationId: null },
  })

export const validateUser = (email: string) =>
  prismaClient.user.update({
    where: { email },
    data: { status: UserStatus.VALIDATED, updatedAt: new Date() },
  })

export const changeUserRole = (email: string, role: Role) =>
  prismaClient.user.update({
    data: { role, updatedAt: new Date() },
    where: { email },
  })

export const hasUserToValidateInOrganization = async (organizationId: string | null) =>
  organizationId
    ? prismaClient.user.count({
        where: { organizationId, status: UserStatus.PENDING_REQUEST },
      })
    : 0

export const hasActiveUserInOrganization = async (organizationId: string) =>
  prismaClient.user.count({
    where: { organizationId, status: UserStatus.ACTIVE },
  })

export const updateProfile = (userId: string, data: Prisma.UserUpdateInput) =>
  prismaClient.user.update({
    where: { id: userId },
    data,
  })

export const changeStatus = (userId: string, newStatus: UserStatus) =>
  prismaClient.user.update({ where: { id: userId }, data: { status: newStatus } })

export const getUserApplicationSettings = (userId: string) =>
  prismaClient.userApplicationSettings.upsert({ where: { userId }, update: {}, create: { userId } })

export const updateUserApplicationSettings = (userId: string, data: Prisma.UserApplicationSettingsUpdateInput) =>
  prismaClient.userApplicationSettings.update({
    where: { userId },
    data,
  })

export const linkUserToOrganization = async (user: Prisma.UserCreateInput) => {
  if (user.role === Role.SUPER_ADMIN) {
    throw Error('Cannot create a super admin')
  }
  await prismaClient.user.update({
    where: { email: user.email },
    data: user,
  })
}
