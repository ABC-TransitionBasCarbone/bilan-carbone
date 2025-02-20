import { Level, Prisma, Role, UserStatus } from '@prisma/client'
import { User } from 'next-auth'

export const mockedUserId = 'mocked-user-id'
export const mockedOrganizationId = 'mocked-organization-id'

const mockedUser = {
  id: '6d2af85f-f6f8-42ec-9fa4-965405e52d12',
  email: 'mocked@email.com',
  firstName: 'Mocke',
  lastName: 'User',
  organizationId: mockedOrganizationId,
  role: Role.ADMIN,
  level: Level.Initial,
}
const mockedDbUser = {
  ...mockedUser,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  status: UserStatus.ACTIVE,
}
const mockedStudy = {
  name: 'Mocked Study',
  startDate: '2025-01-01T00:00:00.000Z',
  endDate: '2025-01-01T00:00:00Z',
  isPublic: true,
  level: Level.Initial,
  exports: { createMany: { data: [] } },
  createdBy: { connect: { id: mockedUserId } },
  organization: { connect: { id: mockedOrganizationId } },
  version: { connect: { id: 'mocked-version-id' } },
  allowedUsers: { createMany: { data: [{ role: 'Validator', userId: mockedUserId }] } },
  sites: {
    createMany: {
      data: [{ siteId: 'mocked-site-id', etp: 64, ca: 6906733.42 }],
    },
  },
}

export const getMockedDbUser = (props: Partial<User>): User => ({ ...mockedDbUser, ...props })
export const getMockedStudy = (props: Partial<Prisma.StudyCreateInput>) =>
  ({ ...mockedStudy, ...props }) as Prisma.StudyCreateInput
