import { expect } from '@jest/globals'
import {
  ActionIndicatorType,
  ActionPotentialDeduction,
  ExternalStudy,
  Trajectory,
  TrajectoryType,
  TransitionPlanStudy,
} from '@prisma/client'
import {
  ActionWithRelations,
  duplicateTransitionPlanWithRelations,
  ObjectiveWithScope,
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
  overrides?: Partial<Trajectory & { objectives: ObjectiveWithScope[] }>,
): Trajectory & { objectives: ObjectiveWithScope[] } => ({
  id: 'trajectory-1',
  transitionPlanId: 'plan-id',
  name: 'Test Trajectory',
  description: 'A test trajectory',
  type: TrajectoryType.CUSTOM,
  referenceYear: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  sectorPercentages: {},
  objectives: [
    {
      id: 'objective-1',
      trajectoryId: 'trajectory-1',
      startYear: 2024,
      targetYear: 2030,
      reductionRate: 0.05,
      isDefault: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      sites: [],
      tags: [],
      subPosts: [],
    },
    {
      id: 'objective-2',
      trajectoryId: 'trajectory-1',
      startYear: 2030,
      targetYear: 2040,
      reductionRate: 0.08,
      isDefault: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      sites: [],
      tags: [],
      subPosts: [],
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

const createMockAction = (overrides?: Partial<ActionWithRelations>): ActionWithRelations => ({
  id: 'action-1',
  transitionPlanId: 'plan-id',
  title: 'Test Action',
  detailedDescription: 'Test description',
  potentialDeduction: ActionPotentialDeduction.Quality,
  reductionValueKg: 100,
  reductionStartYear: '2024',
  reductionEndYear: '2030',
  reductionDetails: 'Test details',
  owner: 'Test Owner',
  necessaryBudget: 10000,
  necesssaryRessources: 'Test resources',
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
  steps: [
    {
      id: 'step-1',
      actionId: 'action-1',
      title: 'Test step 1',
      order: 0,
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
  totalCo2Kg: 1000,
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
            create: [{ studyId: sourceTransitionPlan.studyId }, { studyId: 'linked-study-1' }],
          },
          trajectories: {
            create: sourceTransitionPlan.trajectories.map((trajectory) => ({
              name: trajectory.name,
              description: trajectory.description,
              type: trajectory.type,
              referenceYear: trajectory.referenceYear,
              sectorPercentages: trajectory.sectorPercentages,
              objectives: {
                create: trajectory.objectives.map((objective) => ({
                  targetYear: objective.targetYear,
                  reductionRate: objective.reductionRate,
                  isDefault: objective.isDefault,
                  sites: {
                    create: objective.sites.map((s) => ({ studySiteId: s.studySiteId })),
                  },
                  tags: {
                    create: objective.tags.map((t) => ({ studyTagId: t.studyTagId })),
                  },
                  subPosts: {
                    create: objective.subPosts.map((sp) => ({ subPost: sp.subPost })),
                  },
                })),
              },
            })),
          },
          actions: {
            create: sourceTransitionPlan.actions.map((action) => ({
              title: action.title,
              detailedDescription: action.detailedDescription,
              potentialDeduction: action.potentialDeduction,
              reductionValueKg: action.reductionValueKg,
              reductionStartYear: action.reductionStartYear,
              reductionEndYear: action.reductionEndYear,
              reductionDetails: action.reductionDetails,
              owner: action.owner,
              necessaryBudget: action.necessaryBudget,
              necesssaryRessources: action.necesssaryRessources,
              facilitatorsAndObstacles: action.facilitatorsAndObstacles,
              additionalInformation: action.additionalInformation,
              priority: action.priority,
              nature: action.nature,
              category: action.category,
              relevance: action.relevance,
              enabled: action.enabled,
              dependenciesOnly: action.dependenciesOnly,
              indicators: {
                create: action.indicators.map((indicator) => ({
                  type: indicator.type,
                  description: indicator.description,
                })),
              },
              steps: {
                create: action.steps.map((step) => ({
                  title: step.title,
                  order: step.order,
                })),
              },
            })),
          },
          externalStudies: {
            create: sourceTransitionPlan.externalStudies.map((externalStudy) => ({
              name: externalStudy.name,
              date: externalStudy.date,
              totalCo2Kg: externalStudy.totalCo2Kg,
            })),
          },
        },
        include: {
          trajectories: {
            include: {
              objectives: {
                include: {
                  sites: { include: { studySite: true } },
                  tags: { include: { studyTag: true } },
                  subPosts: true,
                },
              },
            },
          },
          transitionPlanStudies: true,
          actions: {
            include: {
              indicators: true,
              steps: true,
            },
          },
          externalStudies: true,
        },
      })
    })
  })
})
