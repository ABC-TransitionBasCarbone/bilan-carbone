import type { AccountMip, Prisma, User } from '@abc-transitionbascarbone/db-common'
import { Environment, Level, RoleMip, UserStatus } from '@abc-transitionbascarbone/db-common/enums'
import { mockedOrganizationId } from '@abc-transitionbascarbone/services/tests/models/organization'
import { mockedDbUser, mockedUser, mockedUserId } from '@abc-transitionbascarbone/services/tests/models/user'
import { Session, UserSession } from 'next-auth'
import { mockedOrganizationVersionMipId } from './organization'

export const mockedAccountMipId = 'mocked-account-mip-id'

const mockedAccountMip = {
  id: mockedAccountMipId,
  organizationVersionMipId: mockedOrganizationVersionMipId,
  organizationVersionMip: {
    id: mockedOrganizationVersionMipId,
    organizationId: mockedOrganizationId,
  },
  role: RoleMip.ADMIN,
  status: UserStatus.ACTIVE,
}
const mockedDbAccountMip = {
  ...mockedAccountMip,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  userId: mockedUserId,
  user: {
    id: mockedUserId,
    firstName: 'Mocke',
    lastName: 'User',
    email: 'mocked.user@email.com',
    level: Level.Initial,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
}

export const mockedSession = {
  email: mockedUser.email,
  accountMipId: mockedAccountMipId,
  organizationId: mockedOrganizationId,
  environment: Environment.BC,
  role: mockedAccountMip.role,
  userId: mockedUserId,
  organizationVersionMipId: mockedOrganizationVersionMipId,
  id: mockedAccountMipId,
  firstName: mockedUser.firstName,
  lastName: mockedUser.lastName,
  user: {
    email: mockedUser.email,
    accountMipId: mockedAccountMipId,
    organizationId: mockedOrganizationId,
    environment: Environment.BC,
    needsAccountMipSelection: false,
  },
}

export const getMockedDbAccountMip = (
  props?: Partial<AccountMip>,
  userProps?: Partial<Prisma.UserCreateInput>,
): Prisma.AccountMipCreateInput =>
  ({
    ...mockedDbAccountMip,
    ...props,
    user: { ...mockedDbAccountMip.user, ...userProps },
  }) as Prisma.AccountMipCreateInput

export const getMockedAuthUser = (props?: Partial<UserSession>): UserSession => ({
  accountMipId: mockedAccountMip.id,
  userId: mockedUserId,
  organizationVersionMipId: mockedDbAccountMip.organizationVersionMipId,
  organizationId: mockedDbAccountMip.organizationVersionMip.organizationId,
  role: mockedDbAccountMip.role,
  ...mockedDbAccountMip.user,
  ...props,
})

export const getMockedDbActualizedAuth = (
  sessionProps?: Partial<Session>,
  userProps?: Partial<UserSession>,
): Session => ({
  ...mockedSession,
  expires: '3600',
  user: {
    ...mockedSession.user,
    id: mockedUserId,
    userId: mockedUserId,
    firstName: 'mocked-first-name',
    lastName: 'mocked-last-name',
    role: RoleMip.ADMIN,
    organizationVersionMipId: mockedDbAccountMip.organizationVersionMipId,
    ...userProps,
  },
  ...sessionProps,
})

export const getMockedDbUser = (props?: Partial<User>): User => ({ ...mockedDbUser, ...props })
