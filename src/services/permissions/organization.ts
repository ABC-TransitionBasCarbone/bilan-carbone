import { getOrganizationById } from '@/db/organization'
import { getUserByEmail } from '@/db/userImport'
import { canEditOrganization, hasEditionRole, isInOrgaOrParent } from '@/utils/organization'
import { User } from 'next-auth'
import { auth } from '../auth'
import { getOrganizationStudiesFromOtherUsers } from '../serverFunctions/study'

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

export const canUpdateOrganization = async (user: User, organizationId: string) => {
  const dbUser = await getUserByEmail(user.email)

  if (!dbUser) {
    return false
  }

  if (!(await isInOrgaOrParentFromId(user.organizationId, organizationId))) {
    return false
  }

  const organization = await getOrganizationById(dbUser.organizationId)
  if (!organization || !canEditOrganization(user, organization)) {
    return false
  }

  return true
}

export const canDeleteOrganization = async (organizationId: string) => {
  const [session, targetOrganization] = await Promise.all([auth(), getOrganizationById(organizationId)])
  if (!session || !session.user || !targetOrganization) {
    return false
  }

  if (
    !hasEditionRole(true, session.user.role) ||
    (await getOrganizationStudiesFromOtherUsers(organizationId, session.user.id))
  ) {
    return false
  }
  return targetOrganization.parentId === session.user.organizationId
}
