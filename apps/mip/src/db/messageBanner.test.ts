import { getMessageBannerManagementWhere } from '@abc-transitionbascarbone/common/db/db'
import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import { expect, it } from '@jest/globals'
import { prismaClient } from './client'
import { deleteMessageBanner, getMessageBannersForAdmin, saveMessageBanner } from './messageBanner'

jest.mock('./client', () => ({
  prismaClient: { messageBanner: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() } },
}))

it('scopes MIP reads and ID-based mutations to MIP-only records', async () => {
  const where = getMessageBannerManagementWhere([Environment.MIP])
  const command = {
    message: 'Maintenance',
    environments: [Environment.MIP],
    startAt: new Date('2026-11-17T10:00:00Z'),
    endAt: new Date('2026-11-18T10:00:00Z'),
    active: true,
  }
  await getMessageBannersForAdmin()
  await saveMessageBanner(command)
  await saveMessageBanner({ ...command, id: 'banner-id' })
  await deleteMessageBanner('banner-id')
  expect(prismaClient.messageBanner.findMany).toHaveBeenCalledWith({ where, orderBy: { startAt: 'desc' } })
  expect(prismaClient.messageBanner.create).toHaveBeenCalledWith({ data: command })
  expect(prismaClient.messageBanner.update).toHaveBeenCalledWith({
    where: { id: 'banner-id', ...where },
    data: command,
  })
  expect(prismaClient.messageBanner.delete).toHaveBeenCalledWith({ where: { id: 'banner-id', ...where } })
})
