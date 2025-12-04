import * as studyDbModule from '@/db/study'
import * as transitionPlanDbModule from '@/db/transitionPlan'
import { expect } from '@jest/globals'
import * as authModule from '../auth'
import * as transitionPlanModule from './transitionPlan'

// TODO: ESM module issue with Jest. Remove these mocks when moving to Vitest
jest.mock('uuid', () => ({ v4: jest.fn() }))
jest.mock('../auth', () => ({ auth: jest.fn(), dbActualizedAuth: jest.fn() }))
jest.mock('../file', () => ({ download: jest.fn() }))
jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(() => (key: string) => key),
}))

jest.mock('../../db/transitionPlan', () => ({
  getTransitionPlanByIdWithRelations: jest.fn(),
  duplicateTransitionPlanWithRelations: jest.fn(),
}))

jest.mock('../../db/study', () => ({
  getStudyById: jest.fn(),
}))

const mockGetTransitionPlanByIdWithRelations = transitionPlanDbModule.getTransitionPlanByIdWithRelations as jest.Mock
const mockDuplicateTransitionPlanWithRelations =
  transitionPlanDbModule.duplicateTransitionPlanWithRelations as jest.Mock
const mockGetStudyById = studyDbModule.getStudyById as jest.Mock
const mockdbActualizedAuth = authModule.dbActualizedAuth as jest.Mock

const mockedSourceTransitionPlan = {
  id: 'mocked-transition-plan-id',
  studyId: 'mocked-source-study-id',
}

describe('Transition plan Server Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('duplicateTransitionPlan', () => {
    beforeEach(() => {
      mockGetTransitionPlanByIdWithRelations.mockResolvedValue(mockedSourceTransitionPlan)
      mockDuplicateTransitionPlanWithRelations.mockResolvedValue({
        id: 'mocked-target-study-transition-plan-id',
      })
    })

    it('Should not link source study if not older than the target one', async () => {
      mockGetStudyById
        .mockResolvedValueOnce({ id: 'mocked-source-study-id', startDate: new Date('2024-01-01') })
        .mockResolvedValueOnce({ id: 'mocked-target-study-id', startDate: new Date('2024-01-01') })

      await transitionPlanModule.duplicateTransitionPlan('mocked-transition-plan-id', 'mocked-target-study-id')

      expect(mockGetTransitionPlanByIdWithRelations).toHaveBeenCalledWith('mocked-transition-plan-id')
      expect(mockDuplicateTransitionPlanWithRelations).toHaveBeenCalledWith(
        mockedSourceTransitionPlan,
        'mocked-target-study-id',
      )
      expect(mockGetStudyById).toHaveBeenCalledTimes(2)
      expect(mockGetStudyById).toHaveBeenCalledWith('mocked-source-study-id', null)
      expect(mockGetStudyById).toHaveBeenCalledWith('mocked-target-study-id', null)

      // first function called by linkOldStudy() that cannot be mocked
      expect(mockdbActualizedAuth).not.toHaveBeenCalled()
    })

    it('Should link source study if older than the target one', async () => {
      mockGetStudyById
        .mockResolvedValueOnce({ id: 'mocked-source-study-id', startDate: new Date('2023-01-01') })
        .mockResolvedValueOnce({ id: 'mocked-target-study-id', startDate: new Date('2024-01-01') })

      await transitionPlanModule.duplicateTransitionPlan('mocked-transition-plan-id', 'mocked-target-study-id')

      expect(mockGetTransitionPlanByIdWithRelations).toHaveBeenCalledWith('mocked-transition-plan-id')
      expect(mockDuplicateTransitionPlanWithRelations).toHaveBeenCalledWith(
        mockedSourceTransitionPlan,
        'mocked-target-study-id',
      )
      expect(mockGetStudyById).toHaveBeenCalledTimes(2)
      expect(mockGetStudyById).toHaveBeenCalledWith('mocked-source-study-id', null)
      expect(mockGetStudyById).toHaveBeenCalledWith('mocked-target-study-id', null)

      // first function called by linkOldStudy() that cannot be mocked
      expect(mockdbActualizedAuth).toHaveBeenCalled()
    })
  })
})
