import { EmissionFactor, Import, User } from '@prisma/client'
import { isFromEmissionFactorOrganization } from '../serverFunctions/emissionFactor'

export const canReadEmissionFactor = (
  user: User,
  emissionFactor: Pick<EmissionFactor, 'organizationId' | 'importedFrom'>,
) => {
  if (emissionFactor.importedFrom !== Import.Manual) {
    return true
  }

  return user.organizationId === emissionFactor.organizationId
}

export const canCreateEmissionFactor = () => {
  // For now everyone can create an FE
  return true
}

export const canEditEmissionFactor = async (id: string) => {
  return isFromEmissionFactorOrganization(id)
}
