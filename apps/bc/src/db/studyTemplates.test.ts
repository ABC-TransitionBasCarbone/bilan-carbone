import { DuplicableStudy, Environment } from '@abc-transitionbascarbone/common/db/enums'
import { prismaClient } from './client.server'
import { getStudyTemplates, upsertStudyTemplate } from './study'

jest.mock('./client.server', () => ({
  prismaClient: { studyTemplate: { findMany: jest.fn(), upsert: jest.fn() } },
}))
jest.mock('@/services/permissions/study', () => ({}))
jest.mock('@/db/account', () => ({}))
jest.mock('@/utils/study', () => ({}))

describe('multiple study templates', () => {
  beforeEach(() => jest.clearAllMocks())

  it('loads every correction template for the requested environment', async () => {
    const templates = [{ studyId: 'correction-1' }, { studyId: 'correction-2' }]
    const findMany = prismaClient.studyTemplate.findMany as jest.Mock
    findMany.mockResolvedValue(templates)
    expect(await getStudyTemplates(DuplicableStudy.TrainingCorrectionExercise, Environment.TILT, prismaClient)).toEqual(
      templates,
    )
    expect(findMany).toHaveBeenCalledWith({
      where: { environment: Environment.TILT, template: DuplicableStudy.TrainingCorrectionExercise },
      orderBy: { id: 'asc' },
    })
  })

  it('registers another study without replacing existing templates and remains idempotent', async () => {
    const upsert = prismaClient.studyTemplate.upsert as jest.Mock
    for (const studyId of ['correction-1', 'correction-2', 'correction-1']) {
      await upsertStudyTemplate(DuplicableStudy.TrainingCorrectionExercise, Environment.TILT, studyId)
    }
    expect(upsert.mock.calls.map(([command]) => command.where.environment_template_studyId.studyId)).toEqual([
      'correction-1',
      'correction-2',
      'correction-1',
    ])
    expect(upsert).toHaveBeenCalledWith({
      where: {
        environment_template_studyId: {
          environment: Environment.TILT,
          template: DuplicableStudy.TrainingCorrectionExercise,
          studyId: 'correction-2',
        },
      },
      update: {},
      create: {
        environment: Environment.TILT,
        template: DuplicableStudy.TrainingCorrectionExercise,
        studyId: 'correction-2',
      },
    })
  })
})
