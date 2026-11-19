import { prismaClient } from '@/db/client'
import { getStudyById, getStudyTemplates } from '@/db/study'
import {
  getMockedFullStudy,
  getMockeFullStudy,
  mockedEmissionSourceEmissionFactor,
  TEST_IDS,
} from '@/tests/utils/models/study'
import {
  DuplicableStudy,
  EmissionFactorPartType,
  Environment,
  Import,
  StudyRole,
} from '@abc-transitionbascarbone/common/db/enums'
import { duplicateTrainingStudy } from './studyDuplication'
import { ensureCourseProfessorCorrections, ensureProfessorCorrectionClient } from './trainingCorrection'

jest.mock('@/db/client', () => {
  const prismaClient = {
    organizationVersion: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn() },
    organization: { findUnique: jest.fn() },
    account: { findFirst: jest.fn() },
    study: { findMany: jest.fn() },
    site: { findMany: jest.fn(), createMany: jest.fn() },
    emissionFactor: { findMany: jest.fn(), create: jest.fn() },
    $transaction: jest.fn(),
  }
  prismaClient.$transaction.mockImplementation((operation) => operation(prismaClient))
  return { prismaClient }
})
jest.mock('@/db/study', () => ({ getStudyTemplates: jest.fn(), getStudyById: jest.fn() }))
jest.mock('./studyDuplication', () => ({ duplicateTrainingStudy: jest.fn() }))
jest.mock('uuid', () => ({ v4: jest.fn(() => 'copied-site') }))

const mockFindClient = prismaClient.organizationVersion.findFirst as jest.Mock
const mockCreateClient = prismaClient.organizationVersion.create as jest.Mock
const mockFindOrganization = prismaClient.organization.findUnique as jest.Mock
const mockFindAccount = prismaClient.account.findFirst as jest.Mock
const mockTemplates = getStudyTemplates as jest.Mock
const mockCopies = prismaClient.study.findMany as jest.Mock
const mockFindCopiedSites = prismaClient.site.findMany as jest.Mock
const mockProfessors = prismaClient.organizationVersion.findMany as jest.Mock
const mockStudy = jest.mocked(getStudyById)
const mockDuplicate = jest.mocked(duplicateTrainingStudy)
const sourceSite = {
  id: 'source-site',
  organizationId: 'source-organization',
  oldBCId: 'legacy-site',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  name: 'Site modèle',
  etp: 12,
  ca: 340000,
  postalCode: '75001',
  city: 'Paris',
  address: 'Adresse du site',
  country: null,
  volunteerNumber: 3,
  beneficiaryNumber: 4,
  cncId: null,
  establishmentId: null,
  establishmentYear: '2000',
  superficy: 120,
  studentNumber: 25,
  academy: 'Paris',
  establishmentType: null,
}

describe('professor correction client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFindClient.mockResolvedValue(null)
    mockCreateClient.mockResolvedValue({ id: 'correction-client' })
    mockFindAccount.mockResolvedValue({
      id: 'professor-account',
      organizationVersion: { organizationId: 'professor-organization' },
    })
    mockFindOrganization.mockResolvedValue({ sites: [sourceSite] })
    mockTemplates.mockResolvedValue([{ studyId: 'correction-1' }, { studyId: 'correction-2' }])
    mockStudy.mockImplementation(async (id) => getMockedFullStudy({ id }))
    mockDuplicate.mockReset()
    mockCopies.mockResolvedValue([])
    mockFindCopiedSites.mockResolvedValue([])
    mockProfessors.mockResolvedValue([])
  })

  it.each([
    [Environment.COURSE_BC, Environment.BC],
    [Environment.COURSE_TILT, Environment.TILT],
  ])('copies all %s corrections from %s with Validator rights and shared site mapping', async (environment, source) => {
    mockStudy.mockImplementation(async (id) => {
      const study = getMockedFullStudy({ id })
      return { ...study, organizationVersion: { ...study.organizationVersion, environment: source } }
    })
    await expect(ensureProfessorCorrectionClient('professor-org', environment, prismaClient)).resolves.toEqual({
      id: 'correction-client',
    })
    expect(mockTemplates).toHaveBeenCalledWith(DuplicableStudy.TrainingCorrectionExercise, source, prismaClient)
    expect(mockCreateClient).toHaveBeenCalledTimes(1)
    const data = mockCreateClient.mock.calls[0][0].data
    expect(data.environment).toBe(environment)
    expect(data.parent).toEqual({ connect: { id: 'professor-org' } })
    expect(data.organization.create.name).toBe('Etudes corrigées')
    expect(data.organization.create.sites.createMany.data).toEqual([
      expect.objectContaining({
        id: 'copied-site',
        name: sourceSite.name,
        etp: 12,
        ca: 340000,
        superficy: 120,
        studentNumber: 25,
        establishmentYear: '2000',
      }),
    ])
    expect(data.organization.create.sites.createMany.data[0]).not.toHaveProperty('organizationId')
    expect(data.organization.create.sites.createMany.data[0]).not.toHaveProperty('oldBCId')
    expect(mockDuplicate).toHaveBeenCalledTimes(2)
    for (const call of mockDuplicate.mock.calls) {
      expect(call[1]).toEqual([{ id: 'professor-account', environment }])
      expect(call[2]).toBe(StudyRole.Validator)
      expect(call[3]).toBe(prismaClient)
      expect(call[5]).toEqual({
        organizationVersionId: 'correction-client',
        siteIds: new Map([['source-site', 'copied-site']]),
        emissionFactorIds: new Map(),
      })
    }
    expect(mockDuplicate.mock.calls.map(([study]) => study.id)).toEqual(['correction-1', 'correction-2'])
    expect(prismaClient.emissionFactor.findMany).not.toHaveBeenCalled()
  })

  it('copies a shared manual factor with its parts and translations once per batch', async () => {
    const study = getMockeFullStudy()
    const manual = study.emissionSources[0]
    mockStudy.mockImplementation(async (id) => ({
      ...study,
      id,
      emissionSources: [
        manual,
        {
          ...manual,
          emissionFactor: {
            ...mockedEmissionSourceEmissionFactor,
            id: 'base-factor',
            importedFrom: Import.BaseEmpreinte,
          },
        },
      ],
    }))
    const translations = [
      { language: 'fr', title: 'Facteur' },
      { language: 'en', title: 'Factor' },
    ]
    const part = { type: EmissionFactorPartType.Amont, totalCo2: 12, metaData: [{ language: 'fr', title: 'Amont' }] }
    const factor = { importedFrom: Import.Manual, totalCo2: 42, co2f: 12 }
    const findFactors = prismaClient.emissionFactor.findMany as jest.Mock
    const createFactor = prismaClient.emissionFactor.create as jest.Mock
    findFactors.mockResolvedValue([
      {
        ...factor,
        id: TEST_IDS.emissionFactor,
        organizationId: 'source-organization',
        metaData: translations,
        emissionFactorParts: [part],
      },
    ])
    createFactor.mockResolvedValue({ id: 'copied-manual-factor' })

    await ensureProfessorCorrectionClient('professor-org', Environment.COURSE_BC, prismaClient)

    expect(findFactors).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: [TEST_IDS.emissionFactor] }, importedFrom: Import.Manual } }),
    )
    expect(createFactor).toHaveBeenCalledTimes(1)
    expect(createFactor).toHaveBeenCalledWith({
      data: {
        ...factor,
        organizationId: 'professor-organization',
        metaData: { create: translations },
        emissionFactorParts: { create: [{ ...part, metaData: { create: part.metaData } }] },
      },
      select: { id: true },
    })
    expect(mockDuplicate.mock.calls.map((call) => call[5]?.emissionFactorIds)).toEqual([
      new Map([[TEST_IDS.emissionFactor, 'copied-manual-factor']]),
      new Map([[TEST_IDS.emissionFactor, 'copied-manual-factor']]),
    ])
  })

  it('does not duplicate corrections if a required manual factor cannot be copied', async () => {
    mockStudy.mockResolvedValue(getMockeFullStudy())
    jest.mocked(prismaClient.emissionFactor.findMany).mockResolvedValue([])

    await expect(ensureProfessorCorrectionClient('professor-org', Environment.COURSE_BC, prismaClient)).rejects.toThrow(
      'Missing manual emission factors',
    )
    expect(mockDuplicate).not.toHaveBeenCalled()
  })

  it('reuses a renamed child whose corrections have all been copied without reading full studies', async () => {
    mockFindClient.mockResolvedValue({ id: 'existing-child', organizationId: 'client-org' })
    mockCopies.mockResolvedValue([{ sourceTemplateStudyId: 'correction-1' }, { sourceTemplateStudyId: 'correction-2' }])
    expect(await ensureProfessorCorrectionClient('professor-org', Environment.COURSE_BC, prismaClient)).toEqual({
      id: 'existing-child',
    })
    expect(mockCreateClient).not.toHaveBeenCalled()
    expect(mockDuplicate).not.toHaveBeenCalled()
    expect(mockStudy).not.toHaveBeenCalled()
    expect(prismaClient.site.createMany).not.toHaveBeenCalled()
    expect(mockCopies).toHaveBeenCalledWith({
      where: {
        organizationVersionId: 'existing-child',
        sourceTemplateStudyId: { in: ['correction-1', 'correction-2'] },
      },
      select: { sourceTemplateStudyId: true },
    })
    expect(mockFindClient).toHaveBeenCalledWith({
      where: { parentId: 'professor-org', environment: Environment.COURSE_BC },
      select: { id: true, organizationId: true },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    })
  })

  it('adds only missing corrections and new sites without modifying an existing client', async () => {
    mockFindClient.mockResolvedValue({ id: 'existing-child', organizationId: 'client-org' })
    mockCopies.mockResolvedValue([{ sourceTemplateStudyId: 'correction-1' }])

    await ensureProfessorCorrectionClient('professor-org', Environment.COURSE_BC, prismaClient)

    expect(mockCreateClient).not.toHaveBeenCalled()
    expect(mockStudy).toHaveBeenCalledTimes(1)
    expect(mockStudy).toHaveBeenCalledWith('correction-2', null, prismaClient)
    expect(mockDuplicate).toHaveBeenCalledTimes(1)
    expect(mockDuplicate.mock.calls[0][0].id).toBe('correction-2')
    expect(mockDuplicate.mock.calls[0][5]?.organizationVersionId).toBe('existing-child')
    expect(prismaClient.site.createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ id: 'copied-site', organizationId: 'client-org', name: sourceSite.name })],
    })
  })

  it('reuses copied sites regardless of case and accents and creates missing sites', async () => {
    mockFindClient.mockResolvedValue({ id: 'existing-child', organizationId: 'client-org' })
    mockCopies.mockResolvedValue([{ sourceTemplateStudyId: 'correction-1' }])
    mockFindOrganization.mockResolvedValue({
      sites: [sourceSite, { ...sourceSite, id: 'new-source-site', name: 'Nouveau site' }],
    })
    mockFindCopiedSites.mockResolvedValue([{ id: 'existing-site-copy', name: 'SITE MODELE' }])

    await ensureProfessorCorrectionClient('professor-org', Environment.COURSE_BC, prismaClient)

    expect(mockFindCopiedSites).toHaveBeenCalledWith({
      where: { organizationId: 'client-org' },
      select: { id: true, name: true },
    })
    expect(prismaClient.site.createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ id: 'copied-site', organizationId: 'client-org', name: 'Nouveau site' })],
    })
    expect(mockDuplicate).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'correction-2' }),
      [{ id: 'professor-account', environment: Environment.COURSE_BC }],
      StudyRole.Validator,
      prismaClient,
      undefined,
      {
        organizationVersionId: 'existing-child',
        siteIds: new Map([
          ['source-site', 'existing-site-copy'],
          ['new-source-site', 'copied-site'],
        ]),
        emissionFactorIds: new Map(),
      },
    )
  })

  it('creates no sites when they have all been copied already', async () => {
    mockFindClient.mockResolvedValue({ id: 'existing-child', organizationId: 'client-org' })
    mockCopies.mockResolvedValue([{ sourceTemplateStudyId: 'correction-1' }])
    mockFindCopiedSites.mockResolvedValue([
      { id: 'existing-site-copy', name: sourceSite.name },
      { id: 'other-site-1', name: 'Autre site' },
      { id: 'other-site-2', name: 'AUTRE SITE' },
    ])

    await ensureProfessorCorrectionClient('professor-org', Environment.COURSE_BC, prismaClient)

    expect(prismaClient.site.createMany).not.toHaveBeenCalled()
    expect(mockDuplicate.mock.calls[0][5]?.siteIds).toEqual(new Map([['source-site', 'existing-site-copy']]))
  })

  it('rejects ambiguous copied site names instead of linking a correction to an arbitrary site', async () => {
    mockFindClient.mockResolvedValue({ id: 'existing-child', organizationId: 'client-org' })
    mockCopies.mockResolvedValue([{ sourceTemplateStudyId: 'correction-1' }])
    mockFindCopiedSites.mockResolvedValue([
      { id: 'site-copy-1', name: sourceSite.name },
      { id: 'site-copy-2', name: 'SITE MODELE' },
    ])
    const log = jest.spyOn(console, 'error').mockImplementation()

    await expect(ensureProfessorCorrectionClient('professor-org', Environment.COURSE_BC, prismaClient)).rejects.toThrow(
      'Ambiguous correction site names',
    )

    expect(log).toHaveBeenCalledWith('ensureProfessorCorrectionClient: ambiguous site names', {
      professorOrganizationVersionId: 'professor-org',
    })
    expect(prismaClient.site.createMany).not.toHaveBeenCalled()
    expect(mockDuplicate).not.toHaveBeenCalled()
    log.mockRestore()
  })

  it('rejects distinct source sites with names differing only in case or accents', async () => {
    mockFindOrganization.mockResolvedValue({
      sites: [sourceSite, { ...sourceSite, id: 'other-source-site', name: 'SITE MODELE' }],
    })
    const log = jest.spyOn(console, 'error').mockImplementation()

    await expect(ensureProfessorCorrectionClient('professor-org', Environment.COURSE_BC, prismaClient)).rejects.toThrow(
      'Ambiguous correction site names',
    )

    expect(mockCreateClient).not.toHaveBeenCalled()
    expect(mockDuplicate).not.toHaveBeenCalled()
    log.mockRestore()
  })

  it('repairs an empty child without creating another client', async () => {
    mockFindClient.mockResolvedValue({ id: 'existing-child', organizationId: 'client-org' })
    await ensureProfessorCorrectionClient('professor-org', Environment.COURSE_BC, prismaClient)
    expect(mockCreateClient).not.toHaveBeenCalled()
    expect(mockDuplicate).toHaveBeenCalledTimes(2)
    expect(prismaClient.site.createMany).toHaveBeenCalledTimes(1)
  })

  it('rejects missing template configuration before creating a client', async () => {
    mockTemplates.mockResolvedValue([])
    const log = jest.spyOn(console, 'error').mockImplementation()
    await ensureProfessorCorrectionClient('professor-org', Environment.COURSE_BC, prismaClient)
    expect(log).toHaveBeenCalledWith('No TrainingCorrectionExercise template configured for BC')
    log.mockRestore()
    expect(mockCreateClient).not.toHaveBeenCalled()
  })

  it.each([
    null,
    getMockedFullStudy({
      organizationVersion: {
        ...getMockedFullStudy().organizationVersion,
        environment: Environment.TILT,
      },
    }),
  ])('rejects missing or cross-environment correction studies', async (study) => {
    mockStudy.mockResolvedValue(study)
    const log = jest.spyOn(console, 'error').mockImplementation()
    await ensureProfessorCorrectionClient('professor-org', Environment.COURSE_BC, prismaClient)
    expect(log).toHaveBeenCalledWith('Invalid TrainingCorrectionExercise study correction-1 for BC')
    log.mockRestore()
    expect(mockCreateClient).not.toHaveBeenCalled()
  })

  it('propagates a copy failure so the caller transaction can roll back', async () => {
    mockDuplicate.mockRejectedValue(new Error('Cannot copy emissions'))
    await expect(ensureProfessorCorrectionClient('professor-org', Environment.COURSE_BC, prismaClient)).rejects.toThrow(
      'Cannot copy emissions',
    )
  })

  it('rejects a missing professor account', async () => {
    mockFindAccount.mockResolvedValue(null)
    const log = jest.spyOn(console, 'error').mockImplementation()
    await ensureProfessorCorrectionClient('professor-org', Environment.COURSE_BC, prismaClient)
    expect(log).toHaveBeenCalledWith('Professor account not found for organization professor-org in COURSE_BC')
    log.mockRestore()
    expect(mockCreateClient).not.toHaveBeenCalled()
  })

  it('rejects a missing source organization', async () => {
    mockFindOrganization.mockResolvedValue(null)
    const log = jest.spyOn(console, 'error').mockImplementation()
    await ensureProfessorCorrectionClient('professor-org', Environment.COURSE_BC, prismaClient)
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Template organization not found'))
    log.mockRestore()
  })

  it('rejects non-training environments', async () => {
    const log = jest.spyOn(console, 'error').mockImplementation()
    await ensureProfessorCorrectionClient('professor-org', Environment.BC, prismaClient)
    expect(log).toHaveBeenCalledWith('Cannot create professor corrections outside training environments: BC')
    log.mockRestore()
    expect(mockFindClient).not.toHaveBeenCalled()
  })

  it('checks professors with sessions that are ongoing or ended within the last two weeks', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-11-12T12:00:00.000Z'))
    mockProfessors.mockResolvedValue([
      { id: 'existing-professor', environment: Environment.COURSE_BC },
      { id: 'new-professor', environment: Environment.COURSE_TILT },
    ])
    mockFindClient.mockResolvedValue({ id: 'child', organizationId: 'client-org' })
    mockCopies.mockResolvedValue([{ sourceTemplateStudyId: 'correction-1' }, { sourceTemplateStudyId: 'correction-2' }])
    try {
      await ensureCourseProfessorCorrections()
    } finally {
      jest.useRealTimers()
    }
    expect(mockProfessors).toHaveBeenCalledWith({
      where: {
        environment: { in: [Environment.COURSE_BC, Environment.COURSE_TILT] },
        professorCourseSessions: { some: { endDate: { gt: new Date('2026-10-29T12:00:00.000Z') } } },
      },
      select: { id: true, environment: true },
    })
    expect(mockFindClient.mock.calls.map(([query]) => query.where)).toEqual([
      { parentId: 'existing-professor', environment: Environment.COURSE_BC },
      { parentId: 'new-professor', environment: Environment.COURSE_TILT },
    ])
    expect(mockDuplicate).not.toHaveBeenCalled()
  })

  it('rolls back a failed professor and continues with the other environments', async () => {
    mockProfessors.mockResolvedValue([
      { id: 'failed-professor', environment: Environment.COURSE_BC },
      { id: 'bc-professor', environment: Environment.COURSE_BC },
      { id: 'tilt-professor', environment: Environment.COURSE_TILT },
    ])
    let studyCount = 0
    mockStudy.mockImplementation(async (id) => {
      studyCount++
      const study = getMockedFullStudy({ id })
      const environment = studyCount > 4 ? Environment.TILT : Environment.BC
      return { ...study, organizationVersion: { ...study.organizationVersion, environment } }
    })
    const error = new Error('Cannot copy emissions')
    mockDuplicate.mockRejectedValueOnce(error)
    const log = jest.spyOn(console, 'error').mockImplementation()

    try {
      await expect(ensureCourseProfessorCorrections()).resolves.toBeUndefined()
      expect(prismaClient.$transaction).toHaveBeenCalledTimes(3)
      await expect(jest.mocked(prismaClient.$transaction).mock.results[0].value).rejects.toThrow(error)
      expect(log).toHaveBeenCalledWith('Error creating correction studies for professor:', {
        professorOrganizationVersionId: 'failed-professor',
        environment: Environment.COURSE_BC,
        error,
      })
      expect(mockFindClient.mock.calls.map(([query]) => query.where.parentId)).toEqual([
        'failed-professor',
        'bc-professor',
        'tilt-professor',
      ])
      expect(mockDuplicate).toHaveBeenCalledTimes(5)
      expect(mockDuplicate.mock.calls[4][1]).toEqual([
        { id: 'professor-account', environment: Environment.COURSE_TILT },
      ])
    } finally {
      log.mockRestore()
    }
  })
})
