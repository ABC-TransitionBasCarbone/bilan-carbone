import { AccountWithUser } from '@/db/account'
import { EmissionFactor, Import } from '@prisma/client'
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

export const canCreateEmissionFactor = () => {
  // For now everyone can create an FE
  return true
}

export const canEditEmissionFactor = async (id: string) => {
  const emissionFactorRequest = await isFromEmissionFactorOrganization(id)
  return emissionFactorRequest.success && !!emissionFactorRequest.data
}
