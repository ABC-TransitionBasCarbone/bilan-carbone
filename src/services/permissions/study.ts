import { getOrganizationById } from '@/db/organization'
import { Level } from '@prisma/client'
import { getAllowedLevels } from '../study'

export const checkLevel = (userLevel: Level, studyLevel: Level) => getAllowedLevels(studyLevel).includes(userLevel)

export const checkOrganization = async (userOrganizationId: string, organizationId: string) => {
  if (userOrganizationId === organizationId) {
    return true
  }

  const organization = await getOrganizationById(organizationId)
  if (organization && organization.childs.some((child) => child.id === userOrganizationId)) {
    return true
  }

  return false
}
