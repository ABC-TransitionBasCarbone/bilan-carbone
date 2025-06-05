import { environmentsWithChecklist } from '@/constants/environments'
import { signPassword } from '@/services/auth'
import { AuthorizedInOrgaUserStatus } from '@/services/users'
import { Prisma, Role, UserChecklist, UserStatus } from '@prisma/client'
import { getAccountByEmailAndEnvironment, getAccountByEmailAndOrganizationVersionId } from './account'
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
    },
    where: { email },
  })

export const getUserSourceById = (id: string) =>
  prismaClient.user.findUnique({ where: { id }, select: { source: true } })

export const getUserById = (id: string) =>
  prismaClient.user.findUnique({ where: { id }, select: { firstName: true, lastName: true, email: true } })

export const getUserWithAccountsAndOrganizationsById = (id: string) =>
  prismaClient.user.findUnique({
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

export const getAccountByIdWithAllowedStudies = (id: string) =>
  prismaClient.account.findUnique({ where: { id }, include: { allowedStudies: true, contributors: true } })

export type UserWithAllowedStudies = AsyncReturnType<typeof getAccountByIdWithAllowedStudies>

export const updateUserPasswordForEmail = async (email: string, password: string) => {
  const signedPassword = await signPassword(password)
  const user = await prismaClient.user.update({
    where: { email },
    data: { resetToken: null, password: signedPassword },
  })

  const accounts = await prismaClient.account.findMany({
    where: {
      userId: user.id,
      environment: { in: environmentsWithChecklist },
      status: { in: AuthorizedInOrgaUserStatus },
    },
  })

  if (accounts.length > 0) {
    await Promise.all(
      accounts.map((account) =>
        prismaClient.userCheckedStep.upsert({
          where: { accountId_step: { accountId: account.id, step: UserChecklist.CreateAccount } },
          update: {},
          create: { accountId: account.id, step: UserChecklist.CreateAccount },
        }),
      ),
    )
  }

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
    data: { organizationVersionId: null, status: UserStatus.IMPORTED },
  })
}

export const validateUser = (accountId: string) =>
  prismaClient.account.update({
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

export const changeStatus = (accountId: string, newStatus: UserStatus) =>
  prismaClient.account.update({ where: { id: accountId }, data: { status: newStatus } })

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
  prismaClient.user.findUnique({ where: { email }, include: { accounts: true } })

export const updateUser = (
  userId: string,
  data: Partial<Prisma.UserCreateInput & { role: Exclude<Role, 'SUPER_ADMIN'> | undefined }>,
) =>
  prismaClient.user.update({
    where: { id: userId },
    data,
  })

export const createUsers = (users: Prisma.UserCreateManyInput[]) =>
  prismaClient.user.createMany({ data: users, skipDuplicates: true })

export const createUsersWithAccount = async (
  users: (Prisma.UserCreateManyInput & { account: Prisma.AccountCreateInput })[],
) => {
  const newUsers = await prismaClient.user.createMany({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    data: users.map(({ account, ...user }) => user),
    skipDuplicates: true,
  })

  const emails = users.map(({ email }) => email)

  const createdUsers = await prismaClient.user.findMany({
    where: { email: { in: emails } },
  })

  let newAccountCount = 0
  for (const user of createdUsers) {
    const originalUsers = users.filter((u) => u.email === user.email)
    if (!originalUsers.length) {
      throw new Error(`No account info for user ${user.email}`)
    }

    for (const originalUser of originalUsers) {
      const accoutAlreadyExists = await getAccountByEmailAndEnvironment(user.email, originalUser.account.environment)
      if (accoutAlreadyExists) {
        continue
      }
      await prismaClient.account.create({
        data: {
          ...originalUser.account,
          user: {
            connect: { id: user.id },
          },
        },
      })
      newAccountCount++
    }
  }

  return { newUsers, newAccounts: { count: newAccountCount } }
}

export const updateAccount = (
  accountId: string,
  data: Partial<Prisma.AccountUpdateInput & { role: Exclude<Role, 'SUPER_ADMIN'> | undefined }>,
  userData: Partial<Prisma.UserUpdateInput>,
) =>
  prismaClient.account.update({
    where: { id: accountId },
    data: {
      ...data,
      user: { update: { ...userData } },
    },
  })

export const resetUserFeedbackDate = async () => prismaClient.user.updateMany({ data: { feedbackDate: null } })

export const getUserFeedbackDate = async (userId: string) =>
  prismaClient.user.findUnique({ select: { feedbackDate: true }, where: { id: userId } })

export const updateUserFeedbackDate = async (userId: string, feedbackDate: Date) =>
  prismaClient.user.update({ where: { id: userId }, data: { feedbackDate } })
