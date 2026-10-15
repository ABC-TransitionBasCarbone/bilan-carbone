import { Prisma } from '@abc-transitionbascarbone/common/db'
import { Role, UserChecklist, UserStatus } from '@abc-transitionbascarbone/common/db/enums'
import { getAccountByEmailAndOrganizationVersionId } from './account'
import { prismaClient } from './client.server'

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
    },
    where: { email },
  })

export const getUserSourceById = (id: string) =>
  prismaClient.user.findUnique({ where: { id }, select: { source: true } })

export const getUserById = (id: string) =>
  prismaClient.user.findUnique({ where: { id }, select: { firstName: true, lastName: true, email: true, level: true } })

export const getUserWithAccountsAndOrganizationsById = async (id: string) => {
  const user = await prismaClient.user.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      accounts: {
        select: {
          id: true,
          environment: true,
          status: true,
          organizationVersion: {
            select: {
              id: true,
              environment: true,
              activatedLicence: true,
              organization: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  })

  if (!user) {
    throw new Error(`User with id ${id} not found`)
  }

  const userWithOnlyActiveAccounts = { ...user, accounts: user.accounts.filter((a) => a.status === UserStatus.ACTIVE) }

  return userWithOnlyActiveAccounts
}

export const getAccountByIdWithAllowedStudies = (id: string) =>
  prismaClient.account.findUnique({ where: { id }, include: { allowedStudies: true, contributors: true } })

export type UserWithAllowedStudies = AsyncReturnType<typeof getAccountByIdWithAllowedStudies>

export const deleteUserFromOrga = async (email: string, organizationVersionId: string | null) => {
  const account = await getAccountByEmailAndOrganizationVersionId(email, organizationVersionId)
  if (!account) {
    return null
  }

  await prismaClient.account.update({
    where: { id: account.id },
    data: { organizationVersionId: null, status: UserStatus.IMPORTED },
  })
}

export const validateUser = (accountId: string, transaction: Prisma.TransactionClient = prismaClient) =>
  transaction.account.update({
    where: { id: accountId },
    data: { status: UserStatus.VALIDATED },
  })

export const hasAccountToValidateInOrganization = async (organizationVersionId: string | null) =>
  organizationVersionId
    ? prismaClient.account.count({
      where: { organizationVersionId, status: UserStatus.PENDING_REQUEST },
    })
    : 0

export const organizationVersionActiveAccountsCount = async (organizationVersionId: string) =>
  prismaClient.account.count({
    where: { organizationVersionId, status: UserStatus.ACTIVE },
  })

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

export const getUserByEmail = (email: string) =>
  prismaClient.user.findUnique({ where: { email }, include: { accounts: { include: { organizationVersion: true } } } })

export const updateUser = (userId: string, data: Partial<Prisma.UserCreateInput>) =>
  prismaClient.user.update({
    where: { id: userId },
    data,
  })

export const createUsers = (data: Prisma.UserCreateManyInput[]) =>
  prismaClient.user.createMany({ data, skipDuplicates: true })

export const getUsersByEmails = (emails: string[]) =>
  prismaClient.user.findMany({ where: { email: { in: emails } }, select: { id: true, email: true } })

export const updateAccount = (
  accountId: string,
  data: Partial<Prisma.AccountUpdateInput & { role: Exclude<Role, 'SUPER_ADMIN'> | undefined }>,
  userData?: Partial<Prisma.UserUpdateInput>,
  transaction: Prisma.TransactionClient = prismaClient,
) =>
  transaction.account.update({
    where: { id: accountId },
    data: {
      ...data,
      user: { update: { ...userData } },
    },
  })

export const resetUserFeedbackDate = async () => prismaClient.account.updateMany({ data: { feedbackDate: null } })

export const getUserFeedbackDate = async (accountId: string) =>
  prismaClient.account.findUnique({ select: { feedbackDate: true }, where: { id: accountId } })

export const updateUserFeedbackDate = async (accountId: string, feedbackDate: Date) =>
  prismaClient.account.update({ where: { id: accountId }, data: { feedbackDate } })

export const addUser = async (
  newMember: Omit<Prisma.UserCreateInput, 'accounts'> & {
    accounts: { create: Omit<Prisma.AccountCreateInput, 'user'> }
    role?: Exclude<Role, 'SUPER_ADMIN'>
  },
) => {
  return prismaClient.user.create({
    data: newMember,
    select: {
      id: true,
      accounts: {
        select: {
          id: true,
          environment: true,
        },
      },
    },
  })
}
