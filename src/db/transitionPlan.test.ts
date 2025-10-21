import { expect } from '@jest/globals'
import { Objective, Trajectory, TrajectoryType, TransitionPlanStudy } from '@prisma/client'
import { duplicateTransitionPlanWithRelations, TransitionPlanWithRelations } from './transitionPlan'

jest.mock('./client', () => ({
  prismaClient: {
    $transaction: jest.fn(),
    transitionPlan: {
      create: jest.fn(),
    },
  },
}))

const createMockTrajectory = (
  overrides?: Partial<Trajectory & { objectives: Objective[] }>,
): Trajectory & { objectives: Objective[] } => ({
  id: 'trajectory-1',
  transitionPlanId: 'plan-id',
  name: 'Test Trajectory',
  description: 'A test trajectory',
  type: TrajectoryType.CUSTOM,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  objectives: [
    {
      id: 'objective-1',
      trajectoryId: 'trajectory-1',
      targetYear: 2030,
      reductionRate: 0.05,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'objective-2',
      trajectoryId: 'trajectory-1',
      targetYear: 2040,
      reductionRate: 0.08,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ],
  ...overrides,
})

const createMockTransitionPlanStudy = (overrides?: Partial<TransitionPlanStudy>): Omit<TransitionPlanStudy, 'id'> => ({
  transitionPlanId: 'plan-id',
  studyId: 'study-id',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
})

const createMockTransitionPlan = (overrides?: Partial<TransitionPlanWithRelations>): TransitionPlanWithRelations => ({
  id: 'plan-id',
  studyId: 'study-id',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  trajectories: [createMockTrajectory()],
  transitionPlanStudies: [
    createMockTransitionPlanStudy({ studyId: 'study-id' }),
    createMockTransitionPlanStudy({ studyId: 'linked-study-1' }),
  ],
  ...overrides,
})

const mockTx = {
  transitionPlan: {
    create: jest.fn(),
  },
}

jest.mock('./client', () => ({
  prismaClient: {
    $transaction: jest.fn((callback) => callback(mockTx)),
  },
}))

describe('TransitionPlan DB', () => {
  describe('duplicateTransitionPlanWithRelations', () => {
    afterEach(() => {
      jest.clearAllMocks()
    })

    test('should duplicate transition plan with all relations', async () => {
      const sourceTransitionPlan = createMockTransitionPlan()
      await duplicateTransitionPlanWithRelations(sourceTransitionPlan, 'target-study-id')

      expect(mockTx.transitionPlan.create).toHaveBeenCalledWith({
        data: {
          studyId: 'target-study-id',
          transitionPlanStudies: {
            create: [{ studyId: 'target-study-id' }, { studyId: 'linked-study-1' }],
          },
          trajectories: {
            create: sourceTransitionPlan.trajectories.map((trajectory) => ({
              name: trajectory.name,
              description: trajectory.description,
              type: trajectory.type,
              objectives: {
                create: trajectory.objectives.map((objective) => ({
                  targetYear: objective.targetYear,
                  reductionRate: objective.reductionRate,
                })),
              },
            })),
          },
        },
        include: {
          trajectories: {
            include: {
              objectives: true,
            },
          },
          transitionPlanStudies: true,
        },
      })
    })
  })
})
