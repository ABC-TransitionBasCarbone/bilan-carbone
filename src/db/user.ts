import { signPassword } from '@/services/auth'
import { Prisma, Role, UserChecklist, UserStatus } from '@prisma/client'
import { getAccountByEmailAndOrganizationVersionId } from './account'
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
    data: { resetToken: null, password: signedPassword, status: UserStatus.ACTIVE },
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
    data: { resetToken },
  })

export const addUser = (user: Prisma.UserCreateInput & { role?: Exclude<Role, 'SUPER_ADMIN'> }) =>
  prismaClient.user.create({
    data: user,
    select: {
      accounts: {
        select: {
          id: true,
        },
      },
    },
  })

export const deleteUserFromOrga = async (email: string, organizationVersionId: string | null) => {
  const account = await getAccountByEmailAndOrganizationVersionId(email, organizationVersionId)
  if (!account) {
    return null
  }

  await prismaClient.account.update({
    where: { id: account.id },
    data: { organizationVersionId: null },
  })

  return prismaClient.user.update({
    where: { email },
    data: { status: UserStatus.IMPORTED },
  })
}

export const validateUser = (email: string) =>
  prismaClient.user.update({
    where: { email },
    data: { status: UserStatus.VALIDATED },
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

export const getUsersCheckedSteps = async (accountId: string) =>
  prismaClient.userCheckedStep.findMany({ where: { accountId } })

export const finalizeUserChecklist = async (accountId: string) =>
  prismaClient.userCheckedStep.create({
    data: { accountId, step: UserChecklist.Completed },
  })

export const createOrUpdateUserCheckedStep = async (accountId: string, step: UserChecklist) =>
  prismaClient.userCheckedStep.upsert({
    where: { accountId_step: { accountId, step } },
    update: {},
    create: { accountId, step },
  })

export const getUserFormationFormStart = async (userId: string) =>
  (await prismaClient.user.findUnique({ where: { id: userId }, select: { formationFormStartTime: true } }))
    ?.formationFormStartTime

export const startUserFormationForm = async (userId: string, date: Date) =>
  prismaClient.user.update({ where: { id: userId }, data: { formationFormStartTime: date } })

export const updateUserApplicationSettings = (accountId: string, data: Prisma.UserApplicationSettingsUpdateInput) =>
  prismaClient.userApplicationSettings.update({
    where: { accountId },
    data,
  })

export const getUserByIdWithAccounts = (id: string) =>
  prismaClient.user.findUnique({ where: { id }, include: { accounts: true } })

export type UserWithAccounts = AsyncReturnType<typeof getUserByIdWithAccounts>
