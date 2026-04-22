import { Environment, UserStatus } from '@repo/db-common/enums'

// TODO: ESM module issue with Jest. Remove these mocks when moving to Vitest
jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(() => (key: string) => key),
}))
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))
jest.mock('next-auth/providers/credentials', () => jest.fn())

import { getActiveAccountsForEnvironment } from './auth'

describe('getActiveAccountsForEnvironment', () => {
  const accounts = [
    { id: 'active-tilt', status: UserStatus.ACTIVE, environment: Environment.TILT },
    { id: 'active-bc', status: UserStatus.ACTIVE, environment: Environment.BC },
    { id: 'validated-tilt', status: UserStatus.VALIDATED, environment: Environment.TILT },
  ]

  it('returns all active accounts when no environment is requested', () => {
    expect(getActiveAccountsForEnvironment(accounts)).toEqual([
      { id: 'active-tilt', status: UserStatus.ACTIVE, environment: Environment.TILT },
      { id: 'active-bc', status: UserStatus.ACTIVE, environment: Environment.BC },
    ])
  })

  it('returns only active accounts for the requested environment', () => {
    expect(getActiveAccountsForEnvironment(accounts, Environment.TILT)).toEqual([
      { id: 'active-tilt', status: UserStatus.ACTIVE, environment: Environment.TILT },
    ])
  })
})
