import { signPassword } from '@/services/auth'
import { findUserInfo } from '@/services/permissions/user'
import { Prisma, Role, UserChecklist, UserStatus } from '@prisma/client'
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

export const getUserSourceById = (id: string) =>
  prismaClient.user.findUnique({ where: { id }, select: { source: true } })

export const getUserByEmailWithAllowedStudies = (email: string) =>
  prismaClient.user.findUnique({ where: { email }, include: { allowedStudies: true, contributors: true } })

export type UserWithAllowedStudies = AsyncReturnType<typeof getUserByEmailWithAllowedStudies>

export const updateUserPasswordForEmail = async (email: string, password: string) => {
  const signedPassword = await signPassword(password)
  const user = await prismaClient.user.update({
    where: { email },
    data: {
      resetToken: null,
      password: signedPassword,
      status: UserStatus.ACTIVE,
      updatedAt: new Date(),
    },
  })
  await prismaClient.userCheckedStep.upsert({
    where: { userId_step: { userId: user.id, step: UserChecklist.CreateAccount } },
    update: {},
    create: { userId: user.id, step: UserChecklist.CreateAccount },
  })
  return user
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

  const organizationSelect = {
    include: { sites: { select: { name: true, etp: true, ca: true, id: true, postalCode: true, city: true } } },
  }

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

export const getUserFromUserOrganization = (user: User) =>
  prismaClient.user.findMany({ ...findUserInfo(user), orderBy: { email: 'asc' } })
export type TeamMember = AsyncReturnType<typeof getUserFromUserOrganization>[0]

export const addUser = (user: Prisma.UserCreateInput & { role?: Exclude<Role, 'SUPER_ADMIN'> }) =>
  prismaClient.user.create({
    data: user,
  })

export const deleteUserFromOrga = (email: string) =>
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

export const organizationActiveUsersCount = async (organizationId: string) =>
  prismaClient.user.count({
    where: { organizationId, status: UserStatus.ACTIVE },
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
