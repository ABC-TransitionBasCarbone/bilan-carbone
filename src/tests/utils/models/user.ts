import { Account, Environment, Level, Prisma, Role, User, UserSource, UserStatus } from '@prisma/client'
import { UserSession } from 'next-auth'
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
  status: UserStatus.ACTIVE,
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
    status: UserStatus.ACTIVE,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
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

export const getMockedDbUser = (props?: Partial<User>): User => ({ ...mockedDbUser, ...props })
