import { DeactivatableFeature, UserSource } from '@prisma/client'
import { UserSession } from 'next-auth'
import { isDeactivableFeatureActive } from '../serverFunctions/deactivableFeatures'
import { getUserSource } from '../serverFunctions/user'

export const hasAccessToFormation = async (user: UserSession) => {
  if (!user.level) {
    return false
  }

  const userSource = await getUserSource()

  if (!userSource.success || userSource.data !== UserSource.CRON) {
    return false
  }

  if (!(await isDeactivableFeatureActive(DeactivatableFeature.Formation))) {
    return false
  }

  return true
}
