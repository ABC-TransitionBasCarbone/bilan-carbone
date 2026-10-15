import { getStudyEmissionSourceValidationGroups } from '@/db/study'
import { expect } from '@jest/globals'
import { getStudiesValidatedEmissionsSources } from './studyMetrics'

jest.mock('@/db/study', () => ({
  getStudyEmissionSourceValidationGroups: jest.fn(),
}))

const mockGetValidationGroups = getStudyEmissionSourceValidationGroups as jest.Mock

describe('getStudiesValidatedEmissionsSources', () => {
  it('groups source counts per study and initializes studies without sources', async () => {
    mockGetValidationGroups.mockResolvedValue([
      { studyId: 'study-id', validated: true, _count: 2 },
      { studyId: 'study-id', validated: false, _count: 1 },
    ])

    const result = await getStudiesValidatedEmissionsSources(['study-id', 'empty-study-id'])

    expect(result).toEqual({
      'study-id': { total: 3, validated: 2 },
      'empty-study-id': { total: 0, validated: 0 },
    })
  })
})
