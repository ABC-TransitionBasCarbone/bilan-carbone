'use server'

import { prismaClient } from '@/db/client'
import {
  createManyObjectiveSites,
  createManyObjectiveSubPosts,
  createManyObjectiveTags,
  createManyObjectivesAndReturn,
  deleteObjective as dbDeleteObjective,
  deleteObjectiveSites,
  deleteObjectiveSubPosts,
  deleteObjectiveTags,
  getObjectiveWithTransitionPlan,
  getSubObjectives,
  updateObjective,
} from '@/db/objective.db'
import { getTrajectoryType, updateTrajectoryType } from '@/db/trajectory'
import { getTrajectoryWithTransitionPlan } from '@/db/transitionPlan'
import { withServerResponse } from '@/utils/serverResponse'
import { SubPost, TrajectoryType } from '@prisma/client'
import { NOT_AUTHORIZED } from '../permissions/check'
import { hasEditAccessOnStudy } from '../permissions/study'

export interface CreateObjectiveInput {
  trajectoryId: string
  targetYear: number
  startYear?: number
  reductionRate: number
  siteIds?: string[]
  tagIds?: string[]
  subPosts?: SubPost[]
}

export interface UpdateObjectiveInput {
  id: string
  targetYear: number
  startYear?: number
  reductionRate: number
  siteIds?: string[]
  tagIds?: string[]
  subPosts?: SubPost[]
}

const createScopeHash = (sites: string[], tags: string[], posts: SubPost[]) =>
  `${sites.sort().join(',')}|${tags.sort().join(',')}|${posts.sort().join(',')}`

export const validateUniqueScopeCombination = async (
  trajectoryId: string,
  input: { targetYear: number; siteIds?: string[]; tagIds?: string[]; subPosts?: SubPost[] },
  excludeObjectiveId?: string,
) => {
  const existingObjectives = await getSubObjectives(trajectoryId, input.targetYear, excludeObjectiveId)
  const newHash = createScopeHash(input.siteIds || [], input.tagIds || [], input.subPosts || [])

  for (const objective of existingObjectives) {
    const existingHash = createScopeHash(
      objective.sites.map((s) => s.studySiteId),
      objective.tags.map((t) => t.studyTagId),
      objective.subPosts.map((sp) => sp.subPost),
    )

    if (newHash === existingHash) {
      throw new Error('duplicateScopeCombination')
    }
  }
}

export const createSubObjectives = async (inputs: CreateObjectiveInput[]) =>
  withServerResponse('createSubObjectives', async () => {
    if (inputs.length === 0) {
      return []
    }
    const trajectory = await getTrajectoryWithTransitionPlan(inputs[0].trajectoryId)
    if (!trajectory) {
      throw new Error('Trajectory not found')
    }
    const hasEditAccess = await hasEditAccessOnStudy(trajectory.transitionPlan.studyId)
    if (!hasEditAccess) {
      throw new Error(NOT_AUTHORIZED)
    }

    for (const input of inputs) {
      await validateUniqueScopeCombination(input.trajectoryId, input)
    }

    return prismaClient.$transaction(async (tx) => {
      const trajectoryData = await getTrajectoryType(inputs[0].trajectoryId, tx)
      if (!trajectoryData) {
        throw new Error('Trajectory not found')
      }

      const createdObjectives = await createManyObjectivesAndReturn(
        inputs.map((input) => ({
          trajectoryId: input.trajectoryId,
          targetYear: input.targetYear,
          startYear: input.startYear,
          reductionRate: input.reductionRate,
          isDefault: false,
        })),
        tx,
      )

      const objectiveSitesData = createdObjectives.flatMap((obj, i) =>
        (inputs[i].siteIds ?? []).map((siteId) => ({ objectiveId: obj.id, studySiteId: siteId })),
      )
      const objectiveTagsData = createdObjectives.flatMap((obj, i) =>
        (inputs[i].tagIds ?? []).map((tagId) => ({ objectiveId: obj.id, studyTagId: tagId })),
      )
      const objectiveSubPostsData = createdObjectives.flatMap((obj, i) =>
        (inputs[i].subPosts ?? []).map((subPost) => ({ objectiveId: obj.id, subPost })),
      )

      await Promise.all([
        createManyObjectiveSites(objectiveSitesData, tx),
        createManyObjectiveTags(objectiveTagsData, tx),
        createManyObjectiveSubPosts(objectiveSubPostsData, tx),
      ])

      if (trajectoryData.type !== 'CUSTOM') {
        await updateTrajectoryType(inputs[0].trajectoryId, TrajectoryType.CUSTOM, tx)
      }

      return createdObjectives
    })
  })

export const updateSubObjective = async (input: UpdateObjectiveInput) =>
  withServerResponse('updateSubObjective', async () => {
    const objective = await getObjectiveWithTransitionPlan(input.id)
    if (!objective) {
      throw new Error('Objective not found')
    }

    const hasEditAccess = await hasEditAccessOnStudy(objective.trajectory.transitionPlan.studyId)
    if (!hasEditAccess) {
      throw new Error(NOT_AUTHORIZED)
    }

    await validateUniqueScopeCombination(objective.trajectoryId, input, input.id)

    return prismaClient.$transaction(async (tx) => {
      await updateObjective(
        input.id,
        {
          targetYear: input.targetYear,
          startYear: input.startYear,
          reductionRate: input.reductionRate,
        },
        tx,
      )

      await deleteObjectiveSites(input.id, tx)
      await deleteObjectiveTags(input.id, tx)
      await deleteObjectiveSubPosts(input.id, tx)

      await createManyObjectiveSites(
        (input.siteIds ?? []).map((siteId) => ({ objectiveId: input.id, studySiteId: siteId })),
        tx,
      )
      await createManyObjectiveTags(
        (input.tagIds ?? []).map((tagId) => ({ objectiveId: input.id, studyTagId: tagId })),
        tx,
      )
      await createManyObjectiveSubPosts(
        (input.subPosts ?? []).map((subPost) => ({ objectiveId: input.id, subPost })),
        tx,
      )
    })
  })

export const deleteObjective = async (id: string) =>
  withServerResponse('deleteObjective', async () => {
    const objective = await getObjectiveWithTransitionPlan(id)
    if (!objective) {
      throw new Error('Objective not found')
    }

    const hasEditAccess = await hasEditAccessOnStudy(objective.trajectory.transitionPlan.studyId)
    if (!hasEditAccess) {
      throw new Error(NOT_AUTHORIZED)
    }

    await dbDeleteObjective(id)
  })
