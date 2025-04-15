import { findUserInfo } from '@/utils/user'
import { Account, Role, User } from '@prisma/client'
import { UserSession } from 'next-auth'
import { prismaClient } from './client'
import { OrganizationVersionWithOrganizationSelect } from './organization'

export type AccountWithUser = Account & { user: User; organizationVersion: { organizationId: string } }

export const AccountWithUserSelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
  importedFileDate: true,
  deactivatableFeatureStatus: true,
  organizationVersionId: true,
  organizationVersion: {
    select: {
      id: true,
      organizationId: true,
    },
  },
  role: true,
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      level: true,
      email: true,
      createdAt: true,
      updatedAt: true,
      password: true,
      resetToken: true,
      status: true,
      source: true,
    },
  },
}

export const getAccountByEmailAndOrganizationVersionId = (email: string, organizationVersionId: string | null) =>
  prismaClient.account.findFirst({
    where: { user: { email }, organizationVersionId },
    select: AccountWithUserSelect,
  })

export const getAccountById = (id: string) =>
  prismaClient.account.findUnique({
    where: { id },
    select: AccountWithUserSelect,
  })

export const changeAccountRole = (id: string, role: Role) =>
  prismaClient.account.update({
    data: { role },
    where: { id },
  })

export const getAccountOrganizationVersions = async (accountId: string) => {
  if (!accountId) {
    return []
  }

  const account = await prismaClient.account.findUnique({
    select: {
      role: true,
      organizationVersion: { select: OrganizationVersionWithOrganizationSelect },
    },
    where: { id: accountId },
  })

  if (!account) {
    return []
  }

  // TODO est-ce ok comme façon de récupérer les organizations ?
  if (account.organizationVersion && account.organizationVersion.isCR) {
    const childOrganizations = await prismaClient.organizationVersion.findMany({
      ...{ select: OrganizationVersionWithOrganizationSelect },
      where: { organization: { parentId: account.organizationVersion.organizationId } },
    })
    return [account.organizationVersion, ...childOrganizations]
  }

  return account.organizationVersion ? [account.organizationVersion] : []
}

export type OrganizationWithSites = AsyncReturnType<typeof getAccountOrganizationVersions>[0]

export const accountWithUserToUserSession = (account: AccountWithUser) =>
  ({
    id: account.user.id,
    accountId: account.id,
    userId: account.user.id,
    role: account.role,
    organizationVersionId: account.organizationVersionId,
    email: account.user.email,
    firstName: account.user.firstName,
    lastName: account.user.lastName,
    level: account.user.level,
  }) as UserSession

export const userSessionToDbUser = (userSession: UserSession) =>
  ({
    id: userSession.userId,
    organizationVersionId: userSession.organizationVersionId,
    email: userSession.email,
    firstName: userSession.firstName,
    lastName: userSession.lastName,
    level: userSession.level,
  }) as unknown as User

export const getAccountFromUserOrganization = (user: UserSession) =>
  prismaClient.account.findMany({ ...findUserInfo(user), orderBy: { user: { email: 'asc' } } })
export type TeamMember = AsyncReturnType<typeof getAccountFromUserOrganization>[0]
