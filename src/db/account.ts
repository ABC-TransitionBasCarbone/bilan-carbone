import { findUserInfo } from '@/services/permissions/user'
import { Account, Role, User } from '@prisma/client'
import { UserSession } from 'next-auth'
import { prismaClient } from './client'

export type AccountWithUser = Account & { user: User }

export const AccountWithUserSelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
  importedFileDate: true,
  organizationId: true,
  role: true,
  environment: true,
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
    },
  },
}

export const getAccountByEmailAndOrganizationId = (email: string, organizationId: string) =>
  prismaClient.account.findFirst({
    where: { user: { email }, organizationId },
    select: AccountWithUserSelect,
  })

export const getAccountById = (id: string) =>
  prismaClient.account.findUnique({
    where: { id },
    select: AccountWithUserSelect,
  })

export const changeAccountRole = (id: string, role: Role) =>
  prismaClient.account.update({
    data: { role, updatedAt: new Date() },
    where: { id },
  })

export const getAccountOrganizations = async (accountId: string) => {
  if (!accountId) {
    return []
  }

  const organizationSelect = {
    include: { sites: { select: { name: true, etp: true, ca: true, id: true, postalCode: true, city: true } } },
  }

  const account = await prismaClient.account.findUnique({
    select: {
      role: true,
      organization: organizationSelect,
    },
    where: { id: accountId },
  })

  if (!account) {
    return []
  }
  if (account.organization && account.organization.isCR) {
    const childOrganizations = await prismaClient.organization.findMany({
      ...organizationSelect,
      where: { parentId: account.organization.id },
    })
    return [account.organization, ...childOrganizations]
  }

  return account.organization ? [account.organization] : []
}

export type OrganizationWithSites = AsyncReturnType<typeof getAccountOrganizations>[0]

export const accountWithUserToUserSession = (account: AccountWithUser) =>
  ({
    id: account.user.id,
    accountId: account.id,
    userId: account.user.id,
    role: account.role,
    organizationId: account.organizationId,
    email: account.user.email,
    firstName: account.user.firstName,
    lastName: account.user.lastName,
    level: account.user.level,
  }) as UserSession

export const userSessionToDbUser = (userSession: UserSession) =>
  ({
    id: userSession.userId,
    organizationId: userSession.organizationId,
    email: userSession.email,
    firstName: userSession.firstName,
    lastName: userSession.lastName,
    level: userSession.level,
  }) as unknown as User

export const getAccountFromUserOrganization = (user: UserSession) =>
  prismaClient.account.findMany({ ...findUserInfo(user), orderBy: { user: { email: 'asc' } } })
export type TeamMember = AsyncReturnType<typeof getAccountFromUserOrganization>[0]
