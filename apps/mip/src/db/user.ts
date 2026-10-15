import { Prisma } from '@abc-transitionbascarbone/common/db'
import { RoleMip, UserStatus } from '@abc-transitionbascarbone/common/db/enums'
import { getAccountMipByEmailAndOrganizationVersionMipId } from './accountMip'
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
