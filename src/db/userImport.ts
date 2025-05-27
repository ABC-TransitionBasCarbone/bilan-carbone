// TODO : merge this file with user.ts after fixed aliases imports from script files
import { Prisma, Role } from '@prisma/client'
import { prismaClient } from './client'

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
    const originalUser = users.find((u) => u.email === user.email)
    if (!originalUser) {
      throw new Error(`No account info for user ${user.email}`)
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

  return { newUsers, newAccounts: { count: newAccountCount } }
}

export const updateAccount = (
  accountId: string,
  data: Partial<Prisma.AccountCreateInput & { role: Exclude<Role, 'SUPER_ADMIN'> | undefined }>,
  userData: Prisma.UserCreateInput,
) =>
  prismaClient.account.update({
    where: { id: accountId },
    data: {
      ...data,
      user: {
        update: {
          ...userData,
        },
      },
    },
  })
