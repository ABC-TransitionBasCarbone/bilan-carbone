import type { AccountWithUser } from '@/db/account'
import type { EmissionFactor } from '@repo/db-common'
import { Import } from '@repo/db-common/enums'
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

export const canEditEmissionFactor = async (id: string) => {
  const emissionFactorRequest = await isFromEmissionFactorOrganization(id)
  return emissionFactorRequest.success && !!emissionFactorRequest.data
}
