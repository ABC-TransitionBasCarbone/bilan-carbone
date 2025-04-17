import { Level, Prisma, Role, UserStatus } from '@prisma/client'
import { UserSession } from 'next-auth'

export const mockedUserId = 'mocked-user-id'
export const mockedAccountId = 'mocked-account-id'
export const mockedOrganizationVersionId = 'mocked-organization-version-id'
export const mockedOrganizationId = 'mocked-organization-id'

const mockedAccount = {
  id: '6d2af85f-f6f8-42ec-9fa4-965405e52d12',
  organizationVersionId: mockedOrganizationVersionId,
  organizationVersion: {
    id: mockedOrganizationVersionId,
    organizationId: mockedOrganizationId,
  },
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
const mockedStudy = {
  name: 'Mocked Study',
  startDate: '2025-01-01T00:00:00.000Z',
  endDate: '2025-01-01T00:00:00Z',
  isPublic: true,
  level: Level.Initial,
  exports: { createMany: { data: [] } },
  createdBy: { connect: { id: mockedAccountId } },
  organizationVersion: { connect: { id: mockedOrganizationVersionId } },
  allowedUsers: { createMany: { data: [{ role: 'Validator', userId: mockedAccountId }] } },
  sites: {
    createMany: {
      data: [{ siteId: 'mocked-site-id', etp: 64, ca: 6906733.42 }],
    },
  },
}

export const getMockedDbAccount = (
  props: Partial<Prisma.AccountCreateInput>,
  userProps?: Partial<Prisma.UserCreateInput>,
): Prisma.AccountCreateInput =>
  ({ ...mockedDbAccount, ...props, user: { ...mockedDbAccount.user, ...userProps } }) as Prisma.AccountCreateInput

export const getMockedUserSesssion = (props: Partial<UserSession>): UserSession => ({
  accountId: mockedAccount.id,
  userId: mockedUserId,
  organizationVersionId: mockedDbAccount.organizationVersionId,
  organizationId: mockedDbAccount.organizationVersion.organizationId,
  role: mockedDbAccount.role,
  ...mockedDbAccount.user,
  ...props,
})

export const getMockedStudy = (props: Partial<Prisma.StudyCreateInput>) =>
  ({ ...mockedStudy, ...props }) as Prisma.StudyCreateInput
