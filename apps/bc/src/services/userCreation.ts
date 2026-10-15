import { addAccount as addAccountToDb } from '@/db/account'
import { getFeatureRestictions } from '@/db/deactivableFeatures'
import { addUser as addUserToDb } from '@/db/user'
import { DeactivatableFeature } from '@abc-transitionbascarbone/common/db/enums'
import { NOT_AUTHORIZED } from '@abc-transitionbascarbone/common/services/permissions/check'

export const addAccount = async (account: Parameters<typeof addAccountToDb>[0]) => {
  const restrictions = await getFeatureRestictions(DeactivatableFeature.Creation)
  if (restrictions?.active && restrictions.deactivatedEnvironments.includes(account.environment)) {
    console.error('addAccount', account.environment)
    throw new Error(NOT_AUTHORIZED)
  }
  return addAccountToDb(account)
}

export const addUser = async (newMember: Parameters<typeof addUserToDb>[0]) => {
  const restrictions = await getFeatureRestictions(DeactivatableFeature.Creation)
  const environment = newMember.accounts.create.environment
  if (restrictions?.active && (!environment || restrictions.deactivatedEnvironments.includes(environment))) {
    console.error('addUser', newMember.email, environment)
    throw new Error(NOT_AUTHORIZED)
  }
  return addUserToDb(newMember)
}
