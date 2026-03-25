import { getOrganizationVersionForRightsCheck } from '@/db/organization'
import { hasActiveLicence } from '@/utils/organization'

export const canCreateEmissionFactor = async (organizationVersionId: string) => {
  const organizationVersion = await getOrganizationVersionForRightsCheck(organizationVersionId)
  return organizationVersion && hasActiveLicence(organizationVersion)
}
