import { isFromEmissionFactorOrganization } from '../serverFunctions/emissionFactor'
import { Account, EmissionFactor, Import } from '@prisma/client'

export const canReadEmissionFactor = (
  account: Account,
  emissionFactor: Pick<EmissionFactor, 'organizationId' | 'importedFrom'>,
) => {
  if (emissionFactor.importedFrom !== Import.Manual) {
    return true
  }

  return account.organizationId === emissionFactor.organizationId
}

export const canCreateEmissionFactor = () => {
  // For now everyone can create an FE
  return true
}

export const canEditEmissionFactor = async (id: string) => {
  return isFromEmissionFactorOrganization(id)
}
