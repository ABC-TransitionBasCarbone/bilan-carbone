import { sendEmailToAddedUser } from '@/services/serverFunctions/user'
import { userSessionToDbUser } from '@/utils/userAccounts'
import { Prisma } from '@abc-transitionbascarbone/db-common'
import { RoleMip, UserStatus } from '@abc-transitionbascarbone/db-common/enums'
import { NOT_AUTHORIZED } from '@abc-transitionbascarbone/services/permissions/check'
import { AddMemberCommand } from '@abc-transitionbascarbone/services/serverFunctions/user.command'
import { signPassword } from '@abc-transitionbascarbone/utils/auth'
import { UserSession } from 'next-auth'
import { addAccountMip, getAccountMipByEmailAndOrganizationVersionMipId, updateAccountMip } from './accountMip'
import { prismaClient } from './client.server'

export type UserWithAccountsMip = Prisma.UserGetPayload<{ include: { accountsMip: true } }>

export const getUserByEmail = (email: string): Promise<UserWithAccountsMip | null> =>
  prismaClient.user.findUnique({ where: { email }, include: { accountsMip: true } })

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
      accountsMip: true,
    },
    where: { email },
  })

export const updateUserPasswordForEmail = async (email: string, password: string) => {
  const signedPassword = await signPassword(password)
  const user = await prismaClient.user.update({
    where: { email },
    data: { resetToken: null, password: signedPassword },
  })

  if (!user) {
    throw new Error(`User with email ${email} not found`)
  }

  const accountMip = await prismaClient.accountMip.findFirst({
    where: {
      userId: user.id,
    },
  })

  if (!accountMip) {
    throw new Error(`Account with email ${email} not found`)
  }

  const accountsMip = await prismaClient.accountMip.findMany({
    where: {
      userId: user.id,
    },
  })

  if (accountsMip.length > 0) {
    await prismaClient.accountMip.updateMany({
      where: { userId: user.id },
      data: { status: UserStatus.ACTIVE },
    })
  }

  return user
}

export const updateUserResetTokenForEmail = async (email: string, resetToken: string) =>
  prismaClient.user.update({
    where: { email: email.toLowerCase() },
    data: { resetToken },
  })

export const addUser = async (
  newMember: Omit<Prisma.UserCreateInput, 'accountsMip'> & {
    accountsMip: { create: Omit<Prisma.AccountMipCreateInput, 'user'> }
    role?: Exclude<RoleMip, 'SUPER_ADMIN'>
  },
) => {
  return prismaClient.user.create({
    data: newMember,
    select: {
      id: true,
      accountsMip: {
        select: {
          id: true,
        },
      },
    },
  })
}

export const handleAddingUser = async (creator: UserSession, newUser: AddMemberCommand) => {
  const memberExists = await getUserByEmail(newUser.email.toLowerCase())

  const isMemberActiveInSomeEnv = memberExists?.accountsMip.some((a) => a.status === UserStatus.ACTIVE)
  const memberAccountMip = memberExists?.accountsMip[0]

  if (memberAccountMip?.role === RoleMip.SUPER_ADMIN || newUser.role === RoleMip.SUPER_ADMIN) {
    throw new Error(NOT_AUTHORIZED)
  }

  const userFromDb = await getUserByEmail(creator.email)
  if (!userFromDb || !creator.organizationVersionMipId) {
    throw new Error(NOT_AUTHORIZED)
  }

  if (!memberExists) {
    const newMember = {
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email.toLowerCase(),
      level: null,
      source: userFromDb.source,
      accountsMip: {
        create: {
          role: newUser.role as RoleMip,
          status: UserStatus.VALIDATED,
          organizationVersionMipId: creator.organizationVersionMipId,
        },
      },
    }

    await addUser(newMember)
  } else if (!memberAccountMip) {
    await addAccountMip({
      status: isMemberActiveInSomeEnv ? UserStatus.ACTIVE : UserStatus.VALIDATED,
      role: newUser.role as Exclude<RoleMip, 'SUPER_ADMIN'>,
      user: { connect: { id: memberExists.id } },
      organizationVersionMip: { connect: { id: creator.organizationVersionMipId } },
    })
  } else {
    if (memberAccountMip.status === UserStatus.ACTIVE && memberAccountMip.organizationVersionMipId) {
      throw new Error(NOT_AUTHORIZED)
    }

    const updateMember = {
      firstName: newUser.firstName,
      lastName: newUser.lastName,
    }

    const updateMemberAccountMip = {
      status: isMemberActiveInSomeEnv ? UserStatus.ACTIVE : UserStatus.VALIDATED,
      role: memberAccountMip.role,
      organizationVersionMip: { connect: { id: creator.organizationVersionMipId } },
    }
    await updateAccountMip(memberAccountMip.id, updateMemberAccountMip, updateMember)
  }

  await sendEmailToAddedUser(
    newUser.email.toLowerCase(),
    userSessionToDbUser(creator),
    newUser.firstName,
    creator.organizationVersionMipId,
  )
}

export const deleteAccountMipFromOrgaVersionMip = async (email: string, organizationVersionMipId: string | null) => {
  const accountMip = await getAccountMipByEmailAndOrganizationVersionMipId(email, organizationVersionMipId)
  if (!accountMip) {
    return null
  }

  await prismaClient.accountMip.update({
    where: { id: accountMip.id },
    data: { organizationVersionMipId: null, status: UserStatus.IMPORTED },
  })
}

export const validateUser = (accountMipId: string) =>
  prismaClient.accountMip.update({
    where: { id: accountMipId },
    data: { status: UserStatus.VALIDATED },
  })
