import type { AccountWithUser } from '@/types/account.types'
import type { EmissionFactor } from '@abc-transitionbascarbone/common/db'
import { Import } from '@abc-transitionbascarbone/common/db/enums'

export const canReadEmissionFactor = (
  account: AccountWithUser,
  emissionFactor: Pick<EmissionFactor, 'organizationId' | 'importedFrom'>,
) => {
  if (emissionFactor.importedFrom !== Import.Manual) {
    return true
  }

  if (!account.organizationVersion) {
    return false
  }

  return account.organizationVersion.organizationId === emissionFactor.organizationId
}
