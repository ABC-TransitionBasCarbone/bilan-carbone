import { AccountWithUser } from '@/db/account'
import { getOrganizationVersionById } from '@/db/organization'
import { hasActiveLicence } from '@/utils/organization'
import { EmissionFactor, Environment, Import, Level } from '@prisma/client'
import { isFromEmissionFactorOrganization } from '../serverFunctions/emissionFactor'

export const canReadEmissionFactor = (
  account: AccountWithUser,
  emissionFactor: Pick<EmissionFactor, 'organizationId' | 'importedFrom'>,
) => {
  if (emissionFactor.importedFrom !== Import.Manual) {
    return true
  }

  return account.organizationVersion.organizationId === emissionFactor.organizationId
}

export const canCreateEmissionFactor = async (organizationVersionId: string) => {
  const organizationVersion = await getOrganizationVersionById(organizationVersionId)
  return organizationVersion && hasActiveLicence(organizationVersion)
}

export const canEditEmissionFactor = async (id: string) => {
  const emissionFactorRequest = await isFromEmissionFactorOrganization(id)
  return emissionFactorRequest.success && !!emissionFactorRequest.data
}

export const hasAccessToEmissionFactors = (environment: Environment, userLevel: Level | null) =>
  environment !== Environment.TILT || userLevel
