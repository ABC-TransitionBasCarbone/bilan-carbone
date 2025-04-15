import { DeactivatableFeature, UserSource } from '@prisma/client'
import { isDeactivableFeatureActive } from '../serverFunctions/deactivableFeatures'
import { UserSession } from 'next-auth'
import { getUserSource } from '../serverFunctions/user'

export const hasAccessToFormation = async (user: UserSession) => {
  if (!user.level) {
    return false
  }

  if ((await getUserSource()) !== UserSource.CRON) {
    return false
  }

  if (!(await isDeactivableFeatureActive(DeactivatableFeature.Formation))) {
    return false
  }

  return true
}
