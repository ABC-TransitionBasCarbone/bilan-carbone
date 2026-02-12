'use server'

import {
  createObjective,
  deleteObjective as dbDeleteObjective,
  getExistingObjectives,
  getObjectiveWithTransitionPlan,
  updateObjective,
} from '@/db/objective.db'
import { getTrajectoryWithTransitionPlan } from '@/db/transitionPlan'
import { withServerResponse } from '@/utils/serverResponse'
import { SubPost } from '@prisma/client'
import { NOT_AUTHORIZED } from '../permissions/check'
import { hasEditAccessOnStudy } from '../permissions/study'

export interface CreateObjectiveInput {
  trajectoryId: string
  targetYear: number
  reductionRate: number
  siteIds?: string[]
  tagIds?: string[]
  subPosts?: SubPost[]
}

export interface UpdateObjectiveInput {
  id: string
  targetYear: number
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
  const existingObjectives = await getExistingObjectives(trajectoryId, input.targetYear, excludeObjectiveId)
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

export const createSubObjective = async (input: CreateObjectiveInput) =>
  withServerResponse('createSubObjective', async () => {
    const trajectory = await getTrajectoryWithTransitionPlan(input.trajectoryId)
    if (!trajectory) {
      throw new Error('Trajectory not found')
    }

    const hasEditAccess = await hasEditAccessOnStudy(trajectory.transitionPlan.studyId)
    if (!hasEditAccess) {
      throw new Error(NOT_AUTHORIZED)
    }

    await validateUniqueScopeCombination(input.trajectoryId, input)

    return createObjective(input)
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

    return updateObjective(input)
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
