import { DeactivatableFeature } from '@prisma/client'
import { UserSession } from 'next-auth'
import { getDeactivableFeatureRestrictions, isDeactivableFeatureActive } from '../serverFunctions/deactivableFeatures'
import { getUserSource } from '../serverFunctions/user'

export const hasAccessToFormation = async (user: UserSession) => {
  if (!user.level) {
    return false
  }

  const [activeFeature, userSource, restrictions] = await Promise.all([
    isDeactivableFeatureActive(DeactivatableFeature.Formation),
    getUserSource(),
    getDeactivableFeatureRestrictions(DeactivatableFeature.Formation),
  ])
  if (!activeFeature) {
    return false
  }

  if (!userSource || (restrictions?.deactivatedSources || []).includes(userSource)) {
    return false
  }

  if ((restrictions?.deactivatedEnvironments || []).includes(user.environment)) {
    return false
  }

  return true
}
