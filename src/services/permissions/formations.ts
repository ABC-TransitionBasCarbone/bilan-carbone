import { DeactivatableFeature } from '@prisma/client'
import { User } from 'next-auth'
import { isFeatureActive } from '../serverFunctions/deactivableFeatures'

export const hasAccessToFormation = async (user: User) => {
  if (!user.level) {
    return false
  }

  if (!(await isFeatureActive(DeactivatableFeature.Formation))) {
    return false
  }

  return true
}
