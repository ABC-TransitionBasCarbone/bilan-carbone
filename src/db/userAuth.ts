import { signPassword } from '@/services/auth'
import { UserStatus } from '@prisma/client'
import { User } from 'next-auth'
import { findUserInfo } from '../services/permissions/user'
import { prismaClient } from './client'
import { getUserByEmailWithAllowedStudies, getUserOrganizations } from './user'

export const getUserFromUserOrganization = (user: User) =>
  prismaClient.user.findMany({ ...findUserInfo(user), orderBy: { email: 'asc' } })
export type TeamMember = AsyncReturnType<typeof getUserFromUserOrganization>[0]

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

export type UserWithAllowedStudies = AsyncReturnType<typeof getUserByEmailWithAllowedStudies>

export type OrganizationWithSites = AsyncReturnType<typeof getUserOrganizations>[0]
