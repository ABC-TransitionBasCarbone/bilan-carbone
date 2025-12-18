import { OrganizationVersionWithParentLicence } from '@/db/organization'
import { needsLicenceToUseApp } from '@/services/permissions/environment'
import { isAdmin } from '@/utils/user'
import { Role } from '@prisma/client'
import { UserSession } from 'next-auth'

export const isAdminOnOrga = (
  account: UserSession,
  organizationVersion: {
    id: string
    parentId: string | null
  },
) => isAdmin(account.role) && isInOrgaOrParent(account.organizationVersionId, organizationVersion)

export const isInOrgaOrParent = (
  userOrganizationVersionId: string | null,
  organizationVersion: {
    id: string
    parentId: string | null
  },
) =>
  userOrganizationVersionId &&
  (userOrganizationVersionId === organizationVersion.id || userOrganizationVersionId === organizationVersion.parentId)

export const hasEditionRole = (isCR: boolean, userRole: Role) =>
  isCR ? userRole !== Role.DEFAULT : isAdmin(userRole) || userRole === Role.GESTIONNAIRE

export const canEditOrganizationVersion = (
  account: UserSession,
  organizationVersion?: {
    id: string
    parentId: string | null
  },
) => {
  if (organizationVersion && !isInOrgaOrParent(account.organizationVersionId, organizationVersion)) {
    return false
  }

  const isCR = !!organizationVersion?.parentId && organizationVersion.parentId === account.organizationVersionId
  return hasEditionRole(isCR, account.role)
}

export const hasActiveLicence = (
  organizationVersion: Pick<
    Exclude<OrganizationVersionWithParentLicence, null>,
    'activatedLicence' | 'parent' | 'environment'
  >,
) => {
  if (!needsLicenceToUseApp(organizationVersion.environment)) {
    return true
  }

  const userOrgaVersion = organizationVersion.parent ? organizationVersion.parent : organizationVersion

  return isLicenceActiveForDate(userOrgaVersion.activatedLicence)
}

export const hasActiveLicenceForFormation = (
  organizationVersion: Pick<
    Exclude<OrganizationVersionWithParentLicence, null>,
    'activatedLicence' | 'parent' | 'environment'
  >,
) => {
  const userOrgaVersion = organizationVersion.parent ? organizationVersion.parent : organizationVersion

  return isLicenceActiveForFormation(userOrgaVersion.activatedLicence)
}

const DEFAULT_BLOCKING_DATE = { day: 1, month: 0 }

const parseBlockingDate = (): { day: number; month: number } => {
  const blockingDateStr = process.env.MEMBERSHIP_BLOCKING_DATE
  if (!blockingDateStr) {
    return DEFAULT_BLOCKING_DATE
  }

  const parts = blockingDateStr.split('/')
  if (parts.length !== 2) {
    return DEFAULT_BLOCKING_DATE
  }

  const day = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10) - 1

  if (isNaN(day) || isNaN(month) || month < 0 || month > 11 || day < 1 || day > 31) {
    return DEFAULT_BLOCKING_DATE
  }

  return { day, month }
}

const isBeforeBlockingDate = (now: Date): boolean => {
  const blockingDate = parseBlockingDate()
  const currentMonth = now.getMonth()
  const currentDay = now.getDate()
  return currentMonth < blockingDate.month || (currentMonth === blockingDate.month && currentDay < blockingDate.day)
}

export const isLicenceActiveForDate = (activatedLicence: number[]): boolean => {
  const now = new Date()
  const currentYear = now.getFullYear()
  const previousYear = currentYear - 1

  const hasCurrentYear = activatedLicence.includes(currentYear)
  const hasPreviousYear = activatedLicence.includes(previousYear)

  if (hasCurrentYear) {
    return true
  }

  if (hasPreviousYear) {
    return isBeforeBlockingDate(now)
  }

  return false
}

export const isLicenceActiveForFormation = (activatedLicence: number[]): boolean => {
  const now = new Date()
  const currentYear = now.getFullYear()
  const previousYear = currentYear - 1

  const hasCurrentYear = activatedLicence.includes(currentYear)
  const hasPreviousYear = activatedLicence.includes(previousYear)

  // Before 2025, we don't block access to formations
  if (previousYear >= 2025 && !hasPreviousYear) {
    return false
  }

  if (hasCurrentYear) {
    return true
  }

  return isBeforeBlockingDate(now)
}
