import { NOT_AUTHORIZED } from '@/services/permissions/check'
import { getDeactivableFeatureRestrictions } from '@/services/serverFunctions/deactivableFeatures'
import { findUserInfo } from '@/utils/user'
import { Account, DeactivatableFeature, Environment, Prisma, Role, User } from '@prisma/client'
import { UserSession } from 'next-auth'
import { prismaClient } from './client'
import { OrganizationVersionWithOrganizationSelect } from './organization'

export type AccountWithUser = Account & {
  user: User
  organizationVersion: { organizationId: string; environment: Environment }
}

export const AccountWithUserSelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
  importedFileDate: true,
  deactivatableFeatureStatus: true,
  environment: true,
  status: true,
  feedbackDate: true,
  organizationVersionId: true,
  organizationVersion: {
    select: {
      id: true,
      organizationId: true,
      environment: true,
    },
  },
  role: true,
  formationName: true,
  formationStartDate: true,
  formationEndDate: true,
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
      source: true,
      formationFormStartTime: true,
    },
  },
}

export const getAccountByEmailAndOrganizationVersionId = (email: string, organizationVersionId: string | null) => {
  return prismaClient.account.findFirst({
    where: { user: { email }, organizationVersionId },
    select: AccountWithUserSelect,
  })
}

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

  if (account.organizationVersion && account.organizationVersion.isCR) {
    const childOrganizations = await prismaClient.organizationVersion.findMany({
      ...{ select: OrganizationVersionWithOrganizationSelect },
      where: { parentId: account.organizationVersion.id },
    })
    return [account.organizationVersion, ...childOrganizations]
  }

  return account.organizationVersion ? [account.organizationVersion] : []
}

export const getAccountByEmailAndEnvironment = (email: string, environment: Environment) => {
  return prismaClient.account.findFirst({
    where: { user: { email }, environment },
    select: AccountWithUserSelect,
  })
}

export type OrganizationWithSites = AsyncReturnType<typeof getAccountOrganizationVersions>[0]

export const getAccountFromUserOrganization = (user: UserSession) =>
  prismaClient.account.findMany({ ...findUserInfo(user), orderBy: { user: { email: 'asc' } } })
export type TeamMember = AsyncReturnType<typeof getAccountFromUserOrganization>[number]

export const getAccountsFromOrganization = (organizationVersionId: string) =>
  prismaClient.account.findMany({
    select: { user: { select: { email: true, firstName: true, lastName: true } } },
    where: { organizationVersionId },
    orderBy: { user: { email: 'asc' } },
  })

export const addAccount = async (account: Prisma.AccountCreateInput & { role: Exclude<Role, 'SUPER_ADMIN'> }) => {
  const deactivatedFeaturesRestrictions = await getDeactivableFeatureRestrictions(DeactivatableFeature.Creation)
  if (
    deactivatedFeaturesRestrictions?.active &&
    deactivatedFeaturesRestrictions.deactivatedEnvironments.includes(account.environment)
  ) {
    throw new Error(NOT_AUTHORIZED)
  }

  return prismaClient.account.create({
    data: account,
    select: AccountWithUserSelect,
  })
}
export const getAccountsUserLevel = (ids: string[]) =>
  prismaClient.account.findMany({
    where: { id: { in: ids } },
    select: { id: true, user: { select: { level: true } } },
  })

export const getAccountsFromUser = (user: UserSession) =>
  prismaClient.account.findMany({ where: { userId: user.userId } })

export const getAccountsByUserIdsAndEnvironment = (userIds: string[], environment: Environment) =>
  prismaClient.account.findMany({
    where: { userId: { in: userIds }, environment },
    select: {
      id: true,
      user: { select: { id: true } },
    },
  })
