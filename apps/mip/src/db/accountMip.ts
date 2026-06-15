import { canEditMemberRole } from '@/utils/user'
import { Prisma } from '@abc-transitionbascarbone/db-common'
import { findUserInfoSelect } from '@abc-transitionbascarbone/db-common/db'
import { Role, UserStatus } from '@abc-transitionbascarbone/db-common/enums'
import { UserSession } from 'next-auth'
import { AccountMipWithUserSelect } from './accountMip.select'
import { prismaClient } from './client.server'

export const getAccountMipByEmailAndOrganizationVersionMipId = (
  email: string,
  organizationVersionMipId: string | null,
) => {
  return prismaClient.accountMip.findFirst({
    where: { user: { email }, organizationVersionMipId },
    select: AccountMipWithUserSelect,
  })
}

export const getAccountMipById = (id: string) =>
  prismaClient.accountMip.findUnique({
    where: { id },
    select: AccountMipWithUserSelect,
  })

export const getAccountMipFromUserOrganization = (user: UserSession) =>
  prismaClient.accountMip.findMany({
    ...findUserInfoSelect(),
    where: canEditMemberRole(user)
      ? { organizationVersionMipId: user.organizationVersionMipId }
      : { status: UserStatus.ACTIVE, organizationVersionMipId: user.organizationVersionMipId },
    orderBy: { user: { email: 'asc' } },
  })
export type TeamMember = AsyncReturnType<typeof getAccountMipFromUserOrganization>[number]

export const changeAccountMipRole = (id: string, role: Role) =>
  prismaClient.accountMip.update({
    data: { role },
    where: { id },
  })

export const updateAccountMip = (
  accountMipId: string,
  data: Partial<Prisma.AccountMipUpdateInput & { role: Exclude<Role, 'SUPER_ADMIN'> | undefined }>,
  userData?: Partial<Prisma.UserUpdateInput>,
) =>
  prismaClient.accountMip.update({
    where: { id: accountMipId },
    data: {
      ...data,
      user: { update: { ...userData } },
    },
  })
