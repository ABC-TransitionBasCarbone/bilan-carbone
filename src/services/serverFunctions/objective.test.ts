import * as objectiveDbModule from '@/db/objective.db'
import * as transitionPlanDbModule from '@/db/transitionPlan'
import * as authModule from '@/services/auth'
import * as studyPermissionsModule from '@/services/permissions/study'
import { expect } from '@jest/globals'
import { SubPost } from '@prisma/client'
import { createSubObjective, updateSubObjective, validateUniqueScopeCombination } from './objective.serverFunction'

jest.mock('../file', () => ({ download: jest.fn() }))
jest.mock('uuid', () => ({ v4: jest.fn() }))
jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(() => (key: string) => key),
}))

jest.mock('../../db/objective.db', () => ({
  getExistingObjectives: jest.fn(),
  getObjectiveWithTransitionPlan: jest.fn(),
  createObjective: jest.fn(),
  updateObjective: jest.fn(),
  deleteObjective: jest.fn(),
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

const mockGetExistingObjectives = objectiveDbModule.getExistingObjectives as jest.Mock
const mockGetObjectiveWithTransitionPlan = objectiveDbModule.getObjectiveWithTransitionPlan as jest.Mock
const mockGetTrajectoryWithTransitionPlan = transitionPlanDbModule.getTrajectoryWithTransitionPlan as jest.Mock
const mockCreateObjective = objectiveDbModule.createObjective as jest.Mock
const mockUpdateObjective = objectiveDbModule.updateObjective as jest.Mock
const mockDeleteObjective = objectiveDbModule.deleteObjective as jest.Mock
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
    mockCreateObjective.mockResolvedValue({ id: 'new-objective' })
    mockUpdateObjective.mockResolvedValue({ id: 'objective-1' })
    mockDeleteObjective.mockResolvedValue(undefined)
  })

  describe('validateUniqueScopeCombination', () => {
    it('does not throw with exact same tags and subposts and targetYear but different sites', async () => {
      mockGetExistingObjectives.mockResolvedValue([
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
      mockGetExistingObjectives.mockResolvedValue([
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

      mockGetExistingObjectives.mockResolvedValue([
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
      mockGetExistingObjectives.mockResolvedValue([
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
      mockGetExistingObjectives.mockResolvedValue([])

      await expect(
        validateUniqueScopeCombination('trajectory-1', {
          targetYear: 2035,
          siteIds: ['site-A'],
          tagIds: ['tag-1'],
          subPosts: [...COMMON_SUBPOSTS],
        }),
      ).resolves.toBeUndefined()

      expect(mockGetExistingObjectives).toHaveBeenCalledWith('trajectory-1', 2035, undefined)
    })
  })

  describe('createSubObjective', () => {
    const baseInput = {
      trajectoryId: 'trajectory-1',
      targetYear: 2030,
      reductionRate: 0.05,
      siteIds: ['site-A', 'site-B'],
      tagIds: ['tag-1'],
      subPosts: [...COMMON_SUBPOSTS],
    }

    it('succeeds when trajectory exists', async () => {
      mockGetExistingObjectives.mockResolvedValue([])

      const result = await createSubObjective(baseInput)

      expect(result.success).toBe(true)
      expect(result).toHaveProperty('data')
      expect(mockCreateObjective).toHaveBeenCalledWith(baseInput)
    })

    it('returns error when duplicate scope combination', async () => {
      mockGetExistingObjectives.mockResolvedValue([
        {
          id: 'obj-1',
          sites: [{ studySiteId: 'site-A' }],
          tags: [{ studyTagId: 'tag-1' }],
          subPosts: COMMON_SUBPOSTS.map((sp) => ({ subPost: sp })),
        },
      ])

      const result = await createSubObjective({
        ...baseInput,
        siteIds: ['site-A'],
        tagIds: ['tag-1'],
        subPosts: [...COMMON_SUBPOSTS],
      })

      expect(result.success).toBe(false)
      expect((result as { errorMessage: string }).errorMessage).toBe('duplicateScopeCombination')
      expect(mockCreateObjective).not.toHaveBeenCalled()
    })
  })

  describe('updateSubObjective', () => {
    const baseInput = {
      id: 'objective-1',
      targetYear: 2030,
      reductionRate: 0.05,
      siteIds: ['site-A'],
      tagIds: ['tag-1', 'tag-2'],
      subPosts: [...COMMON_SUBPOSTS],
    }

    it('succeeds when objective exists', async () => {
      mockGetExistingObjectives.mockResolvedValue([])

      const result = await updateSubObjective(baseInput)

      expect(result.success).toBe(true)
      expect(result).toHaveProperty('data')
      expect(mockUpdateObjective).toHaveBeenCalledWith(baseInput)
    })

    it('returns error when duplicate scope combination', async () => {
      mockGetExistingObjectives.mockResolvedValue([
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
      expect(mockUpdateObjective).not.toHaveBeenCalled()
    })
  })
})
