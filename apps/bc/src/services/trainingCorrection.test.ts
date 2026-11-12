import { prismaClient } from '@/db/client.server'
import { getStudyById, getStudyTemplates } from '@/db/study'
import { getMockedFullStudy } from '@/tests/utils/models/study'
import { DuplicableStudy, Environment, StudyRole } from '@abc-transitionbascarbone/common/db/enums'
import { duplicateTrainingStudy } from './studyDuplication'
import { ensureProfessorCorrectionClient } from './trainingCorrection'

jest.mock('@/db/client.server', () => ({
  prismaClient: {
    organizationVersion: { findFirst: jest.fn(), create: jest.fn() },
    organization: { findUnique: jest.fn() },
    account: { findFirst: jest.fn() },
  },
}))
jest.mock('@/db/study', () => ({ getStudyTemplates: jest.fn(), getStudyById: jest.fn() }))
jest.mock('./studyDuplication', () => ({ duplicateTrainingStudy: jest.fn() }))
jest.mock('uuid', () => ({ v4: jest.fn(() => 'copied-site') }))

const mockFindClient = prismaClient.organizationVersion.findFirst as jest.Mock
const mockCreateClient = prismaClient.organizationVersion.create as jest.Mock
const mockFindOrganization = prismaClient.organization.findUnique as jest.Mock
const mockFindAccount = prismaClient.account.findFirst as jest.Mock
const mockTemplates = getStudyTemplates as jest.Mock
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
    mockFindAccount.mockResolvedValue({ id: 'professor-account' })
    mockFindOrganization.mockResolvedValue({ sites: [sourceSite] })
    mockTemplates.mockResolvedValue([{ studyId: 'correction-1' }, { studyId: 'correction-2' }])
    mockStudy.mockImplementation(async (id) => getMockedFullStudy({ id }))
    mockDuplicate.mockReset()
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
      })
    }
    expect(mockDuplicate.mock.calls.map(([study]) => study.id)).toEqual(['correction-1', 'correction-2'])
  })

  it('reuses an existing child without copying studies again', async () => {
    mockFindClient.mockResolvedValue({ id: 'existing-child' })
    expect(await ensureProfessorCorrectionClient('professor-org', Environment.COURSE_BC, prismaClient)).toEqual({
      id: 'existing-child',
    })
    expect(mockTemplates).not.toHaveBeenCalled()
    expect(mockCreateClient).not.toHaveBeenCalled()
    expect(mockDuplicate).not.toHaveBeenCalled()
  })

  it('rejects missing template configuration before creating a client', async () => {
    mockTemplates.mockResolvedValue([])
    await expect(ensureProfessorCorrectionClient('professor-org', Environment.COURSE_BC, prismaClient)).rejects.toThrow(
      'No TrainingCorrectionExercise template configured for BC',
    )
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
    await expect(ensureProfessorCorrectionClient('professor-org', Environment.COURSE_BC, prismaClient)).rejects.toThrow(
      'Invalid TrainingCorrectionExercise study',
    )
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
    await expect(ensureProfessorCorrectionClient('professor-org', Environment.COURSE_BC, prismaClient)).rejects.toThrow(
      'Professor account not found',
    )
    expect(mockCreateClient).not.toHaveBeenCalled()
  })

  it('rejects a missing source organization', async () => {
    mockFindOrganization.mockResolvedValue(null)
    await expect(ensureProfessorCorrectionClient('professor-org', Environment.COURSE_BC, prismaClient)).rejects.toThrow(
      'Template organization not found',
    )
  })

  it('rejects non-training environments', async () => {
    await expect(ensureProfessorCorrectionClient('professor-org', Environment.BC, prismaClient)).rejects.toThrow(
      'Cannot create professor corrections outside training environments',
    )
    expect(mockFindClient).not.toHaveBeenCalled()
  })
})
