import { getDeactivableFeatureRestrictions } from '@/services/serverFunctions/deactivableFeatures'
import { findUserInfo } from '@/utils/user'
import type { Prisma } from '@abc-transitionbascarbone/db-common'
import { DeactivatableFeature, Environment, Role, UserStatus } from '@abc-transitionbascarbone/db-common/enums'
import { NOT_AUTHORIZED } from '@abc-transitionbascarbone/services/permissions/check'
import { UserSession } from 'next-auth'
import { AccountWithUserSelect } from './account.select'
import { prismaClient } from './client.server'
import { OrganizationVersionWithOrganizationSelect } from './organization.select'

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

export const getAccountsFromOrganizationForActivation = (organizationVersionId: string) =>
  prismaClient.account.findMany({
    select: {
      id: true,
      role: true,
      status: true,
      updatedAt: true,
      user: { select: { email: true, firstName: true, lastName: true } },
    },
    where: { organizationVersionId },
    orderBy: { updatedAt: 'desc' },
  })

export const handoffOrganizationActivationReservation = async (
  currentAccountId: string,
  organizationVersionId: string,
  reservedAccountId: string,
  reservedRole: Role,
  reservedUpdatedAt: Date,
) =>
  prismaClient.$transaction(async (transaction) => {
    const [currentAccount, reservedAccount, activeAccountsCount] = await Promise.all([
      transaction.account.findUnique({
        where: { id: currentAccountId },
        select: { organizationVersionId: true },
      }),
      transaction.account.findUnique({
        where: { id: reservedAccountId },
        select: { organizationVersionId: true, role: true, status: true, updatedAt: true },
      }),
      transaction.account.count({
        where: { organizationVersionId, status: UserStatus.ACTIVE },
      }),
    ])

    if (
      !currentAccount ||
      currentAccount.organizationVersionId !== organizationVersionId ||
      !reservedAccount ||
      reservedAccount.organizationVersionId !== organizationVersionId ||
      reservedAccount.status === UserStatus.ACTIVE ||
      reservedAccount.role !== reservedRole ||
      reservedAccount.updatedAt.getTime() !== reservedUpdatedAt.getTime() ||
      activeAccountsCount > 0
    ) {
      return false
    }

    await transaction.account.update({
      where: { id: reservedAccountId },
      data: {
        feedbackDate: null,
        formationEndDate: null,
        formationName: null,
        formationStartDate: null,
        importedFileDate: null,
        organizationVersion: { disconnect: true },
        role: Role.DEFAULT,
        status: UserStatus.IMPORTED,
      },
    })

    await transaction.account.update({
      where: { id: currentAccountId },
      data: { role: reservedRole },
    })

    return true
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
