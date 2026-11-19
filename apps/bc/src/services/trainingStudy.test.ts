import { prismaClient } from '@/db/client'
import { getStudyTemplates } from '@/db/study'
import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import { assignTrainingCorrectionExerciseStudy, assignTrainingExerciseStudy } from './trainingStudy'

jest.mock('@/db/client', () => ({ prismaClient: { account: { findMany: jest.fn() } } }))
jest.mock('@/db/study', () => ({
  getStudyById: jest.fn(),
  getStudyTemplates: jest.fn(),
  upsertStudyTemplate: jest.fn(),
}))
jest.mock('./studyDuplication', () => ({ duplicateTrainingStudy: jest.fn() }))

describe('paused historical TILT learner assignments', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(prismaClient.account.findMany).mockResolvedValue([])
  })

  it('excludes TILT from the beginning-of-training exercise job', async () => {
    expect(await assignTrainingExerciseStudy()).toEqual({ created: 0, error: 0 })
    expect(prismaClient.account.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ environment: { not: Environment.TILT } }),
      }),
    )
    expect(getStudyTemplates).not.toHaveBeenCalled()
  })

  it('excludes TILT from the end-of-training correction job', async () => {
    expect(await assignTrainingCorrectionExerciseStudy()).toEqual([])
    expect(prismaClient.account.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ environment: { not: Environment.TILT } }),
      }),
    )
    expect(getStudyTemplates).not.toHaveBeenCalled()
  })
})
