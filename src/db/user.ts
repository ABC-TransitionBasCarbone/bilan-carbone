import { signPassword } from '@/services/auth'
import { findUserInfo } from '@/services/permissions/user'
import { Prisma, Role } from '@prisma/client'
import { User } from 'next-auth'
import { prismaClient } from './client'

export const getUserByEmail = (email: string) => prismaClient.user.findUnique({ where: { email } })

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
      isActive: true,
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

export const getUserFromUserOrganization = (user: User) =>
  prismaClient.user.findMany({ ...findUserInfo(user), orderBy: { email: 'asc' } })
export type TeamMember = AsyncReturnType<typeof getUserFromUserOrganization>[0]

export const addUser = (user: Prisma.UserCreateInput) =>
  prismaClient.user.create({
    data: user,
  })

export const deleteUser = (email: string) =>
  prismaClient.user.delete({
    where: { email },
  })

export const validateUser = (email: string) =>
  prismaClient.user.update({
    where: { email },
    data: { isValidated: true, updatedAt: new Date() },
  })

export const changeUserRole = (email: string, role: Role) =>
  prismaClient.user.update({
    data: { role, updatedAt: new Date() },
    where: { email },
  })

export const hasUserToValidateInOrganization = async (organizationId: string | null) =>
  organizationId
    ? prismaClient.user.count({
        where: { organizationId, isValidated: false },
      })
    : 0
