import { Account, Environment, Level, Prisma, Role, User, UserSource, UserStatus } from '@prisma/client'
import { Session, UserSession } from 'next-auth'
import { mockedOrganizationId, mockedOrganizationVersionId } from './organization'

export const mockedUserId = 'mocked-user-id'
export const mockedAccountId = 'mocked-account-id'

export const mockedUser = {
  id: mockedUserId,
  email: 'mocked@email.com',
  firstName: 'Mocked',
  lastName: 'User',
  level: Level.Initial,
}

export const mockedDbUser = {
  ...mockedUser,
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  importedFileDate: null,
  password: null,
  resetToken: null,
  formationFormStartTime: null,
  source: UserSource.CRON,
}

const mockedAccount = {
  id: mockedAccountId,
  organizationVersionId: mockedOrganizationVersionId,
  organizationVersion: {
    id: mockedOrganizationVersionId,
    organizationId: mockedOrganizationId,
  },
  environment: Environment.BC,
  role: Role.ADMIN,
  status: UserStatus.ACTIVE,
  feedbackDate: null,
}
const mockedDbAccount = {
  ...mockedAccount,
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
  accountId: mockedAccountId,
  organizationId: mockedOrganizationId,
  environment: Environment.BC,
  role: mockedAccount.role,
  userId: mockedUserId,
  organizationVersionId: mockedOrganizationVersionId,
  id: mockedAccountId,
  level: mockedUser.level,
  firstName: mockedUser.firstName,
  lastName: mockedUser.lastName,
  user: {
    email: mockedUser.email,
    accountId: mockedAccountId,
    organizationId: mockedOrganizationId,
    environment: Environment.BC,
    needsAccountSelection: false,
  },
}

export const getMockedDbAccount = (
  props?: Partial<Account>,
  userProps?: Partial<Prisma.UserCreateInput>,
): Prisma.AccountCreateInput =>
  ({ ...mockedDbAccount, ...props, user: { ...mockedDbAccount.user, ...userProps } }) as Prisma.AccountCreateInput

export const getMockedAuthUser = (props?: Partial<UserSession>): UserSession => ({
  accountId: mockedAccount.id,
  userId: mockedUserId,
  organizationVersionId: mockedDbAccount.organizationVersionId,
  organizationId: mockedDbAccount.organizationVersion.organizationId,
  role: mockedDbAccount.role,
  environment: Environment.BC,
  ...mockedDbAccount.user,
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
    role: Role.ADMIN,
    organizationVersionId: mockedDbAccount.organizationVersionId,
    level: Level.Advanced,
    ...userProps,
  },
  ...sessionProps,
})

export const getMockedDbUser = (props?: Partial<User>): User => ({ ...mockedDbUser, ...props })
