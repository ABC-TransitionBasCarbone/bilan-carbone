import { getOrganizationVersionById } from '@/db/organization'
import { hasActiveLicenceForFormation } from '@/utils/organization'
import { DeactivatableFeature } from '@prisma/client'
import { UserSession } from 'next-auth'
import { getDeactivableFeatureRestrictions, isDeactivableFeatureActive } from '../serverFunctions/deactivableFeatures'
import { getUserSource } from '../serverFunctions/user'

export const hasLevelForFormation = (user: UserSession) => !!user.level

export const hasAccessToFormation = async (user: UserSession) => {
  const [activeFeature, userSource, restrictions, organizationVersion] = await Promise.all([
    isDeactivableFeatureActive(DeactivatableFeature.Formation),
    getUserSource(),
    getDeactivableFeatureRestrictions(DeactivatableFeature.Formation),
    getOrganizationVersionById(user.organizationVersionId),
  ])

  if (!activeFeature) {
    return false
  }

  if (!userSource.success || !userSource.data || (restrictions?.deactivatedSources || []).includes(userSource.data)) {
    return false
  }

  if ((restrictions?.deactivatedEnvironments || []).includes(user.environment)) {
    return false
  }

  if (!user.organizationVersionId || !organizationVersion) {
    return false
  }

  if (!hasActiveLicenceForFormation(organizationVersion)) {
    return false
  }

  return true
}
