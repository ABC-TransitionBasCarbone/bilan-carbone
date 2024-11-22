import { User } from 'next-auth'
import { getOrganizationById } from '@/db/organization'
import { getUserByEmail } from '@/db/user'

export const checkOrganization = async (userOrganizationId: string | null, organizationId: string) => {
  if (userOrganizationId === organizationId) {
    return true
  }

  const organization = await getOrganizationById(userOrganizationId)
  if (organization && organization.childs.some((child) => child.id === organizationId)) {
    return true
  }

  return false
}

export const canCreateOrganization = async (user: User) => {
  const dbUser = await getUserByEmail(user.email)

  if (!dbUser) {
    return false
  }

  const organization = await getOrganizationById(dbUser.organizationId)
  if (!organization || !organization.isCR) {
    return false
  }

  // TO DO : check potential other rights

  return true
}
