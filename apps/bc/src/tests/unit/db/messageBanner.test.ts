import { prismaClient } from '@/db/client'
import {
  deleteManagedMessageBanner,
  getActiveMessageBannerWhere,
  getManagedMessageBanners,
  getMessageBannerManagementWhereCondition,
  saveManagedMessageBanner,
} from '@abc-transitionbascarbone/common/db/db'
import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import { messageBannerEnvironments } from '@abc-transitionbascarbone/common/utils/messageBanner.command'

jest.mock('@/db/client', () => ({
  prismaClient: { messageBanner: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() } },
}))

const command = {
  message: 'Maintenance',
  environments: [Environment.BC],
  startDate: new Date('2026-11-17T10:00:00Z'),
  endDate: new Date('2026-11-18T10:00:00Z'),
}

beforeEach(() => jest.clearAllMocks())

it('includes mixed banners in management queries', () => {
  expect(getMessageBannerManagementWhereCondition(messageBannerEnvironments)).toEqual({
    environments: { hasSome: messageBannerEnvironments },
  })
})

it('filters active banners for the environment and inclusive display window', () => {
  const now = new Date('2026-11-16T10:00:00.000Z')

  expect(getActiveMessageBannerWhere(Environment.MIP, now)).toEqual({
    environments: { has: Environment.MIP },
    startDate: { lte: now },
    endDate: { gte: now },
  })
})

it('reads, updates and deletes mixed banners by ID', async () => {
  const where = getMessageBannerManagementWhereCondition(messageBannerEnvironments)
  await getManagedMessageBanners(prismaClient, messageBannerEnvironments)
  await saveManagedMessageBanner(prismaClient, messageBannerEnvironments, command)
  await saveManagedMessageBanner(prismaClient, messageBannerEnvironments, { ...command, id: 'banner-id' })
  await deleteManagedMessageBanner(prismaClient, messageBannerEnvironments, 'banner-id')

  expect(prismaClient.messageBanner.findMany).toHaveBeenCalledWith({ where, orderBy: { startDate: 'desc' } })
  expect(prismaClient.messageBanner.create).toHaveBeenCalledWith({ data: command })
  expect(prismaClient.messageBanner.update).toHaveBeenCalledWith({
    where: { ...where, id: 'banner-id' },
    data: command,
  })
  expect(prismaClient.messageBanner.delete).toHaveBeenCalledWith({ where: { ...where, id: 'banner-id' } })
})

it('propagates rejected writes rather than reporting success', async () => {
  jest.mocked(prismaClient.messageBanner.update).mockRejectedValueOnce(new Error('Record not found'))
  await expect(
    saveManagedMessageBanner(prismaClient, messageBannerEnvironments, { ...command, id: 'mip-banner' }),
  ).rejects.toThrow('Record not found')
})
