import { User as DBUser, Level, Role, UserSource, UserStatus } from '@prisma/client'
import { User } from 'next-auth'
import { mockedOrganizationId } from './organization'

export const mockedUser = {
  id: '6d2af85f-f6f8-42ec-9fa4-965405e52d12',
  email: 'mocked@email.com',
  firstName: 'Mocked',
  lastName: 'User',
  organizationId: mockedOrganizationId,
  role: Role.ADMIN,
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

export const getMockedAuthUser = (props?: Partial<User>): User => ({ ...mockedUser, ...props })

export const getMockedDbUser = (props?: Partial<DBUser>): DBUser => ({ ...mockedDbUser, ...props })
