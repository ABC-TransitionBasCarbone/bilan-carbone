import { AccountWithUser } from '@/db/account'
import { Environment, User } from '@prisma/client'
import { UserSession } from 'next-auth'

export const accountWithUserToUserSession = (account: AccountWithUser) =>
  ({
    id: account.user.id,
    accountId: account.id,
    userId: account.user.id,
    role: account.role,
    organizationVersionId: account.organizationVersionId,
    email: account.user.email,
    firstName: account.user.firstName,
    lastName: account.user.lastName,
    level: account.user.level,
  }) as UserSession

export const userSessionToDbUser = (userSession: UserSession) =>
  ({
    id: userSession.userId,
    organizationVersionId: userSession.organizationVersionId,
    email: userSession.email,
    firstName: userSession.firstName,
    lastName: userSession.lastName,
    level: userSession.level,
  }) as unknown as User

export const hasAccessToEnvironment = (userSession: UserSession | undefined, environment: Environment) => {
  if (!userSession || !userSession.environment) {
    return false
  }
  return userSession.environment === environment
}
