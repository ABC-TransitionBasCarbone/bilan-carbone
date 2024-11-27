import { getOrganizationById } from '@/db/organization'
import { getUserByEmail } from '@/db/user'
import { User } from 'next-auth'
import { UpdateOrganizationCommand } from '../serverFunctions/organization.command'

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

  // TODO : check potential other rights

  return true
}

export const canUpdateOrganization = async (user: User, command: UpdateOrganizationCommand) => {
  const dbUser = await getUserByEmail(user.email)

  if (!dbUser) {
    return false
  }

  if (!checkOrganization(user.organizationId, command.organizationId)) {
    return false
  }

  // TODO : check potential other rights

  return true
}
