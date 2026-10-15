import { DayOfWeek } from '@abc-transitionbascarbone/common/db/enums'
import { expect } from '@jest/globals'
import { updateStudyOpeningHours } from './studyOpeningHours'

const mockTransaction = {
  openingHours: {
    findMany: jest.fn(),
    deleteMany: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
}

jest.mock('@/db/client.server', () => ({
  prismaClient: {
    $transaction: jest.fn((callback) => callback(mockTransaction)),
  },
}))

describe('updateStudyOpeningHours', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockTransaction.openingHours.findMany.mockResolvedValue([{ id: 'removed' }])
    mockTransaction.openingHours.deleteMany.mockResolvedValue({ count: 1 })
    mockTransaction.openingHours.update.mockResolvedValue({})
    mockTransaction.openingHours.create.mockResolvedValue({})
  })

  it('deletes removed rows and creates or updates the supplied hours in one transaction', async () => {
    const [day, holiday] = Object.values(DayOfWeek)
    const updatedOpeningHour = { id: 'updated', day, isHoliday: false, openHour: '09:00', closeHour: '17:00' }
    const newHolidayOpeningHour = { day: holiday, isHoliday: true, openHour: '10:00', closeHour: '16:00' }

    await updateStudyOpeningHours('study-site-id', { [day]: updatedOpeningHour }, { [holiday]: newHolidayOpeningHour })

    expect(mockTransaction.openingHours.deleteMany).toHaveBeenCalledWith({ where: { id: { in: ['removed'] } } })
    expect(mockTransaction.openingHours.update).toHaveBeenCalledWith({
      where: { id: 'updated' },
      data: updatedOpeningHour,
    })
    expect(mockTransaction.openingHours.create).toHaveBeenCalledWith({
      data: { ...newHolidayOpeningHour, studySite: { connect: { id: 'study-site-id' } } },
    })
  })
})
