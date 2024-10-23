import { getOrganizationById } from '@/db/organization'
import { Level } from '@prisma/client'

export const checkLevel = (userLevel: Level, studyLevel: Level) => {
  switch (studyLevel) {
    case Level.Advanced:
      return userLevel === Level.Advanced
    case Level.Standard:
      return userLevel !== Level.Initial
    default:
      return true
  }
}

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
