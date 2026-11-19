import { prismaClient } from '@/db/client'
import { createEmissionSourcesWithReturn, getFamilyTagsForStudy } from '@/db/emissionSource'
import { getOrganizationWithSitesById } from '@/db/organization'
import { createEmissionSourceTags, createStudy, getStudyById } from '@/db/study'
import {
  createAction,
  createTrajectoryWithObjectives,
  createTransitionPlan,
  getActions,
  getTrajectoriesByTransitionPlanId,
  getTransitionPlanByStudyId,
} from '@/db/transitionPlan'
import {
  getMockedFullStudy,
  getMockedFullStudySite,
  getMockeFullStudy,
  mockedEmissionSourceEmissionFactor,
  TEST_IDS,
} from '@/tests/utils/models/study'
import type { ActionWithRelations } from '@/types/trajectory.types'
import {
  ActionIndicatorType,
  ActionPotentialDeduction,
  Environment,
  Import,
  StudyRole,
  SubPost,
  TrajectoryType,
} from '@abc-transitionbascarbone/common/db/enums'
import {
  buildStudyForDuplication,
  duplicateEmissionSources,
  duplicateTrainingStudy,
  getSitesForDuplication,
} from './studyDuplication'

jest.mock('@/db/client', () => ({ prismaClient: {} }))
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
jest.mock('@/db/transitionPlan', () => ({
  getTransitionPlanByStudyId: jest.fn(),
  getTrajectoriesByTransitionPlanId: jest.fn(),
  createTransitionPlan: jest.fn(),
  createTrajectoryWithObjectives: jest.fn(),
  getActions: jest.fn(),
  createAction: jest.fn(),
  getExternalStudiesForTransitionPlan: jest.fn().mockResolvedValue([]),
  createExternalStudy: jest.fn(),
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
const mockGetTransitionPlan = jest.mocked(getTransitionPlanByStudyId)
const mockGetTrajectories = jest.mocked(getTrajectoriesByTransitionPlanId)
const mockCreateTransitionPlan = jest.mocked(createTransitionPlan)
const mockGetActions = jest.mocked(getActions)
const tagFamily = {
  id: 'source-family',
  name: 'Family',
  studyId: TEST_IDS.sourceStudy,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  tags: [
    {
      id: 'source-tag',
      familyId: 'source-family',
      name: 'Tag',
      color: null,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
  ],
}
const sourceSite = getMockedFullStudySite({ id: 'source-study-site' })
const sourceStudy = getMockeFullStudy({
  sites: [{ ...sourceSite, site: { ...sourceSite.site, id: TEST_IDS.site } }],
  tagFamilies: [tagFamily],
})
const copiedStudy = getMockedFullStudy({
  id: 'copied-study',
  sites: [{ ...sourceSite, id: 'copied-study-site', site: { ...sourceSite.site, id: 'copied-site' } }],
  tagFamilies: [
    {
      ...tagFamily,
      id: 'copied-family',
      studyId: 'copied-study',
      tags: [{ ...tagFamily.tags[0], id: 'copied-tag', familyId: 'copied-family' }],
    },
  ],
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
    mockGetTransitionPlan.mockResolvedValue(null)
    mockGetTrajectories.mockResolvedValue([])
    mockGetActions.mockResolvedValue([])
  })

  it('copies studies and their emissions onto the new site IDs with Validator rights', async () => {
    const sourceTransitionPlan = {
      id: 'source-plan',
      studyId: sourceStudy.id,
      sectenVersionId: 'secten-version',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    }
    const objective = {
      id: 'source-objective',
      trajectoryId: 'source-trajectory',
      name: 'Objectif de référence',
      startYear: 2026,
      targetYear: 2030,
      reductionRate: 0.4,
      isDefault: true,
      sites: [],
      tags: [],
      subPosts: [],
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    }
    const trajectory = {
      id: 'source-trajectory',
      transitionPlanId: sourceTransitionPlan.id,
      name: 'SNBC sectorielle',
      description: 'Trajectoire de référence',
      type: TrajectoryType.SNBC_SECTORAL,
      referenceYear: 2015,
      sectorPercentages: { energy: 100 },
      isDefault: true,
      objectives: [objective, { ...objective, id: 'custom-objective', isDefault: false }],
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    }
    mockGetTransitionPlan.mockResolvedValue(sourceTransitionPlan)
    mockCreateTransitionPlan.mockResolvedValue({
      ...sourceTransitionPlan,
      id: 'copied-plan',
      studyId: copiedStudy.id,
    })
    const action: ActionWithRelations = {
      id: 'source-action',
      transitionPlanId: sourceTransitionPlan.id,
      title: 'Reduce emissions',
      detailedDescription: 'Action description',
      potentialDeduction: ActionPotentialDeduction.Quantity,
      reductionDetails: 'Reduction details',
      reductionValueKg: 500,
      reductionStartYear: '2026',
      reductionEndYear: '2030',
      owner: 'Team',
      necessaryBudget: 1000,
      necesssaryRessources: 'Resources',
      facilitatorsAndObstacles: 'Obstacles',
      additionalInformation: 'Information',
      priority: 2,
      nature: [],
      category: [],
      relevance: [],
      enabled: false,
      createdAt: sourceTransitionPlan.createdAt,
      updatedAt: sourceTransitionPlan.updatedAt,
      indicators: [
        {
          id: 'source-indicator',
          actionId: 'source-action',
          type: ActionIndicatorType.Implementation,
          description: 'Indicator',
          createdAt: sourceTransitionPlan.createdAt,
          updatedAt: sourceTransitionPlan.updatedAt,
        },
      ],
      steps: [
        {
          id: 'source-step',
          actionId: 'source-action',
          title: 'First step',
          order: 0,
          createdAt: sourceTransitionPlan.createdAt,
          updatedAt: sourceTransitionPlan.updatedAt,
        },
      ],
      sites: [
        {
          id: 'source-action-site',
          actionId: 'source-action',
          studySiteId: sourceSite.id,
          studySite: {
            ...sourceSite,
            studyId: sourceStudy.id,
            siteId: TEST_IDS.site,
            cncVersionId: null,
            createdAt: sourceTransitionPlan.createdAt,
            updatedAt: sourceTransitionPlan.updatedAt,
          },
          createdAt: sourceTransitionPlan.createdAt,
          updatedAt: sourceTransitionPlan.updatedAt,
        },
      ],
      tags: [
        {
          id: 'source-action-tag',
          actionId: 'source-action',
          studyTagId: tagFamily.tags[0].id,
          studyTag: tagFamily.tags[0],
          createdAt: sourceTransitionPlan.createdAt,
          updatedAt: sourceTransitionPlan.updatedAt,
        },
      ],
      subPosts: [
        {
          id: 'source-action-subpost',
          actionId: 'source-action',
          subPost: SubPost.Electricite,
          createdAt: sourceTransitionPlan.createdAt,
          updatedAt: sourceTransitionPlan.updatedAt,
        },
      ],
    }
    const scopedObjective = {
      ...objective,
      id: 'custom-objective',
      isDefault: false,
      sites: action.sites.map(({ studySiteId, studySite, createdAt, updatedAt }) => ({
        id: 'objective-site',
        objectiveId: 'custom-objective',
        studySiteId,
        studySite,
        createdAt,
        updatedAt,
      })),
      tags: action.tags.map(({ studyTagId, studyTag, createdAt, updatedAt }) => ({
        id: 'objective-tag',
        objectiveId: 'custom-objective',
        studyTagId,
        studyTag,
        createdAt,
        updatedAt,
      })),
      subPosts: action.subPosts.map(({ subPost, createdAt, updatedAt }) => ({
        id: 'objective-subpost',
        objectiveId: 'custom-objective',
        subPost,
        createdAt,
        updatedAt,
      })),
    }
    mockGetTrajectories.mockResolvedValue([
      { ...trajectory, objectives: [objective, scopedObjective] },
      {
        ...trajectory,
        id: 'custom-trajectory',
        type: TrajectoryType.CUSTOM,
        isDefault: false,
        objectives: [objective, scopedObjective],
      },
    ])
    mockGetActions.mockResolvedValue([action])
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
    expect(mockGetTransitionPlan).toHaveBeenCalledWith(sourceStudy.id, prismaClient)
    expect(mockGetTrajectories).toHaveBeenCalledWith(sourceTransitionPlan.id, prismaClient)
    expect(mockCreateTransitionPlan).toHaveBeenCalledWith(copiedStudy.id, 'secten-version', prismaClient)
    expect(createTrajectoryWithObjectives).toHaveBeenCalledTimes(2)
    const copiedObjectives = [
      {
        name: objective.name,
        startYear: 2026,
        targetYear: 2030,
        reductionRate: 0.4,
        isDefault: true,
        sites: { create: [] },
        tags: { create: [] },
        subPosts: { create: [] },
      },
      {
        name: scopedObjective.name,
        startYear: 2026,
        targetYear: 2030,
        reductionRate: 0.4,
        isDefault: false,
        sites: { create: [{ studySiteId: 'copied-study-site' }] },
        tags: { create: [{ studyTagId: 'copied-tag' }] },
        subPosts: { create: [{ subPost: SubPost.Electricite }] },
      },
    ]
    expect(createTrajectoryWithObjectives).toHaveBeenCalledWith(
      {
        transitionPlan: { connect: { id: 'copied-plan' } },
        name: trajectory.name,
        description: trajectory.description,
        type: trajectory.type,
        referenceYear: trajectory.referenceYear,
        sectorPercentages: trajectory.sectorPercentages,
        isDefault: true,
        objectives: { create: copiedObjectives },
      },
      prismaClient,
    )
    expect(createTrajectoryWithObjectives).toHaveBeenCalledWith(
      expect.objectContaining({
        type: TrajectoryType.CUSTOM,
        isDefault: false,
        objectives: { create: copiedObjectives },
      }),
      prismaClient,
    )
    expect(mockGetActions).toHaveBeenCalledWith(sourceTransitionPlan.id, prismaClient)
    expect(createAction).toHaveBeenCalledTimes(1)
    expect(createAction).toHaveBeenCalledWith(
      {
        transitionPlanId: 'copied-plan',
        title: action.title,
        detailedDescription: action.detailedDescription,
        potentialDeduction: action.potentialDeduction,
        reductionDetails: action.reductionDetails,
        reductionValueKg: action.reductionValueKg,
        reductionStartYear: action.reductionStartYear,
        reductionEndYear: action.reductionEndYear,
        owner: action.owner,
        necessaryBudget: action.necessaryBudget,
        necesssaryRessources: action.necesssaryRessources,
        facilitatorsAndObstacles: action.facilitatorsAndObstacles,
        additionalInformation: action.additionalInformation,
        priority: 2,
        nature: [],
        category: [],
        relevance: [],
        enabled: false,
        indicators: { create: [{ type: ActionIndicatorType.Implementation, description: 'Indicator' }] },
        steps: { create: [{ title: 'First step', order: 0 }] },
        sites: { create: [{ studySiteId: 'copied-study-site' }] },
        tags: { create: [{ studyTagId: 'copied-tag' }] },
        subPosts: { create: [{ subPost: SubPost.Electricite }] },
      },
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
    expect(mockCreateTransitionPlan).not.toHaveBeenCalled()
    expect(createTrajectoryWithObjectives).not.toHaveBeenCalled()
    expect(mockGetActions).not.toHaveBeenCalled()
    expect(createAction).not.toHaveBeenCalled()
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

  it('links correction sources to copied manual factors and keeps base factors', async () => {
    const emission = sourceStudy.emissionSources[0]
    await duplicateTrainingStudy(
      {
        ...sourceStudy,
        emissionSources: [
          emission,
          {
            ...emission,
            emissionFactor: {
              ...mockedEmissionSourceEmissionFactor,
              id: 'base-factor',
              importedFrom: Import.BaseEmpreinte,
            },
          },
          { ...emission, emissionFactor: null },
        ],
      },
      [{ id: 'professor', environment: Environment.COURSE_BC }],
      StudyRole.Validator,
      prismaClient,
      undefined,
      {
        organizationVersionId: 'correction-client',
        siteIds,
        emissionFactorIds: new Map([[TEST_IDS.emissionFactor, 'copied-manual-factor']]),
      },
    )
    expect(mockCreateEmissions).toHaveBeenCalledWith(
      ['copied-manual-factor', 'base-factor', null].map((emissionFactorId) =>
        expect.objectContaining({ emissionFactorId }),
      ),
      prismaClient,
    )
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
