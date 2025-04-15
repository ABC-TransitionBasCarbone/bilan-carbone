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

export const getUserSourceById = (id: string) =>
  prismaClient.user.findUnique({ where: { id }, select: { source: true } })

export const getUserById = (id: string) =>
  prismaClient.user.findUnique({ where: { id }, select: { firstName: true, lastName: true, email: true } })

export const getAccountByIdWithAllowedStudies = (id: string) =>
  prismaClient.account.findUnique({ where: { id }, include: { allowedStudies: true, contributors: true } })

export type UserWithAllowedStudies = AsyncReturnType<typeof getAccountByIdWithAllowedStudies>

export const updateUserPasswordForEmail = async (email: string, password: string) => {
  const signedPassword = await signPassword(password)
  const user = await prismaClient.user.update({
    where: { email },
    data: { resetToken: null, password: signedPassword, status: UserStatus.ACTIVE, updatedAt: new Date() },
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
    where: { email: email.toLowerCase() },
    data: { resetToken, updatedAt: new Date() },
  })


export type OrganizationWithSites = AsyncReturnType<typeof getUserOrganizations>[0]

export const getUserFromUserOrganization = (user: User) =>
  prismaClient.user.findMany({ ...findUserInfo(user), orderBy: { email: 'asc' } })
export type TeamMember = AsyncReturnType<typeof getUserFromUserOrganization>[0]

export const addUser = (user: Prisma.UserCreateInput & { role?: Exclude<Role, 'SUPER_ADMIN'> }) =>
  prismaClient.user.create({ data: user })

export const deleteUserFromOrga = (email: string) =>
  // TODO en attente de réponse sur le status + comment s'y prendre avec orgaVersion est-ce qu'on peut récupérer celle de la session user ? ça permettrait de cibler le bon account
  prismaClient.user.update({
    where: { email },
    data: { status: UserStatus.IMPORTED, organizationId: null },
  })

export const validateUser = (email: string) =>
  prismaClient.user.update({
    where: { email },
    data: { status: UserStatus.VALIDATED, updatedAt: new Date() },
  })

export const hasAccountToValidateInOrganization = async (organizationVersionId: string | null) =>
  organizationVersionId
    ? prismaClient.account.count({
        where: { organizationVersionId, user: { status: UserStatus.PENDING_REQUEST } },
      })
    : 0

export const organizationVersionActiveAccountsCount = async (organizationVersionId: string) =>
  prismaClient.account.count({
    where: { organizationVersionId, user: { status: UserStatus.ACTIVE } },
  })

export const changeStatus = (userId: string, newStatus: UserStatus) =>
  prismaClient.user.update({ where: { id: userId }, data: { status: newStatus } })

export const getUserApplicationSettings = (accountId: string) =>
  prismaClient.userApplicationSettings.upsert({ where: { accountId }, update: {}, create: { accountId } })

export const getUsers = () => prismaClient.user.findMany({ select: { id: true, email: true } })

export const updateUserApplicationSettings = (accountId: string, data: Prisma.UserApplicationSettingsUpdateInput) =>
  prismaClient.userApplicationSettings.update({
    where: { accountId },
    data,
  })
