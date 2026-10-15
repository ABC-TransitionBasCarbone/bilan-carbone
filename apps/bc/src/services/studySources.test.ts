import { createStudyEmissionFactorVersionIfAbsent, getSourceLatestImportVersionId } from '@/db/study'
import { isSourceForEnv } from '@/services/importEmissionFactor/import'
import { Environment, Import } from '@abc-transitionbascarbone/common/db/enums'
import { expect } from '@jest/globals'
import { addSourceToStudy } from './studySources'

jest.mock('@/db/study', () => ({
  createStudyEmissionFactorVersionIfAbsent: jest.fn(),
  getSourceLatestImportVersionId: jest.fn(),
}))

jest.mock('@/services/importEmissionFactor/import', () => ({
  isSourceForEnv: jest.fn(),
}))

const mockCreateStudyEmissionFactorVersionIfAbsent = createStudyEmissionFactorVersionIfAbsent as jest.Mock
const mockGetSourceLatestImportVersionId = getSourceLatestImportVersionId as jest.Mock
const mockIsSourceForEnv = isSourceForEnv as jest.Mock

describe('addSourceToStudy', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('does not add an import version unavailable in the study environment', async () => {
    mockIsSourceForEnv.mockResolvedValue([Import.Manual])

    await addSourceToStudy(Import.AIB, 'study-id', Environment.BC)

    expect(mockGetSourceLatestImportVersionId).not.toHaveBeenCalled()
    expect(mockCreateStudyEmissionFactorVersionIfAbsent).not.toHaveBeenCalled()
  })

  it('adds the latest eligible version idempotently', async () => {
    mockIsSourceForEnv.mockResolvedValue([Import.AIB])
    mockGetSourceLatestImportVersionId.mockResolvedValue({ id: 'version-id', source: Import.AIB })

    await addSourceToStudy(Import.AIB, 'study-id', Environment.BC)

    expect(mockCreateStudyEmissionFactorVersionIfAbsent).toHaveBeenCalledWith({
      studyId: 'study-id',
      source: Import.AIB,
      importVersionId: 'version-id',
    })
  })
})
