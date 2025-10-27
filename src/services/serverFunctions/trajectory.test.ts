import * as studyDbModule from '@/db/study'
import * as transitionPlanDbModule from '@/db/transitionPlan'
import * as authModule from '@/services/auth'
import * as studyPermissionsModule from '@/services/permissions/study'
import { expect } from '@jest/globals'
import { TrajectoryType } from '@prisma/client'
import { CreateTrajectoryInput, createTrajectoryWithObjectives } from './trajectory'

// TODO: ESM module issue with Jest. Remove these mocks when moving to Vitest
jest.mock('../file', () => ({ download: jest.fn() }))
jest.mock('uuid', () => ({ v4: jest.fn() }))
jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => (key: string) => key) }))

jest.mock('../auth', () => ({
  auth: jest.fn(),
}))

jest.mock('../../db/transitionPlan', () => ({
  getTransitionPlanById: jest.fn(),
  createTrajectoryWithObjectives: jest.fn(),
}))

jest.mock('../../db/study', () => ({
  getStudyById: jest.fn(),
}))

jest.mock('../permissions/check', () => ({
  NOT_AUTHORIZED: 'NOT_AUTHORIZED',
}))

jest.mock('../permissions/study', () => ({
  hasEditAccessOnStudy: jest.fn(),
}))

const mockAuth = authModule.auth as jest.Mock
const mockGetTransitionPlanById = transitionPlanDbModule.getTransitionPlanById as jest.Mock
const mockGetStudyById = studyDbModule.getStudyById as jest.Mock
const mockHasEditAccessOnStudy = studyPermissionsModule.hasEditAccessOnStudy as jest.Mock
const mockCreateTrajectoryWithObjectives = transitionPlanDbModule.createTrajectoryWithObjectives as jest.Mock

describe('Trajectory Server Functions', () => {
  const mockSession = {
    user: {
      id: 'user-123',
      email: 'test@example.com',
    },
  }

  const mockTransitionPlan = {
    id: 'transition-plan-123',
    studyId: 'study-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockStudy = {
    id: 'study-123',
    name: 'Test Study',
    organizationVersionId: 'org-version-123',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.mockResolvedValue(mockSession)
    mockGetTransitionPlanById.mockResolvedValue(mockTransitionPlan)
    mockGetStudyById.mockResolvedValue(mockStudy)
    mockHasEditAccessOnStudy.mockResolvedValue(true)
    mockCreateTrajectoryWithObjectives.mockResolvedValue({ id: 'trajectory-123', name: 'Test Trajectory' })
  })

  describe('createTrajectoryWithObjectives', () => {
    const baseInput: Omit<CreateTrajectoryInput, 'type'> = {
      transitionPlanId: 'transition-plan-123',
      name: 'Test Trajectory',
      description: 'A test trajectory',
    }

    test('should create trajectory with SBTI_15 predefined objectives', async () => {
      const input = {
        ...baseInput,
        type: TrajectoryType.SBTI_15,
      }

      const result = await createTrajectoryWithObjectives(input)

      expect(result.success).toBe(true)
      expect(result.success).toBeTruthy()
      expect(transitionPlanDbModule.createTrajectoryWithObjectives).toHaveBeenCalledWith({
        transitionPlan: {
          connect: {
            id: 'transition-plan-123',
          },
        },
        name: 'Test Trajectory',
        description: 'A test trajectory',
        type: TrajectoryType.SBTI_15,
        objectives: {
          createMany: {
            data: [
              { targetYear: 2030, reductionRate: 0.042 },
              { targetYear: 2050, reductionRate: 0.042 },
            ],
          },
        },
      })
    })

    test('should create trajectory with SBTI_WB2C predefined objectives', async () => {
      const input = {
        ...baseInput,
        type: TrajectoryType.SBTI_WB2C,
      }

      await createTrajectoryWithObjectives(input)

      expect(transitionPlanDbModule.createTrajectoryWithObjectives).toHaveBeenCalledWith(
        expect.objectContaining({
          type: TrajectoryType.SBTI_WB2C,
          objectives: {
            createMany: {
              data: [
                { targetYear: 2030, reductionRate: 0.025 },
                { targetYear: 2050, reductionRate: 0.025 },
              ],
            },
          },
        }),
      )
    })

    test('should create trajectory with custom objectives', async () => {
      const input = {
        ...baseInput,
        type: TrajectoryType.CUSTOM,
        objectives: [
          { targetYear: 2035, reductionRate: 0.05 },
          { targetYear: 2040, reductionRate: 0.08 },
        ],
      }

      await createTrajectoryWithObjectives(input)

      expect(transitionPlanDbModule.createTrajectoryWithObjectives).toHaveBeenCalledWith(
        expect.objectContaining({
          type: TrajectoryType.CUSTOM,
          objectives: {
            createMany: {
              data: [
                { targetYear: 2035, reductionRate: 0.05 },
                { targetYear: 2040, reductionRate: 0.08 },
              ],
            },
          },
        }),
      )
    })

    test('should throw error if user is not authenticated', async () => {
      mockHasEditAccessOnStudy.mockResolvedValue(false)

      const result = await createTrajectoryWithObjectives({
        ...baseInput,
        type: TrajectoryType.SBTI_15,
      })

      expect(result.success).toBe(false)
      expect((result as { errorMessage: string }).errorMessage).toContain('NOT_AUTHORIZED')
    })

    test('should throw error if custom trajectory has no objectives', async () => {
      const input = {
        ...baseInput,
        type: TrajectoryType.CUSTOM,
        objectives: [],
      }

      const result = await createTrajectoryWithObjectives(input)

      expect(result.success).toBe(false)
      expect((result as { errorMessage: string }).errorMessage).toContain(
        'Custom trajectory must have at least 1 objective',
      )
    })
  })
})
