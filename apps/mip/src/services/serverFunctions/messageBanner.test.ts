import { dbActualizedAuth } from '@/services/auth'
import {
  deleteManagedMessageBanner,
  getActiveMessageBanners,
  getManagedMessageBanners,
  saveManagedMessageBanner,
} from '@abc-transitionbascarbone/common/db/db'
import { Environment, RoleMip } from '@abc-transitionbascarbone/common/db/enums'
import { NOT_AUTHORIZED } from '@abc-transitionbascarbone/common/services/permissions/check'
import { messageBannerEnvironments } from '@abc-transitionbascarbone/common/utils/messageBanner.command'
import { expect, it } from '@jest/globals'
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
  environments: [Environment.MIP, Environment.BC],
  startDate: new Date('2026-11-17T10:00:00Z'),
  endDate: new Date('2026-11-18T10:00:00Z'),
}
const id = '97fcde8c-3702-4c5d-bd29-73277c339676'

beforeEach(() => {
  jest.resetAllMocks()
  jest.spyOn(console, 'error').mockImplementation()
  jest.spyOn(console, 'log').mockImplementation()
})
afterEach(() => jest.restoreAllMocks())

it.each([null, { user: { id: 'user', role: RoleMip.ADMIN } }])('blocks unauthorized management %j', async (session) => {
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
})

it('allows super admins to list, create, update and delete MIP banners', async () => {
  jest.mocked(dbActualizedAuth).mockResolvedValue({
    user: { id: 'super-admin', role: RoleMip.SUPER_ADMIN },
  } as Awaited<ReturnType<typeof dbActualizedAuth>>)
  jest.mocked(getManagedMessageBanners).mockResolvedValue([])
  expect(await getMessageBannersForManagement()).toEqual({ success: true, data: [] })
  expect((await saveMessageBannerForManagement(command)).success).toBe(true)
  expect(jest.mocked(saveManagedMessageBanner).mock.calls[0]?.[1]).toEqual(messageBannerEnvironments)
  expect(jest.mocked(saveManagedMessageBanner).mock.calls[0]?.[2]).toEqual({
    ...command,
    message: 'Maintenance',
  })
  expect((await saveMessageBannerForManagement({ ...command, id })).success).toBe(true)
  expect(jest.mocked(saveManagedMessageBanner).mock.calls[1]?.[1]).toEqual(messageBannerEnvironments)
  expect(jest.mocked(saveManagedMessageBanner).mock.calls[1]?.[2]).toEqual({
    ...command,
    id,
    message: 'Maintenance',
  })
  expect((await deleteMessageBannerForManagement(id)).success).toBe(true)
  expect(jest.mocked(deleteManagedMessageBanner).mock.calls[0]?.[1]).toEqual(messageBannerEnvironments)
  expect(jest.mocked(deleteManagedMessageBanner).mock.calls[0]?.[2]).toBe(id)
})

it('rejects commands without an environment target', async () => {
  jest.mocked(dbActualizedAuth).mockResolvedValue({
    user: { id: 'super-admin', role: RoleMip.SUPER_ADMIN },
  } as Awaited<ReturnType<typeof dbActualizedAuth>>)
  expect((await saveMessageBannerForManagement({ ...command, environments: [] })).success).toBe(false)
  expect(saveManagedMessageBanner).not.toHaveBeenCalled()
})

it('reports database failures', async () => {
  jest.mocked(dbActualizedAuth).mockResolvedValue({
    user: { id: 'super-admin', role: RoleMip.SUPER_ADMIN },
  } as Awaited<ReturnType<typeof dbActualizedAuth>>)
  jest.mocked(deleteManagedMessageBanner).mockRejectedValue(new Error('Record not found'))
  expect(await deleteMessageBannerForManagement(id)).toEqual({ success: false, errorMessage: 'Record not found' })
})

it('requires authentication and only displays MIP banners', async () => {
  expect(await getCurrentMessageBanners()).toEqual({ success: false, errorMessage: NOT_AUTHORIZED })
  expect(getActiveMessageBanners).not.toHaveBeenCalled()
  jest.mocked(dbActualizedAuth).mockResolvedValue({
    user: { id: 'user', role: RoleMip.ADMIN },
  } as Awaited<ReturnType<typeof dbActualizedAuth>>)
  jest.mocked(getActiveMessageBanners).mockResolvedValue([])
  expect(await getCurrentMessageBanners()).toEqual({ success: true, data: [] })
  expect(jest.mocked(getActiveMessageBanners).mock.calls[0]?.[1]).toBe(Environment.MIP)
})
