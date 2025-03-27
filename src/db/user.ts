import { signPassword } from '@/services/auth'
import { Prisma, Role, UserChecklist, UserStatus } from '@prisma/client'
import { prismaClient } from './client'

export const getUserByEmailWithSensibleInformations = (email: string) =>
  prismaClient.user.findUnique({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      level: true,
      password: true,
      resetToken: true,
      accounts: true,
      status: true,
    },
    where: { email },
  })

export const getUserById = (id: string) =>
  prismaClient.user.findUnique({ where: { id }, select: { firstName: true, lastName: true, email: true } })

export const getAccountByIdWithAllowedStudies = (id: string) =>
  prismaClient.account.findUnique({ where: { id }, include: { allowedStudies: true, contributors: true } })

export type UserWithAllowedStudies = AsyncReturnType<typeof getAccountByIdWithAllowedStudies>

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
  const accounts = await prismaClient.account.findMany({ where: { userId: user.id } })

  await Promise.all(
    accounts.map((account) =>
      prismaClient.userCheckedStep.upsert({
        where: { accountId_step: { accountId: account.id, step: UserChecklist.CreateAccount } },
        update: {},
        create: { accountId: account.id, step: UserChecklist.CreateAccount },
      }),
    ),
  )
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

export const addUser = (user: Prisma.UserCreateInput & { role?: Exclude<Role, 'SUPER_ADMIN'> }) =>
  prismaClient.user.create({
    data: user,
  })

export const deleteUserFromOrga = (email: string) =>
  // TODO en attente de réponse sur le status
  prismaClient.user.update({
    where: { email },
    data: { status: UserStatus.IMPORTED, organizationId: null },
  })

export const validateUser = (email: string) =>
  prismaClient.user.update({
    where: { email },
    data: { status: UserStatus.VALIDATED, updatedAt: new Date() },
  })

export const hasAccountToValidateInOrganization = async (organizationId: string | null) =>
  organizationId
    ? prismaClient.account.count({
        where: { organizationId, user: { status: UserStatus.PENDING_REQUEST } },
      })
    : 0

export const organizationActiveUsersCount = async (organizationId: string) =>
  prismaClient.account.count({
    where: { organizationId, user: { status: UserStatus.ACTIVE } },
  })

export const changeStatus = (userId: string, newStatus: UserStatus) =>
  prismaClient.user.update({ where: { id: userId }, data: { status: newStatus } })

export const getUserApplicationSettings = (accountId: string) =>
  prismaClient.userApplicationSettings.upsert({ where: { accountId }, update: {}, create: { accountId } })

export const updateUserApplicationSettings = (accountId: string, data: Prisma.UserApplicationSettingsUpdateInput) =>
  prismaClient.userApplicationSettings.update({
    where: { accountId },
    data,
  })
