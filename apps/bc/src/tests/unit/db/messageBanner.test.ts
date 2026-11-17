import { prismaClient } from '@/db/client'
import { deleteMessageBanner, getMessageBannersForAdmin, saveMessageBanner } from '@/db/messageBanner'
import { getMessageBannerManagementWhere } from '@abc-transitionbascarbone/common/db/db'
import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import { bcEnvironments } from '@abc-transitionbascarbone/common/utils/environments'
import { mipMessageBannerEnvironments } from '@abc-transitionbascarbone/common/utils/messageBanner.command'

jest.mock('@/db/client', () => ({
  prismaClient: { messageBanner: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() } },
}))

const command = {
  message: 'Maintenance',
  environments: [Environment.BC],
  startAt: new Date('2026-11-17T10:00:00Z'),
  endAt: new Date('2026-11-18T10:00:00Z'),
  active: true,
}

beforeEach(() => jest.clearAllMocks())

it.each([
  { allowed: bcEnvironments, excluded: [Environment.MIP] },
  { allowed: mipMessageBannerEnvironments, excluded: bcEnvironments },
])('excludes foreign and mixed banners from management', ({ allowed, excluded }) => {
  expect(getMessageBannerManagementWhere(allowed)).toEqual({
    environments: { hasSome: allowed },
    NOT: { environments: { hasSome: excluded } },
  })
})

it('scopes BC reads, updates and deletes to BC-family records, including ID mutations', async () => {
  const where = getMessageBannerManagementWhere(bcEnvironments)
  await getMessageBannersForAdmin()
  await saveMessageBanner(command)
  await saveMessageBanner({ ...command, id: 'banner-id' })
  await deleteMessageBanner('banner-id')

  expect(prismaClient.messageBanner.findMany).toHaveBeenCalledWith({ where, orderBy: { startAt: 'desc' } })
  expect(prismaClient.messageBanner.create).toHaveBeenCalledWith({ data: command })
  expect(prismaClient.messageBanner.update).toHaveBeenCalledWith({
    where: { ...where, id: 'banner-id' },
    data: command,
  })
  expect(prismaClient.messageBanner.delete).toHaveBeenCalledWith({ where: { ...where, id: 'banner-id' } })
})

it('propagates rejected writes rather than reporting success', async () => {
  jest.mocked(prismaClient.messageBanner.update).mockRejectedValueOnce(new Error('Record not found'))
  await expect(saveMessageBanner({ ...command, id: 'mip-banner' })).rejects.toThrow('Record not found')
})
