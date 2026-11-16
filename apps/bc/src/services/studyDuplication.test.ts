import { prismaClient } from '@/db/client.server'
import { createEmissionSourcesWithReturn, getFamilyTagsForStudy } from '@/db/emissionSource'
import { getOrganizationWithSitesById } from '@/db/organization'
import { createEmissionSourceTags, createStudy, getStudyById } from '@/db/study'
import { getMockedFullStudy, getMockedFullStudySite, getMockeFullStudy, TEST_IDS } from '@/tests/utils/models/study'
import { Environment, StudyRole, SubPost } from '@abc-transitionbascarbone/common/db/enums'
import {
  buildStudyForDuplication,
  duplicateEmissionSources,
  duplicateTrainingStudy,
  getSitesForDuplication,
} from './studyDuplication'

jest.mock('@/db/client.server', () => ({ prismaClient: {} }))
jest.mock('@/db/emissionSource', () => ({
  createEmissionSourcesWithReturn: jest.fn(),
  getFamilyTagsForStudy: jest.fn(),
}))
jest.mock('@/db/organization', () => ({ getOrganizationWithSitesById: jest.fn() }))
jest.mock('@/db/study', () => ({
  createStudy: jest.fn(),
  getStudyById: jest.fn(),
  createEmissionSourceTags: jest.fn(),
}))
jest.mock('uuid', () => ({ v4: jest.fn(() => 'copied-emission') }))
jest.mock('../services/file', () => ({ download: jest.fn() }))
jest.mock('@/services/serverFunctions/emissionFactor', () => ({}))
jest.mock('@/services/serverFunctions/file', () => ({}))
jest.mock('@/services/serverFunctions/user', () => ({}))
jest.mock('@/services/serverFunctions/situation', () => ({}))

const mockOrganization = getOrganizationWithSitesById as jest.Mock
const mockCreateStudy = createStudy as jest.Mock
const mockGetStudy = jest.mocked(getStudyById)
const mockCreateEmissions = createEmissionSourcesWithReturn as jest.Mock
const mockTags = getFamilyTagsForStudy as jest.Mock
const sourceSite = getMockedFullStudySite({ id: 'source-study-site' })
const sourceStudy = getMockeFullStudy({
  sites: [{ ...sourceSite, site: { ...sourceSite.site, id: TEST_IDS.site } }],
})
const copiedStudy = getMockedFullStudy({
  id: 'copied-study',
  sites: [{ ...sourceSite, id: 'copied-study-site', site: { ...sourceSite.site, id: 'copied-site' } }],
})
const siteIds = new Map([[TEST_IDS.site, 'copied-site']])

describe('shared training study duplication', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockOrganization.mockResolvedValue({
      sites: [{ id: TEST_IDS.site, etp: 10, ca: 400, volunteerNumber: 3, beneficiaryNumber: 4, cnc: null }],
    })
    mockCreateStudy.mockResolvedValue({ id: copiedStudy.id })
    mockGetStudy.mockResolvedValue(copiedStudy)
    mockCreateEmissions.mockResolvedValue([{ id: 'copied-emission' }])
    mockTags.mockResolvedValue([])
  })

  it('copies studies and their emissions onto the new site IDs with Validator rights', async () => {
    await duplicateTrainingStudy(
      sourceStudy,
      [{ id: 'professor', environment: Environment.COURSE_BC }],
      StudyRole.Validator,
      prismaClient,
      undefined,
      { organizationVersionId: 'correction-client', siteIds },
    )
    const command = mockCreateStudy.mock.calls[0][0]
    expect(command.organizationVersion).toEqual({ connect: { id: 'correction-client' } })
    expect(command.sourceTemplateStudy).toEqual({ connect: { id: sourceStudy.id } })
    expect(command.createdBy).toEqual({ connect: { id: 'professor' } })
    expect(command.allowedUsers.createMany.data).toEqual([{ accountId: 'professor', role: StudyRole.Validator }])
    expect(command.sites.createMany.data[0].siteId).toBe('copied-site')
    expect(command.name).toBe(sourceStudy.name)
    expect(command.exports).toEqual({ create: sourceStudy.exports })
    expect(mockCreateEmissions).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          id: 'copied-emission',
          studyId: 'copied-study',
          studySiteId: 'copied-study-site',
          value: 100,
          validated: true,
          subPost: sourceStudy.emissionSources[0].subPost,
        }),
      ],
      prismaClient,
    )
  })

  it('preserves the legacy destination, shared sites, suffix and multiple learner rights', async () => {
    mockGetStudy.mockResolvedValue({
      ...copiedStudy,
      sites: [{ ...sourceSite, site: { ...sourceSite.site, id: TEST_IDS.site } }],
    })
    await duplicateTrainingStudy(
      sourceStudy,
      [
        { id: 'learner-1', environment: Environment.BC },
        { id: 'learner-2', environment: Environment.BC },
      ],
      StudyRole.Reader,
      prismaClient,
      ' - Formation',
    )
    const command = mockCreateStudy.mock.calls[0][0]
    expect(command.organizationVersion).toEqual({ connect: { id: sourceStudy.organizationVersion.id } })
    expect(command.createdBy).toEqual({ connect: { id: sourceStudy.createdById } })
    expect(command.name).toBe(`${sourceStudy.name} - Formation`)
    expect(command.sites.createMany.data[0].siteId).toBe(TEST_IDS.site)
    expect(command.allowedUsers.createMany.data).toEqual([
      { accountId: 'learner-1', role: StudyRole.Reader },
      { accountId: 'learner-2', role: StudyRole.Reader },
    ])
  })

  it('rejects missing copied site mappings instead of dropping study data', async () => {
    await expect(
      duplicateTrainingStudy(
        sourceStudy,
        [{ id: 'professor', environment: Environment.COURSE_BC }],
        StudyRole.Validator,
        prismaClient,
        undefined,
        { organizationVersionId: 'correction-client', siteIds: new Map() },
      ),
    ).rejects.toThrow('Missing copied site')
    expect(mockCreateStudy).not.toHaveBeenCalled()
  })

  it('preserves emission subposts between TILT and COURSE_TILT', async () => {
    const emission = { ...sourceStudy.emissionSources[0], subPost: SubPost.EquipementsDesSalaries }
    await duplicateEmissionSources(
      prismaClient,
      [emission],
      copiedStudy,
      sourceStudy.id,
      false,
      false,
      Environment.TILT,
      Environment.COURSE_TILT,
      siteIds,
    )
    expect(mockCreateEmissions.mock.calls[0][0][0].subPost).toBe(SubPost.EquipementsDesSalaries)
  })

  it('fails explicitly when an emission has no matching copied site', async () => {
    await expect(
      duplicateEmissionSources(
        prismaClient,
        sourceStudy.emissionSources,
        copiedStudy,
        sourceStudy.id,
        false,
        false,
        Environment.BC,
        Environment.COURSE_BC,
        new Map(),
      ),
    ).rejects.toThrow('Missing copied site for emission source')
    expect(mockCreateEmissions).not.toHaveBeenCalled()
  })

  it('still supports clearing validations and caracterisations on existing duplication flows', async () => {
    await duplicateEmissionSources(
      prismaClient,
      sourceStudy.emissionSources,
      copiedStudy,
      sourceStudy.id,
      true,
      true,
      Environment.BC,
      Environment.COURSE_BC,
      siteIds,
    )
    expect(mockCreateEmissions.mock.calls[0][0][0].validated).toBe(false)
    expect(mockCreateEmissions.mock.calls[0][0][0].caracterisation).toBeNull()
  })

  it('copies emission tag associations using the recreated tag family', async () => {
    const emission = sourceStudy.emissionSources[0]
    mockTags.mockResolvedValue([{ name: 'Famille', tags: [{ id: 'old-tag', name: 'Tag' }] }])
    const target = getMockedFullStudy({
      ...copiedStudy,
      tagFamilies: [
        {
          id: 'family',
          name: 'Famille',
          studyId: copiedStudy.id,
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
          tags: [
            {
              id: 'new-tag',
              name: 'Tag',
              color: null,
              familyId: 'family',
              createdAt: new Date('2026-01-01'),
              updatedAt: new Date('2026-01-01'),
            },
          ],
        },
      ],
    })
    await duplicateEmissionSources(
      prismaClient,
      [
        {
          ...emission,
          emissionSourceTags: [
            {
              tag: {
                id: 'old-tag',
                name: 'Tag',
                familyId: 'old-family',
                color: null,
                createdAt: new Date('2026-01-01'),
                updatedAt: new Date('2026-01-01'),
              },
            },
          ],
        },
      ],
      target,
      sourceStudy.id,
      false,
      false,
      Environment.BC,
      Environment.COURSE_BC,
      siteIds,
    )
    expect(createEmissionSourceTags).toHaveBeenCalledWith(
      [{ emissionSourceId: 'copied-emission', tagId: 'new-tag' }],
      prismaClient,
    )
  })

  it('uses organization values when legacy study site values are empty', async () => {
    const study = {
      ...sourceStudy,
      sites: sourceStudy.sites.map((site) => ({
        ...site,
        etp: 0,
        ca: 0,
        volunteerNumber: 0,
        beneficiaryNumber: 0,
      })),
    }
    expect(await getSitesForDuplication(study, prismaClient)).toEqual([
      { siteId: TEST_IDS.site, etp: 10, ca: 400, volunteerNumber: 3, beneficiaryNumber: 4 },
    ])
  })

  it('builds a copy with new relationships rather than existing users or sources', () => {
    const command = buildStudyForDuplication(
      { ...sourceStudy, sourceTemplateStudyId: 'original-template' },
      'creator',
      'destination',
      [],
      [],
      [],
    )
    expect(command).not.toHaveProperty('sourceTemplateStudyId')
    expect(command.emissionSources).toEqual({ createMany: { data: [] } })
    expect(command.contributors).toEqual({ createMany: { data: [] } })
    expect(command.emissionFactorVersions.createMany.data).toEqual(
      sourceStudy.emissionFactorVersions.map(({ source, importVersionId }) => ({ source, importVersionId })),
    )
  })
})
