import { expect } from '@jest/globals'
import {
  ActionIndicatorType,
  ActionPotentialDeduction,
  ExternalStudy,
  Objective,
  Trajectory,
  TrajectoryType,
  TransitionPlanStudy,
} from '@prisma/client'
import {
  ActionWithIndicators,
  duplicateTransitionPlanWithRelations,
  TransitionPlanWithRelations,
} from './transitionPlan'

const mockTx = {
  transitionPlan: {
    create: jest.fn(),
  },
}

jest.mock('./client', () => ({
  prismaClient: {
    $transaction: jest.fn((callback) => callback(mockTx)),
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

const createMockAction = (overrides?: Partial<ActionWithIndicators>): ActionWithIndicators => ({
  id: 'action-1',
  transitionPlanId: 'plan-id',
  title: 'Test Action',
  subSteps: 'Test sub steps',
  detailedDescription: 'Test description',
  potentialDeduction: ActionPotentialDeduction.Quality,
  reductionValue: 100,
  reductionStartYear: '2024',
  reductionEndYear: '2030',
  reductionDetails: 'Test details',
  owner: 'Test Owner',
  necessaryBudget: 10000,
  necesssaryRessources: 'Test resources',
  implementationDescription: 'Test implementation',
  implementationGoal: 50,
  followUpDescription: 'Test follow up',
  followUpGoal: 75,
  performanceDescription: 'Test performance',
  performanceGoal: 100,
  indicators: [
    {
      id: 'indicator-1',
      actionId: 'action-1',
      type: ActionIndicatorType.Implementation,
      description: 'Test implementation',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ],
  facilitatorsAndObstacles: 'Test facilitators',
  additionalInformation: 'Test info',
  priority: 1,
  nature: [],
  category: [],
  relevance: [],
  enabled: true,
  dependenciesOnly: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
})

const createMockExternalStudy = (overrides?: Partial<ExternalStudy>): ExternalStudy => ({
  id: 'external-1',
  transitionPlanId: 'plan-id',
  name: 'Test External Study',
  date: new Date('2024-01-01'),
  totalCo2: 1000,
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
  actions: [createMockAction()],
  externalStudies: [createMockExternalStudy()],
  ...overrides,
})

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
          actions: {
            create: sourceTransitionPlan.actions.map((action) => ({
              title: action.title,
              subSteps: action.subSteps,
              detailedDescription: action.detailedDescription,
              potentialDeduction: action.potentialDeduction,
              reductionValue: action.reductionValue,
              reductionStartYear: action.reductionStartYear,
              reductionEndYear: action.reductionEndYear,
              reductionDetails: action.reductionDetails,
              owner: action.owner,
              necessaryBudget: action.necessaryBudget,
              necesssaryRessources: action.necesssaryRessources,
              implementationDescription: action.implementationDescription,
              implementationGoal: action.implementationGoal,
              followUpDescription: action.followUpDescription,
              followUpGoal: action.followUpGoal,
              performanceDescription: action.performanceDescription,
              performanceGoal: action.performanceGoal,
              facilitatorsAndObstacles: action.facilitatorsAndObstacles,
              additionalInformation: action.additionalInformation,
              priority: action.priority,
              nature: action.nature,
              category: action.category,
              relevance: action.relevance,
              enabled: action.enabled,
              dependenciesOnly: action.dependenciesOnly,
            })),
          },
          externalStudies: {
            create: sourceTransitionPlan.externalStudies.map((externalStudy) => ({
              name: externalStudy.name,
              date: externalStudy.date,
              totalCo2: externalStudy.totalCo2,
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
          actions: true,
          externalStudies: true,
        },
      })
    })
  })
})
