import { prismaClient } from '@/db/client.server'
import { mapCncToStudySite } from '@/utils/cnc'
import { expect } from '@jest/globals'
import { updateStudySites } from './studySites'

const mockTransaction = {
  studyEmissionSource: { deleteMany: jest.fn() },
  studySite: { deleteMany: jest.fn(), upsert: jest.fn() },
  site: { findMany: jest.fn() },
}

jest.mock('@/db/client.server', () => ({
  prismaClient: { $transaction: jest.fn((callback) => callback(mockTransaction)) },
}))

jest.mock('@/utils/cnc', () => ({
  mapCncToStudySite: jest.fn(),
}))

describe('updateStudySites', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockTransaction.studyEmissionSource.deleteMany.mockResolvedValue({ count: 1 })
    mockTransaction.studySite.deleteMany.mockResolvedValue({ count: 1 })
    mockTransaction.studySite.upsert.mockResolvedValue({})
    mockTransaction.site.findMany.mockResolvedValue([{ id: 'site-id', cnc: { seances: 3 } }])
    jest.mocked(mapCncToStudySite).mockReturnValue({ numberOfSessions: 3 })
  })

  it('deletes dependent sources and upserts CNC-enriched sites in one transaction', async () => {
    const site = {
      studyId: 'study-id',
      siteId: 'site-id',
      ca: 10,
      etp: 2,
      volunteerNumber: 1,
      beneficiaryNumber: 4,
    }

    await updateStudySites('study-id', [site], ['removed-site-id'])

    expect(prismaClient.$transaction).toHaveBeenCalledTimes(1)
    expect(mockTransaction.studyEmissionSource.deleteMany).toHaveBeenCalledWith({
      where: { studyId: 'study-id', studySiteId: { in: ['removed-site-id'] } },
    })
    expect(mockTransaction.studySite.upsert).toHaveBeenCalledWith({
      where: { studyId_siteId: { studyId: 'study-id', siteId: 'site-id' } },
      update: { ca: 10, etp: 2, volunteerNumber: 1, beneficiaryNumber: 4 },
      create: { ...site, numberOfSessions: 3 },
    })
  })
})
