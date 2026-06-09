import { Role } from '@abc-transitionbascarbone/db-common/enums'
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
    select: {
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
          level: true,
          updatedAt: true,
        },
      },
      status: true,
      role: true,
      updatedAt: true,
    },
    orderBy: { user: { email: 'asc' } },
  })
export type TeamMember = AsyncReturnType<typeof getAccountMipFromUserOrganization>[number]

export const changeAccountMipRole = (id: string, role: Role) =>
  prismaClient.accountMip.update({
    data: { role },
    where: { id },
  })
