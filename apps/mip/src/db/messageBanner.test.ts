import { getMessageBannerManagementWhereCondition } from '@abc-transitionbascarbone/common/db/db'
import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import { expect, it } from '@jest/globals'
import { prismaClient } from './client'
import { dbDeleteMessageBanner, dbGetMessageBannersForManagement, dbSaveMessageBanner } from './messageBanner'

jest.mock('./client', () => ({
  prismaClient: { messageBanner: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() } },
}))

it('scopes MIP reads and ID-based mutations to MIP-only records', async () => {
  const where = getMessageBannerManagementWhereCondition([Environment.MIP])
  const command = {
    message: 'Maintenance',
    environments: [Environment.MIP],
    startDate: new Date('2026-11-17T10:00:00Z'),
    endDate: new Date('2026-11-18T10:00:00Z'),
  }
  await dbGetMessageBannersForManagement()
  await dbSaveMessageBanner(command)
  await dbSaveMessageBanner({ ...command, id: 'banner-id' })
  await dbDeleteMessageBanner('banner-id')
  expect(prismaClient.messageBanner.findMany).toHaveBeenCalledWith({ where, orderBy: { startDate: 'desc' } })
  expect(prismaClient.messageBanner.create).toHaveBeenCalledWith({ data: command })
  expect(prismaClient.messageBanner.update).toHaveBeenCalledWith({
    where: { ...where, id: 'banner-id' },
    data: command,
  })
  expect(prismaClient.messageBanner.delete).toHaveBeenCalledWith({ where: { ...where, id: 'banner-id' } })
})
