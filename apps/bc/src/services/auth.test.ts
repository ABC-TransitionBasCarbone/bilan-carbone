import { getAccountById } from '@/db/account'
import { getUserByEmailWithSensibleInformations } from '@/db/user'
import {
  getMockedAccount,
  getMockedAuthUser,
  getMockedDbActualizedAuth,
  getMockedDbUser,
} from '@/tests/utils/models/user'
import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import { expect } from '@jest/globals'
import { getServerSession } from 'next-auth'
import { JWT } from 'next-auth/jwt'
import { CredentialsConfig } from 'next-auth/providers/credentials'
import { authOptions, dbActualizedAuth } from './auth'

jest.mock('@/db/account', () => ({ getAccountById: jest.fn(), getAccountsFromUser: jest.fn() }))
jest.mock('@/db/user', () => ({ getUserByEmailWithSensibleInformations: jest.fn() }))
jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('bcryptjs', () => ({ compare: jest.fn().mockResolvedValue(true) }))
jest.mock('next-auth/providers/credentials', () => ({
  __esModule: true,
  default: jest.fn((options: Partial<CredentialsConfig>) => ({ type: 'credentials', ...options })),
}))

const jwtCallback = authOptions.callbacks!.jwt!
const sessionCallback = authOptions.callbacks!.session!

const getAccountWithoutOrganization = (
  environment: Environment = Environment.BC,
): NonNullable<Awaited<ReturnType<typeof getAccountById>>> => ({
  ...getMockedAccount({ environment }),
  user: getMockedDbUser(),
  organizationVersion: null,
  deactivatableFeatureStatus: [],
})

const refreshJWT = (token: JWT) =>
  jwtCallback({ token, trigger: 'update', account: null } as Parameters<typeof jwtCallback>[0])

const createTokenSession = (token: JWT) =>
  sessionCallback({
    session: getMockedDbActualizedAuth(),
    token,
    user: { ...getMockedAuthUser(), emailVerified: null },
    newSession: null,
    trigger: 'update',
  })

describe('BC authentication environment boundary', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const account = getAccountWithoutOrganization()
    jest.mocked(getAccountById).mockResolvedValue(account)
    jest.mocked(getServerSession).mockResolvedValue(getMockedDbActualizedAuth())
    jest.mocked(getUserByEmailWithSensibleInformations).mockResolvedValue({
      ...getMockedDbUser({ password: 'password-hash' }),
      accounts: [getMockedAccount()],
    })
  })

  it.each([Environment.MIP, undefined, null, 'invalid'])('rejects token environment %s', async (environment) => {
    expect(await createTokenSession({ environment })).toEqual({ sessionInvalid: true, expires: '' })
  })

  it('accepts a valid BC token environment', async () => {
    expect(await createTokenSession({ environment: Environment.CUT })).toMatchObject({
      user: { environment: Environment.CUT },
    })
  })

  it('preserves the account-selection flow without an environment', async () => {
    expect(await createTokenSession({ id: 'user-id', needsAccountSelection: true })).toMatchObject({
      user: { userId: 'user-id', needsAccountSelection: true },
    })
  })

  it('rejects MIP accounts during sign-in token creation', async () => {
    const account = getAccountWithoutOrganization(Environment.MIP)
    jest.mocked(getAccountById).mockResolvedValue(account)

    expect(
      await jwtCallback({ token: {}, user: { id: account.user.id, accountId: account.id }, account: null }),
    ).toEqual({
      sessionInvalid: true,
    })
  })

  it('rejects MIP accounts during token refresh', async () => {
    const account = getAccountWithoutOrganization(Environment.MIP)
    jest.mocked(getAccountById).mockResolvedValue(account)

    expect(await refreshJWT({ id: account.user.id, accountId: account.id })).toEqual({ sessionInvalid: true })
  })

  it('refreshes a BC account without an organization using its account environment', async () => {
    const account = getAccountWithoutOrganization(Environment.TILT)
    jest.mocked(getAccountById).mockResolvedValue(account)

    expect(await refreshJWT({ id: account.user.id, accountId: account.id })).toMatchObject({
      environment: Environment.TILT,
      needsAccountSelection: false,
    })
  })

  it('rejects MIP accounts when refreshing sessions from the database', async () => {
    jest.mocked(getAccountById).mockResolvedValue(getAccountWithoutOrganization(Environment.MIP))

    expect(await dbActualizedAuth()).toBeNull()
  })

  it('rejects account-selection sessions before querying an account', async () => {
    jest.mocked(getServerSession).mockResolvedValue(getMockedDbActualizedAuth({}, { needsAccountSelection: true }))

    expect(await dbActualizedAuth()).toBeNull()
    expect(getAccountById).not.toHaveBeenCalled()
  })

  it('rejects MIP accounts during credentials authorization', async () => {
    jest.mocked(getAccountById).mockResolvedValue(getAccountWithoutOrganization(Environment.MIP))
    const provider = authOptions.providers[0]
    if (typeof provider === 'function' || provider.type !== 'credentials') {
      throw new Error('Expected credentials provider')
    }

    expect(
      await provider.authorize(
        { email: 'user@example.com', password: 'password', accountId: '' },
        { body: {}, query: {}, headers: {}, method: 'POST' },
      ),
    ).toBeNull()
  })
})
