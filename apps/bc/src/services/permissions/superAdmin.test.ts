import { dbActualizedAuth } from '@/services/auth'
import { Role } from '@abc-transitionbascarbone/common/db/enums'
import { NOT_AUTHORIZED } from '@abc-transitionbascarbone/common/services/permissions/check'
import { requireSuperAdmin } from './superAdmin'

jest.mock('@/services/auth', () => ({ dbActualizedAuth: jest.fn() }))

beforeEach(() => {
  jest.resetAllMocks()
  jest.spyOn(console, 'error').mockImplementation()
})

afterEach(() => jest.restoreAllMocks())

it('returns the authenticated super-admin user', async () => {
  const user = { id: 'super-admin', accountId: 'account', role: Role.SUPER_ADMIN }
  jest.mocked(dbActualizedAuth).mockResolvedValue({ user } as Awaited<ReturnType<typeof dbActualizedAuth>>)

  await expect(requireSuperAdmin('manageBanners')).resolves.toEqual(user)
})

it.each([null, { user: { id: 'user', role: Role.ADMIN } }])(
  'logs and rejects non-super-admin sessions %j',
  async (session) => {
    jest.mocked(dbActualizedAuth).mockResolvedValue(session as Awaited<ReturnType<typeof dbActualizedAuth>>)

    await expect(requireSuperAdmin('manageBanners')).rejects.toThrow(NOT_AUTHORIZED)
    expect(console.error).toHaveBeenCalledWith('manageBanners: NOT_AUTHORIZED', {
      userId: session?.user?.id ?? 'anonymous',
      accountId: undefined,
    })
  },
)
