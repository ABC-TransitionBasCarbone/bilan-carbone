import { getOrganizationById } from '@/db/organization'
import { getUserByEmail } from '@/db/user'
import { canEditOrganization, isInOrgaOrParent } from '@/utils/onganization'
import { User } from 'next-auth'
import { UpdateOrganizationCommand } from '../serverFunctions/organization.command'

export const isInOrgaOrParentFromId = async (userOrganizationId: string | null, organizationId: string) => {
  if (userOrganizationId === organizationId) {
    return true
  }

  const organization = await getOrganizationById(organizationId)
  return organization && isInOrgaOrParent(userOrganizationId, organization)
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

  return true
}

export const canUpdateOrganization = async (user: User, command: UpdateOrganizationCommand) => {
  const dbUser = await getUserByEmail(user.email)

  if (!dbUser) {
    return false
  }

  if (!isInOrgaOrParentFromId(user.organizationId, command.organizationId)) {
    return false
  }

  const organization = await getOrganizationById(dbUser.organizationId)
  if (!organization || !canEditOrganization(user, organization)) {
    return false
  }

  return true
}
