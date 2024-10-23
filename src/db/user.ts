import { signPassword } from '@/services/auth'
import { prismaClient } from './client'

export const getUserByEmail = (email?: string | null) =>
  email ? prismaClient.user.findUnique({ where: { email } }) : null

export const updateUserPasswordForEmail = async (email: string, password: string) => {
  const signedPassword = await signPassword(password)
  return prismaClient.user.update({
    where: { email },
    data: {
      resetToken: null,
      password: signedPassword,
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

export const getUserOrganizations = async (email?: string | null) => {
  if (!email) {
    return []
  }

  const organizationSelect = { include: { sites: { select: { name: true, id: true } } } }

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
