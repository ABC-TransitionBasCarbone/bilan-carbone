import { AccountWithUser } from '@/db/account'
import { EmissionFactor, Import } from '@prisma/client'

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
