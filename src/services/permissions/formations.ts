import { DeactivatableFeature, UserSource } from '@prisma/client'
import { User } from 'next-auth'
import { isFeatureActive } from '../serverFunctions/deactivableFeatures'
import { getUserSource } from '../serverFunctions/user'

export const hasAccessToFormation = async (user: User) => {
  if (!user.level) {
    return false
  }

  if ((await getUserSource()) !== UserSource.CRON) {
    return false
  }

  if (!(await isFeatureActive(DeactivatableFeature.Formation))) {
    return false
  }

  return true
}
