import { AccountWithUser } from '@/types/account.types'
import type { OrganizationVersion, User } from '@abc-transitionbascarbone/db-common'
import { UserSession } from 'next-auth'

// Type predicate so checking `organizationVersion` narrows `account` itself, not just the property access
export const hasOrganizationVersion = <T extends { organizationVersion: Partial<OrganizationVersion> | null }>(
  account: T,
): account is T & { organizationVersion: NonNullable<T['organizationVersion']> } => !!account.organizationVersion

export const accountWithUserToUserSession = (
  account: Pick<AccountWithUser, 'id' | 'role' | 'organizationVersionId' | 'organizationVersion'> & {
    user: Pick<AccountWithUser['user'], 'id' | 'email' | 'firstName' | 'lastName' | 'level'>
  },
): UserSession => ({
  id: account.user.id,
  accountId: account.id,
  userId: account.user.id,
  role: account.role,
  organizationVersionId: account.organizationVersionId,
  email: account.user.email,
  firstName: account.user.firstName,
  lastName: account.user.lastName,
  level: account.user.level,
  environment: account.organizationVersion?.environment,
  organizationId: account.organizationVersion?.organizationId ?? null,
})

export const userSessionToDbUser = (
  userSession: UserSession,
): Omit<User, 'createdAt' | 'updatedAt' | 'password' | 'resetToken' | 'source' | 'formationFormStartTime'> => ({
  id: userSession.userId,
  email: userSession.email,
  firstName: userSession.firstName,
  lastName: userSession.lastName,
  level: userSession.level,
})
