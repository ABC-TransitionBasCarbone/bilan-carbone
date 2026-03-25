import * as objectiveDbModule from '@/db/objective.db'
import * as trajectoryDbModule from '@/db/trajectory'
import * as transitionPlanDbModule from '@/db/transitionPlan'
import * as authModule from '@/services/auth'
import * as studyPermissionsModule from '@/services/permissions/study'
import { expect } from '@jest/globals'
import { SubPost } from '@repo/db-common/enums'
import {
  createSubObjectives,
  deleteObjective,
  updateSubObjective,
  validateUniqueScopeCombination,
} from './objective.serverFunction'

jest.mock('../file', () => ({ download: jest.fn() }))
jest.mock('uuid', () => ({ v4: jest.fn() }))
jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(() => (key: string) => key),
}))

jest.mock('../../db/client', () => ({
  prismaClient: {
    $transaction: jest.fn((callback) => callback({})),
  },
}))

jest.mock('../../db/objective.db', () => ({
  getSubObjectives: jest.fn(),
  getObjectiveWithTransitionPlan: jest.fn(),
  createManyObjectivesAndReturn: jest.fn(),
  createManyObjectiveSites: jest.fn(),
  createManyObjectiveTags: jest.fn(),
  createManyObjectiveSubPosts: jest.fn(),
  updateObjective: jest.fn(),
  deleteObjectiveSites: jest.fn(),
  deleteObjectiveTags: jest.fn(),
  deleteObjectiveSubPosts: jest.fn(),
  getObjectiveWithRelations: jest.fn(),
  deleteObjective: jest.fn(),
}))

jest.mock('../../db/trajectory', () => ({
  getTrajectoryType: jest.fn(),
  updateTrajectoryType: jest.fn(),
}))

jest.mock('../../db/transitionPlan', () => ({
  getTrajectoryWithTransitionPlan: jest.fn(),
}))

jest.mock('../permissions/check', () => ({
  NOT_AUTHORIZED: 'NOT_AUTHORIZED',
}))

jest.mock('../permissions/study', () => ({
  hasEditAccessOnStudy: jest.fn(),
}))

jest.mock('../auth', () => ({
  auth: jest.fn(),
}))

const mockGetSubObjectives = objectiveDbModule.getSubObjectives as jest.Mock
const mockGetObjectiveWithTransitionPlan = objectiveDbModule.getObjectiveWithTransitionPlan as jest.Mock
const mockGetTrajectoryType = trajectoryDbModule.getTrajectoryType as jest.Mock
const mockCreateManyObjectivesAndReturn = objectiveDbModule.createManyObjectivesAndReturn as jest.Mock
const mockCreateManyObjectiveSites = objectiveDbModule.createManyObjectiveSites as jest.Mock
const mockCreateManyObjectiveTags = objectiveDbModule.createManyObjectiveTags as jest.Mock
const mockCreateManyObjectiveSubPosts = objectiveDbModule.createManyObjectiveSubPosts as jest.Mock
const mockUpdateSingleObjective = objectiveDbModule.updateObjective as jest.Mock
const mockDeleteObjectiveSites = objectiveDbModule.deleteObjectiveSites as jest.Mock
const mockDeleteObjectiveTags = objectiveDbModule.deleteObjectiveTags as jest.Mock
const mockDeleteObjectiveSubPosts = objectiveDbModule.deleteObjectiveSubPosts as jest.Mock
const mockUpdateTrajectoryToCustom = trajectoryDbModule.updateTrajectoryType as jest.Mock
const mockDeleteObjective = objectiveDbModule.deleteObjective as jest.Mock
const mockGetTrajectoryWithTransitionPlan = transitionPlanDbModule.getTrajectoryWithTransitionPlan as jest.Mock
const mockHasEditAccessOnStudy = studyPermissionsModule.hasEditAccessOnStudy as jest.Mock
const mockAuth = authModule.auth as jest.Mock

const mockSession = { user: { id: 'user-123', email: 'test@example.com' } }
const mockTrajectory = {
  id: 'trajectory-1',
  transitionPlan: { studyId: 'study-1' },
}
const mockObjective = {
  id: 'objective-1',
  trajectoryId: 'trajectory-1',
  trajectory: { transitionPlan: { studyId: 'study-1' } },
}

const COMMON_SUBPOSTS: SubPost[] = [SubPost.Electricite, SubPost.CombustiblesFossiles, SubPost.Batiments]

describe('Objective Server Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.mockResolvedValue(mockSession)
    mockGetTrajectoryWithTransitionPlan.mockResolvedValue(mockTrajectory)
    mockGetObjectiveWithTransitionPlan.mockResolvedValue(mockObjective)
    mockHasEditAccessOnStudy.mockResolvedValue(true)
    mockGetTrajectoryType.mockResolvedValue({ type: 'LINEAR' })
    mockCreateManyObjectivesAndReturn.mockResolvedValue([{ id: 'new-objective' }])
    mockCreateManyObjectiveSites.mockResolvedValue(undefined)
    mockCreateManyObjectiveTags.mockResolvedValue(undefined)
    mockCreateManyObjectiveSubPosts.mockResolvedValue(undefined)
    mockUpdateSingleObjective.mockResolvedValue(undefined)
    mockDeleteObjectiveSites.mockResolvedValue(undefined)
    mockDeleteObjectiveTags.mockResolvedValue(undefined)
    mockDeleteObjectiveSubPosts.mockResolvedValue(undefined)
    mockUpdateTrajectoryToCustom.mockResolvedValue(undefined)
    mockDeleteObjective.mockResolvedValue(undefined)
  })

  describe('validateUniqueScopeCombination', () => {
    it('does not throw with exact same tags and subposts and targetYear but different sites', async () => {
      mockGetSubObjectives.mockResolvedValue([
        {
          id: 'obj-1',
          sites: [{ studySiteId: 'site-A' }],
          tags: [{ studyTagId: 'tag-1' }],
          subPosts: [{ subPost: SubPost.Electricite }, { subPost: SubPost.CombustiblesFossiles }],
        },
      ])

      await expect(
        validateUniqueScopeCombination('trajectory-1', {
          targetYear: 2030,
          siteIds: ['site-B'],
          tagIds: ['tag-1'],
          subPosts: [SubPost.Electricite, SubPost.CombustiblesFossiles],
        }),
      ).resolves.toBeUndefined()
    })

    it('does not throw with exact same sites and subposts and targetYear but different tags', async () => {
      mockGetSubObjectives.mockResolvedValue([
        {
          id: 'obj-1',
          sites: [{ studySiteId: 'site-A' }],
          tags: [{ studyTagId: 'tag-1' }],
          subPosts: [{ subPost: SubPost.Electricite }],
        },
      ])

      await expect(
        validateUniqueScopeCombination('trajectory-1', {
          targetYear: 2030,
          siteIds: ['site-A'],
          tagIds: ['tag-2'],
          subPosts: [SubPost.Electricite],
        }),
      ).resolves.toBeUndefined()
    })

    it('does not throw with exact same sites and tags and targetYear but slightly different subposts (3 common, 1 different)', async () => {
      const existingSubPosts = [...COMMON_SUBPOSTS, SubPost.Equipements]
      const newSubPosts = [...COMMON_SUBPOSTS, SubPost.DeplacementsDomicileTravail]

      mockGetSubObjectives.mockResolvedValue([
        {
          id: 'obj-1',
          sites: [{ studySiteId: 'site-A' }],
          tags: [{ studyTagId: 'tag-1' }],
          subPosts: existingSubPosts.map((sp) => ({ subPost: sp })),
        },
      ])

      await expect(
        validateUniqueScopeCombination('trajectory-1', {
          targetYear: 2030,
          siteIds: ['site-A'],
          tagIds: ['tag-1'],
          subPosts: newSubPosts,
        }),
      ).resolves.toBeUndefined()
    })

    it('throws duplicateScopeCombination when same sites, tags, subposts and targetYear', async () => {
      mockGetSubObjectives.mockResolvedValue([
        {
          id: 'obj-1',
          sites: [{ studySiteId: 'site-A' }],
          tags: [{ studyTagId: 'tag-1' }],
          subPosts: COMMON_SUBPOSTS.map((sp) => ({ subPost: sp })),
        },
      ])

      await expect(
        validateUniqueScopeCombination('trajectory-1', {
          targetYear: 2030,
          siteIds: ['site-A'],
          tagIds: ['tag-1'],
          subPosts: [...COMMON_SUBPOSTS],
        }),
      ).rejects.toThrow('duplicateScopeCombination')
    })

    it('does not throw when exact same scope but different targetYear', async () => {
      mockGetSubObjectives.mockResolvedValue([])

      await expect(
        validateUniqueScopeCombination('trajectory-1', {
          targetYear: 2035,
          siteIds: ['site-A'],
          tagIds: ['tag-1'],
          subPosts: [...COMMON_SUBPOSTS],
        }),
      ).resolves.toBeUndefined()

      expect(mockGetSubObjectives).toHaveBeenCalledWith('trajectory-1', 2035, undefined)
    })
  })

  describe('createSubObjectives', () => {
    const baseInput = {
      trajectoryId: 'trajectory-1',
      targetYear: 2030,
      startYear: 2024,
      reductionRate: 0.05,
      siteIds: ['site-A', 'site-B'],
      tagIds: ['tag-1'],
      subPosts: [...COMMON_SUBPOSTS],
    }

    it('succeeds when trajectory exists', async () => {
      mockGetSubObjectives.mockResolvedValue([])

      const result = await createSubObjectives([baseInput])

      expect(result.success).toBe(true)
      expect(result).toHaveProperty('data')
      expect(mockCreateManyObjectivesAndReturn).toHaveBeenCalled()
    })

    it('succeeds with multiple objectives', async () => {
      mockGetSubObjectives.mockResolvedValue([])
      mockCreateManyObjectivesAndReturn.mockResolvedValue([{ id: 'obj-1' }, { id: 'obj-2' }])

      const input2 = { ...baseInput, targetYear: 2035, startYear: 2030 }
      const result = await createSubObjectives([baseInput, input2])

      expect(result.success).toBe(true)
      expect(mockCreateManyObjectivesAndReturn).toHaveBeenCalled()
    })

    it('returns error when duplicate scope combination', async () => {
      mockGetSubObjectives.mockResolvedValue([
        {
          id: 'obj-1',
          sites: [{ studySiteId: 'site-A' }],
          tags: [{ studyTagId: 'tag-1' }],
          subPosts: COMMON_SUBPOSTS.map((sp) => ({ subPost: sp })),
        },
      ])

      const result = await createSubObjectives([
        {
          ...baseInput,
          siteIds: ['site-A'],
          tagIds: ['tag-1'],
          subPosts: [...COMMON_SUBPOSTS],
        },
      ])

      expect(result.success).toBe(false)
      expect((result as { errorMessage: string }).errorMessage).toBe('duplicateScopeCombination')
      expect(mockCreateManyObjectivesAndReturn).not.toHaveBeenCalled()
    })

    it('returns error when user has no edit access', async () => {
      mockHasEditAccessOnStudy.mockResolvedValue(false)

      const result = await createSubObjectives([baseInput])

      expect(result.success).toBe(false)
      expect(mockCreateManyObjectivesAndReturn).not.toHaveBeenCalled()
    })
  })

  describe('updateSubObjective', () => {
    const baseInput = {
      id: 'objective-1',
      targetYear: 2030,
      startYear: 2024,
      reductionRate: 0.05,
      siteIds: ['site-A'],
      tagIds: ['tag-1', 'tag-2'],
      subPosts: [...COMMON_SUBPOSTS],
    }

    it('succeeds when objective exists', async () => {
      mockGetSubObjectives.mockResolvedValue([])

      const result = await updateSubObjective(baseInput)

      expect(result.success).toBe(true)
      expect(result).toHaveProperty('data')
      expect(mockUpdateSingleObjective).toHaveBeenCalled()
    })

    it('returns error when user has no edit access', async () => {
      mockHasEditAccessOnStudy.mockResolvedValue(false)

      const result = await updateSubObjective(baseInput)

      expect(result.success).toBe(false)
      expect(mockUpdateSingleObjective).not.toHaveBeenCalled()
    })

    it('returns error when duplicate scope combination', async () => {
      mockGetSubObjectives.mockResolvedValue([
        {
          id: 'obj-2',
          sites: [{ studySiteId: 'site-A' }],
          tags: [{ studyTagId: 'tag-1' }],
          subPosts: COMMON_SUBPOSTS.map((sp) => ({ subPost: sp })),
        },
      ])

      const result = await updateSubObjective({
        ...baseInput,
        siteIds: ['site-A'],
        tagIds: ['tag-1'],
        subPosts: [...COMMON_SUBPOSTS],
      })

      expect(result.success).toBe(false)
      expect((result as { errorMessage: string }).errorMessage).toBe('duplicateScopeCombination')
      expect(mockUpdateSingleObjective).not.toHaveBeenCalled()
    })
  })

  describe('deleteObjective', () => {
    it('succeeds when objective exists and user has edit access', async () => {
      const result = await deleteObjective('objective-1')

      expect(result.success).toBe(true)
      expect(mockDeleteObjective).toHaveBeenCalledWith('objective-1')
    })

    it('returns error when user has no edit access', async () => {
      mockHasEditAccessOnStudy.mockResolvedValue(false)

      const result = await deleteObjective('objective-1')

      expect(result.success).toBe(false)
      expect(mockDeleteObjective).not.toHaveBeenCalled()
    })

    it('returns error when objective not found', async () => {
      mockGetObjectiveWithTransitionPlan.mockResolvedValue(null)

      const result = await deleteObjective('objective-1')

      expect(result.success).toBe(false)
      expect(mockDeleteObjective).not.toHaveBeenCalled()
    })
  })
})
