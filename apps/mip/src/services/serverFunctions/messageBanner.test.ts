import { prismaClient } from '@/db/client'
import { deleteMessageBanner, getMessageBannersForAdmin, saveMessageBanner } from '@/db/messageBanner'
import { dbActualizedAuth } from '@/services/auth'
import { Environment, RoleMip } from '@abc-transitionbascarbone/common/db/enums'
import { NOT_AUTHORIZED } from '@abc-transitionbascarbone/common/services/permissions/check'
import { expect, it } from '@jest/globals'
import {
  deleteMessageBannerForManagement,
  getCurrentMessageBanners,
  getMessageBannersForManagement,
  saveMessageBannerForManagement,
} from './messageBanner'

jest.mock('@/db/messageBanner', () => ({
  deleteMessageBanner: jest.fn(),
  getMessageBannersForAdmin: jest.fn(),
  saveMessageBanner: jest.fn(),
}))
jest.mock('@/db/client', () => ({ prismaClient: { messageBanner: { findMany: jest.fn() } } }))
jest.mock('@/services/auth', () => ({ dbActualizedAuth: jest.fn(), auth: jest.fn() }))

const command = {
  message: ' Maintenance ',
  environments: [Environment.MIP],
  startAt: new Date('2026-11-17T10:00:00Z'),
  endAt: new Date('2026-11-18T10:00:00Z'),
  active: true,
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
  expect(getMessageBannersForAdmin).not.toHaveBeenCalled()
  expect(saveMessageBanner).not.toHaveBeenCalled()
  expect(deleteMessageBanner).not.toHaveBeenCalled()
  expect(console.error).toHaveBeenCalledTimes(3)
})

it('allows super admins to list, create, update and delete MIP banners', async () => {
  jest.mocked(dbActualizedAuth).mockResolvedValue({
    user: { id: 'super-admin', role: RoleMip.SUPER_ADMIN },
  } as Awaited<ReturnType<typeof dbActualizedAuth>>)
  jest.mocked(getMessageBannersForAdmin).mockResolvedValue([])
  expect(await getMessageBannersForManagement()).toEqual({ success: true, data: [] })
  expect((await saveMessageBannerForManagement(command)).success).toBe(true)
  expect(saveMessageBanner).toHaveBeenLastCalledWith({ ...command, message: 'Maintenance' })
  expect((await saveMessageBannerForManagement({ ...command, id })).success).toBe(true)
  expect(saveMessageBanner).toHaveBeenLastCalledWith({ ...command, id, message: 'Maintenance' })
  expect((await deleteMessageBannerForManagement(id)).success).toBe(true)
  expect(deleteMessageBanner).toHaveBeenCalledWith(id)
})

it.each([[Environment.BC], [Environment.BC, Environment.MIP], [], [Environment.COURSE_TILT]])(
  'rejects non-MIP or empty targets %j',
  async (...environments) => {
    jest.mocked(dbActualizedAuth).mockResolvedValue({
      user: { id: 'super-admin', role: RoleMip.SUPER_ADMIN },
    } as Awaited<ReturnType<typeof dbActualizedAuth>>)
    expect((await saveMessageBannerForManagement({ ...command, environments })).success).toBe(false)
    expect(saveMessageBanner).not.toHaveBeenCalled()
  },
)

it('reports database failures', async () => {
  jest.mocked(dbActualizedAuth).mockResolvedValue({
    user: { id: 'super-admin', role: RoleMip.SUPER_ADMIN },
  } as Awaited<ReturnType<typeof dbActualizedAuth>>)
  jest.mocked(deleteMessageBanner).mockRejectedValue(new Error('Record not found'))
  expect(await deleteMessageBannerForManagement(id)).toEqual({ success: false, errorMessage: 'Record not found' })
})

it('requires authentication and only displays MIP banners', async () => {
  expect(await getCurrentMessageBanners()).toEqual({ success: false, errorMessage: NOT_AUTHORIZED })
  expect(prismaClient.messageBanner.findMany).not.toHaveBeenCalled()
  jest.mocked(dbActualizedAuth).mockResolvedValue({
    user: { id: 'user', role: RoleMip.ADMIN },
  } as Awaited<ReturnType<typeof dbActualizedAuth>>)
  await getCurrentMessageBanners()
  expect(prismaClient.messageBanner.findMany).toHaveBeenCalledWith({
    where: expect.objectContaining({ environments: { has: Environment.MIP } }),
    orderBy: { startAt: 'asc' },
  })
})
