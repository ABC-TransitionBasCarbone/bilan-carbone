import { signPassword } from '@/services/auth'
import { prismaClient } from './client'
import { User } from 'next-auth'
import { findUserInfo } from '@/services/permissions/user'
import { Prisma, Role } from '@prisma/client'

export const getUserByEmail = (email: string) => prismaClient.user.findUnique({ where: { email } })

export const getUserByEmailWithAllowedStudies = (email: string) =>
  prismaClient.user.findUnique({ where: { email }, include: { allowedStudies: true } })

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

  if (user.organization.isCR) {
    const childOrganizations = await prismaClient.organization.findMany({
      ...organizationSelect,
      where: { parentId: user.organization.id },
    })
    return [user.organization, ...childOrganizations]
  }

  return [user.organization]
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

export const changeUserRole = (email: string, role: Role) =>
  prismaClient.user.update({
    data: { role },
    where: { email },
  })
