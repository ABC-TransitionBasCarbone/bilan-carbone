'use server'

import {
  createSubObjective as dbCreateSubObjective,
  updateSubObjective as dbUpdateSubObjective,
  getExistingObjectives,
  getObjectiveWithTransitionPlan,
} from '@/db/objective.db'
import { deleteObjective as dbDeleteObjective, getTrajectoryWithTransitionPlan } from '@/db/transitionPlan'
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

export const validateUniqueScopeCombination = async (
  trajectoryId: string,
  input: { targetYear: number; siteIds?: string[]; tagIds?: string[]; subPosts?: SubPost[] },
  excludeObjectiveId?: string,
): Promise<void> => {
  const existingObjectives = await getExistingObjectives(trajectoryId, input.targetYear, excludeObjectiveId)

  const newSiteIds = new Set(input.siteIds || [])
  const newTagIds = new Set(input.tagIds || [])
  const newSubPosts = new Set(input.subPosts || [])

  for (const objective of existingObjectives) {
    const existingSiteIds = new Set(objective.sites?.map((s) => s.studySiteId) || [])
    const existingTagIds = new Set(objective.tags?.map((t) => t.studyTagId) || [])
    const existingSubPosts = new Set(objective.subPosts?.map((sp) => sp.subPost) || [])

    const sameSites =
      existingSiteIds.size === newSiteIds.size && [...existingSiteIds].every((id) => newSiteIds.has(id as string))
    const sameTags =
      existingTagIds.size === newTagIds.size && [...existingTagIds].every((id) => newTagIds.has(id as string))
    const sameSubPosts =
      existingSubPosts.size === newSubPosts.size && [...existingSubPosts].every((sp) => newSubPosts.has(sp as SubPost))

    if (sameSites && sameTags && sameSubPosts) {
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

    return dbCreateSubObjective(input)
  })

export const updateObjective = async (input: UpdateObjectiveInput) =>
  withServerResponse('updateObjective', async () => {
    const objective = await getObjectiveWithTransitionPlan(input.id)
    if (!objective) {
      throw new Error('Objective not found')
    }

    const hasEditAccess = await hasEditAccessOnStudy(objective.trajectory.transitionPlan.studyId)
    if (!hasEditAccess) {
      throw new Error(NOT_AUTHORIZED)
    }

    await validateUniqueScopeCombination(objective.trajectoryId, input, input.id)

    return dbUpdateSubObjective(input)
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
