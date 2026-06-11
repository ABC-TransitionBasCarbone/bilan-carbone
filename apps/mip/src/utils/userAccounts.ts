import { User } from '@abc-transitionbascarbone/db-common'
import { UserSession } from 'next-auth'

export const userSessionToDbUser = (userSession: UserSession) =>
  ({
    id: userSession.userId,
    organizationVersionMipId: userSession.organizationVersionMipId,
    email: userSession.email,
    firstName: userSession.firstName,
    lastName: userSession.lastName,
  }) as unknown as User
