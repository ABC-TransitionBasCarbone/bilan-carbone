import type { User } from '@abc-transitionbascarbone/db-common'
import { UserSource, Level } from '@abc-transitionbascarbone/db-common/enums'

export const mockedUserId = 'mocked-user-id'

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

export const getMockedDbUser = (props?: Partial<User>): User => ({ ...mockedDbUser, ...props })
