import { getOrganizationById } from '@/db/organization'

export const checkOrganization = async (userOrganizationId: string, organizationId: string) => {
  if (userOrganizationId === organizationId) {
    return true
  }

  const organization = await getOrganizationById(userOrganizationId)
  if (organization && organization.childs.some((child) => child.id === organizationId)) {
    return true
  }

  return false
}
