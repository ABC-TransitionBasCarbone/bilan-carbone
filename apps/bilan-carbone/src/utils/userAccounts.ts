import { AccountWithUser } from '@/types/account.types'
import { User } from '@abc-transitionbascarbone/db-common'
import { UserSession } from 'next-auth'

export const accountWithUserToUserSession = (
  account: Pick<AccountWithUser, 'id' | 'role' | 'organizationVersionId'> & {
    user: Pick<AccountWithUser['user'], 'id' | 'email' | 'firstName' | 'lastName' | 'level'>
  },
) =>
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
