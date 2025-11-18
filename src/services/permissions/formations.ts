import { DeactivatableFeature, Environment } from '@prisma/client'
import { UserSession } from 'next-auth'
import { getDeactivableFeatureRestrictions, isDeactivableFeatureActive } from '../serverFunctions/deactivableFeatures'
import { getUserSource } from '../serverFunctions/user'

export const hasLevelForFormation = (user: UserSession) => !!user.level

export const hasAccessToFormation = async (environment: Environment) => {
  const [activeFeature, userSource, restrictions] = await Promise.all([
    isDeactivableFeatureActive(DeactivatableFeature.Formation),
    getUserSource(),
    getDeactivableFeatureRestrictions(DeactivatableFeature.Formation),
  ])
  if (!activeFeature) {
    return false
  }

  if (!userSource.success || !userSource.data || (restrictions?.deactivatedSources || []).includes(userSource.data)) {
    return false
  }

  if ((restrictions?.deactivatedEnvironments || []).includes(environment)) {
    return false
  }

  return true
}
