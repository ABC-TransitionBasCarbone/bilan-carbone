import { getAccountById } from '@/db/account'
import { getMockedAccount, getMockedDbActualizedAuth, getMockedDbUser } from '@/tests/utils/models/user'
import { Environment, UserStatus } from '@abc-transitionbascarbone/common/db/enums'
import { getServerSession } from 'next-auth'
import { authOptions, dbActualizedAuth } from './auth'

jest.mock('@/db/account', () => ({ getAccountById: jest.fn(), getAccountsFromUser: jest.fn() }))
jest.mock('@/db/user', () => ({ getUserByEmailWithSensibleInformations: jest.fn() }))
jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))

const account = {
  ...getMockedAccount(),
  user: getMockedDbUser(),
  organizationVersion: {
    organizationId: 'current-organization',
    environment: Environment.BC,
  },
}
const mockGetAccountById = getAccountById as jest.Mock
const jwt = authOptions.callbacks?.jwt

if (!jwt) {
  throw new Error('JWT callback is not configured')
}

describe('session organization', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetAccountById.mockResolvedValue(account)
  })

  it('keeps the account organization when updating the JWT', async () => {
    const params: Omit<Parameters<typeof jwt>[0], 'user' | 'account'> = {
      token: { id: account.user.id, accountId: account.id, organizationId: 'previous-organization' },
      trigger: 'update',
    }
    // NextAuth omits user/account on update despite marking them required in its callback type.
    const token = await jwt(params as Parameters<typeof jwt>[0])

    expect(token.organizationId).toBe(account.organizationVersion.organizationId)
    expect(mockGetAccountById).toHaveBeenCalledWith(account.id)
  })

  it.each(['', 'previous-organization'])(
    'refreshes organizationId from the account when the session contains %p',
    async (organizationId) => {
      jest.mocked(getServerSession).mockResolvedValue(getMockedDbActualizedAuth({}, { organizationId }))

      const session = await dbActualizedAuth()

      expect(session?.user.organizationId).toBe(account.organizationVersion.organizationId)
      expect(session?.user.organizationVersionId).toBe(account.organizationVersionId)
      expect(mockGetAccountById).toHaveBeenCalledWith(account.id)
    },
  )

  it('does not preserve a stale organization when the account no longer has one', async () => {
    jest.mocked(getServerSession).mockResolvedValue(getMockedDbActualizedAuth())
    mockGetAccountById.mockResolvedValue({ ...account, organizationVersionId: null, organizationVersion: null })

    const session = await dbActualizedAuth()

    expect(session?.user.organizationId).toBeNull()
    expect(session?.user.organizationVersionId).toBeNull()
  })

  it('rejects unauthenticated requests without looking up an account', async () => {
    jest.mocked(getServerSession).mockResolvedValue(null)

    await expect(dbActualizedAuth()).resolves.toBeNull()
    expect(mockGetAccountById).not.toHaveBeenCalled()
  })

  it.each([null, { ...account, status: UserStatus.SUSPENDED }])('rejects an unavailable account: %p', async (value) => {
    jest.mocked(getServerSession).mockResolvedValue(getMockedDbActualizedAuth())
    mockGetAccountById.mockResolvedValue(value)

    await expect(dbActualizedAuth()).resolves.toBeNull()
  })
})
