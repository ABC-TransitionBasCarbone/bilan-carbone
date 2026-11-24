import { isSourceForEnv } from '@/services/importEmissionFactor/import'
import { Environment, Import } from '@abc-transitionbascarbone/common/db/enums'
import { prismaClient } from './client'
import { getStudyCreationEmissionFactorVersions } from './study'

jest.mock('./client', () => ({
  prismaClient: { emissionFactorImportVersion: { findMany: jest.fn() } },
}))
jest.mock('@/services/permissions/study', () => ({}))
jest.mock('@/services/importEmissionFactor/import', () => ({ isSourceForEnv: jest.fn() }))
jest.mock('@/db/account', () => ({}))
jest.mock('@/utils/study', () => ({}))

describe('study creation emission factor versions', () => {
  const findMany = prismaClient.emissionFactorImportVersion.findMany as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it.each([
    [Environment.BC, [Import.BaseEmpreinte, Import.Manual, Import.CUT], [Import.BaseEmpreinte]],
    [Environment.COURSE_TILT, [Import.ABC, Import.Legifrance], [Import.ABC, Import.Legifrance]],
  ])('loads only the selectable sources configured for %s', async (environment, configuredSources, expectedSources) => {
    jest.mocked(isSourceForEnv).mockResolvedValue(configuredSources)
    findMany.mockResolvedValue([{ id: 'old-version', source: expectedSources[0], name: 'Old' }])

    expect(await getStudyCreationEmissionFactorVersions(environment)).toEqual([
      { id: 'old-version', source: expectedSources[0], name: 'Old' },
    ])
    expect(isSourceForEnv).toHaveBeenCalledWith(environment)
    expect(findMany).toHaveBeenCalledWith({
      select: { id: true, source: true, name: true },
      where: { source: { in: expectedSources } },
      orderBy: { createdAt: 'desc' },
    })
  })

  it('rejects a missing source configuration instead of creating a study without versions', async () => {
    jest.mocked(isSourceForEnv).mockResolvedValue([])

    await expect(getStudyCreationEmissionFactorVersions(Environment.BC)).rejects.toThrow(
      'No emission factor import sources configured for BC',
    )
    expect(findMany).not.toHaveBeenCalled()
  })
})
