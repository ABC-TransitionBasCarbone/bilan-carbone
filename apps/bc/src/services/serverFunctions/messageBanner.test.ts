import { prismaClient } from '@/db/client'
import { dbActualizedAuth } from '@/services/auth'
import {
  deleteManagedMessageBanner,
  getActiveMessageBanners,
  getManagedMessageBanners,
  saveManagedMessageBanner,
} from '@abc-transitionbascarbone/common/db/db'
import { Environment, Role } from '@abc-transitionbascarbone/common/db/enums'
import { NOT_AUTHORIZED } from '@abc-transitionbascarbone/common/services/permissions/check'
import { messageBannerEnvironments } from '@abc-transitionbascarbone/common/utils/messageBanner.command'
import {
  deleteMessageBannerForManagement,
  getCurrentMessageBanners,
  getMessageBannersForManagement,
  saveMessageBannerForManagement,
} from './messageBanner'

jest.mock('@/db/client', () => ({ prismaClient: {} }))
jest.mock('@abc-transitionbascarbone/common/db/db', () => ({
  deleteManagedMessageBanner: jest.fn(),
  getActiveMessageBanners: jest.fn(),
  getManagedMessageBanners: jest.fn(),
  saveManagedMessageBanner: jest.fn(),
}))
jest.mock('@/services/auth', () => ({ dbActualizedAuth: jest.fn(), auth: jest.fn() }))

const command = {
  message: ' Maintenance ',
  environments: [Environment.BC],
  startDate: new Date('2026-11-16T10:00:00Z'),
  endDate: new Date('2026-11-17T10:00:00Z'),
}
const id = '97fcde8c-3702-4c5d-bd29-73277c339676'

beforeEach(() => {
  jest.resetAllMocks()
  jest.spyOn(console, 'error').mockImplementation()
  jest.spyOn(console, 'log').mockImplementation()
})

afterEach(() => jest.restoreAllMocks())

it.each([null, { user: { id: 'user', role: Role.ADMIN } }])(
  'blocks management reads and writes for an unauthorized session %j',
  async (session) => {
    jest.mocked(dbActualizedAuth).mockResolvedValue(session as Awaited<ReturnType<typeof dbActualizedAuth>>)

    for (const result of [
      await getMessageBannersForManagement(),
      await saveMessageBannerForManagement(command),
      await deleteMessageBannerForManagement(id),
    ]) {
      expect(result).toEqual({ success: false, errorMessage: NOT_AUTHORIZED })
    }
    expect(getManagedMessageBanners).not.toHaveBeenCalled()
    expect(saveManagedMessageBanner).not.toHaveBeenCalled()
    expect(deleteManagedMessageBanner).not.toHaveBeenCalled()
    expect(console.error).toHaveBeenCalledTimes(3)
  },
)

it('allows super admins to list, create, update and delete banners', async () => {
  jest.mocked(dbActualizedAuth).mockResolvedValue({
    user: { id: 'super-admin', role: Role.SUPER_ADMIN },
  } as Awaited<ReturnType<typeof dbActualizedAuth>>)
  jest.mocked(getManagedMessageBanners).mockResolvedValue([])

  expect(await getMessageBannersForManagement()).toEqual({ success: true, data: [] })
  expect((await saveMessageBannerForManagement(command)).success).toBe(true)
  expect(saveManagedMessageBanner).toHaveBeenLastCalledWith(prismaClient, messageBannerEnvironments, {
    ...command,
    message: 'Maintenance',
  })
  expect((await saveMessageBannerForManagement({ ...command, id })).success).toBe(true)
  expect(saveManagedMessageBanner).toHaveBeenLastCalledWith(prismaClient, messageBannerEnvironments, {
    ...command,
    id,
    message: 'Maintenance',
  })
  expect((await deleteMessageBannerForManagement(id)).success).toBe(true)
  expect(deleteManagedMessageBanner).toHaveBeenCalledWith(prismaClient, messageBannerEnvironments, id)
})

it('rejects invalid input before writing and reports database errors', async () => {
  jest.mocked(dbActualizedAuth).mockResolvedValue({
    user: { id: 'super-admin', role: Role.SUPER_ADMIN },
  } as Awaited<ReturnType<typeof dbActualizedAuth>>)

  expect((await saveMessageBannerForManagement({ ...command, endDate: command.startDate })).success).toBe(false)
  expect((await saveMessageBannerForManagement({ ...command, environments: [] })).success).toBe(false)
  expect((await saveMessageBannerForManagement({ ...command, message: '  ' })).success).toBe(false)
  expect(saveManagedMessageBanner).not.toHaveBeenCalled()

  expect(
    (await saveMessageBannerForManagement({ ...command, environments: [Environment.BC, Environment.MIP] })).success,
  ).toBe(true)
  expect(saveManagedMessageBanner).toHaveBeenLastCalledWith(prismaClient, messageBannerEnvironments, {
    ...command,
    message: 'Maintenance',
    environments: [Environment.BC, Environment.MIP],
  })

  jest.mocked(saveManagedMessageBanner).mockRejectedValue(new Error('database unavailable'))
  expect(await saveMessageBannerForManagement(command)).toEqual({
    success: false,
    errorMessage: 'database unavailable',
  })
})

it('only reads banners for the authenticated environment', async () => {
  expect(await getCurrentMessageBanners()).toEqual({ success: false, errorMessage: NOT_AUTHORIZED })
  expect(getActiveMessageBanners).not.toHaveBeenCalled()

  jest.mocked(dbActualizedAuth).mockResolvedValue({
    user: { id: 'user', environment: Environment.TILT },
  } as Awaited<ReturnType<typeof dbActualizedAuth>>)
  jest.mocked(getActiveMessageBanners).mockResolvedValue([])
  expect(await getCurrentMessageBanners()).toEqual({ success: true, data: [] })
  expect(getActiveMessageBanners).toHaveBeenCalledWith(prismaClient, Environment.TILT)
})
