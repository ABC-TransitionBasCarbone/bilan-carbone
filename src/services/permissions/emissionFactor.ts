import { isFromEmissionFactorOrganization } from '../serverFunctions/emissionFactor'
import { EmissionFactor, Import } from '@prisma/client'
import { AccountWithUser } from '@/db/account'

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
  return isFromEmissionFactorOrganization(id)
}
