'use server'

import { prismaClient } from '@/db/client'
import { deleteObjective as dbDeleteObjective } from '@/db/transitionPlan'
import { withServerResponse } from '@/utils/serverResponse'
import { Prisma, SubPost } from '@prisma/client'
import { NOT_AUTHORIZED } from '../permissions/check'
import { hasEditAccessOnStudy, hasReadAccessOnStudy } from '../permissions/study'

type ObjectiveScopeInput = {
  siteIds?: string[]
  tagIds?: string[]
}

const validateObjectiveScopeOwnership = async (objectives: ObjectiveScopeInput[], studyId: string): Promise<void> => {
  const allSiteIds = objectives.flatMap((obj) => obj.siteIds || [])
  const allTagIds = objectives.flatMap((obj) => obj.tagIds || [])

  if (allSiteIds.length > 0) {
    const validSites = await prismaClient.studySite.findMany({
      where: { studyId, id: { in: allSiteIds } },
      select: { id: true },
    })
    const validSiteIds = new Set(validSites.map((s) => s.id))
    const invalidSiteId = allSiteIds.find((id) => !validSiteIds.has(id))
    if (invalidSiteId) {
      throw new Error('invalidScopeId')
    }
  }

  if (allTagIds.length > 0) {
    const validTags = await prismaClient.studyTag.findMany({
      where: { family: { studyId }, id: { in: allTagIds } },
      select: { id: true },
    })
    const validTagIds = new Set(validTags.map((t) => t.id))
    const invalidTagId = allTagIds.find((id) => !validTagIds.has(id))
    if (invalidTagId) {
      throw new Error('invalidScopeId')
    }
  }
}

const createObjectiveScopeRecords = async (
  tx: Prisma.TransactionClient,
  objectiveId: string,
  scope: { siteIds?: string[]; tagIds?: string[]; subPosts?: SubPost[] },
) => {
  if (scope.siteIds && scope.siteIds.length > 0) {
    await tx.objectiveSite.createMany({
      data: scope.siteIds.map((siteId) => ({ objectiveId, studySiteId: siteId })),
    })
  }
  if (scope.tagIds && scope.tagIds.length > 0) {
    await tx.objectiveTag.createMany({
      data: scope.tagIds.map((tagId) => ({ objectiveId, studyTagId: tagId })),
    })
  }
  if (scope.subPosts && scope.subPosts.length > 0) {
    await tx.objectiveSubPost.createMany({
      data: scope.subPosts.map((subPost) => ({ objectiveId, subPost })),
    })
  }
}

const validateUniqueScopeCombination = async (
  trajectoryId: string,
  input: { targetYear: number; siteIds?: string[]; tagIds?: string[]; subPosts?: SubPost[] },
  excludeObjectiveId?: string,
) => {
  const existingObjectives = await prismaClient.objective.findMany({
    where: {
      trajectoryId,
      targetYear: input.targetYear,
      isDefault: false,
      ...(excludeObjectiveId && { id: { not: excludeObjectiveId } }),
    },
    include: {
      sites: true,
      tags: true,
      subPosts: true,
    },
  })

  const newSiteIds = new Set(input.siteIds || [])
  const newTagIds = new Set(input.tagIds || [])
  const newSubPosts = new Set(input.subPosts || [])

  for (const existingObjective of existingObjectives) {
    const obj = existingObjective as typeof existingObjective & {
      sites: Array<{ studySiteId: string }>
      tags: Array<{ studyTagId: string }>
      subPosts: Array<{ subPost: SubPost }>
    }
    const existingSiteIds = new Set(obj.sites?.map((s) => s.studySiteId) || [])
    const existingTagIds = new Set(obj.tags?.map((t) => t.studyTagId) || [])
    const existingSubPosts = new Set(obj.subPosts?.map((sp) => sp.subPost) || [])

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

export const createObjective = async (input: CreateObjectiveInput) =>
  withServerResponse('createObjective', async () => {
    const trajectory = await prismaClient.trajectory.findUnique({
      where: { id: input.trajectoryId },
      include: { transitionPlan: true },
    })

    if (!trajectory) {
      throw new Error('Trajectory not found')
    }

    const hasEditAccess = await hasEditAccessOnStudy(trajectory.transitionPlan.studyId)
    if (!hasEditAccess) {
      throw new Error(NOT_AUTHORIZED)
    }

    await validateObjectiveScopeOwnership([input], trajectory.transitionPlan.studyId)
    await validateUniqueScopeCombination(input.trajectoryId, input)

    return prismaClient.$transaction(async (tx) => {
      const objective = await tx.objective.create({
        data: {
          trajectoryId: input.trajectoryId,
          targetYear: input.targetYear,
          reductionRate: input.reductionRate,
          isDefault: false,
        },
      })

      await createObjectiveScopeRecords(tx, objective.id, input)

      return objective
    })
  })

export const updateObjective = async (input: UpdateObjectiveInput) =>
  withServerResponse('updateObjective', async () => {
    const objective = await prismaClient.objective.findUnique({
      where: { id: input.id },
      include: {
        trajectory: {
          include: { transitionPlan: true },
        },
      },
    })

    if (!objective) {
      throw new Error('Objective not found')
    }

    const hasEditAccess = await hasEditAccessOnStudy(objective.trajectory.transitionPlan.studyId)
    if (!hasEditAccess) {
      throw new Error(NOT_AUTHORIZED)
    }

    await validateObjectiveScopeOwnership([input], objective.trajectory.transitionPlan.studyId)
    await validateUniqueScopeCombination(objective.trajectoryId, input, input.id)

    return prismaClient.$transaction(async (tx) => {
      await tx.objective.update({
        where: { id: input.id },
        data: {
          targetYear: input.targetYear,
          reductionRate: input.reductionRate,
        },
      })

      const txWithScope = tx as typeof tx & {
        objectiveSite: { deleteMany: (args: { where: { objectiveId: string } }) => Promise<unknown> }
        objectiveTag: { deleteMany: (args: { where: { objectiveId: string } }) => Promise<unknown> }
        objectiveSubPost: { deleteMany: (args: { where: { objectiveId: string } }) => Promise<unknown> }
      }

      await txWithScope.objectiveSite.deleteMany({ where: { objectiveId: input.id } })
      await txWithScope.objectiveTag.deleteMany({ where: { objectiveId: input.id } })
      await txWithScope.objectiveSubPost.deleteMany({ where: { objectiveId: input.id } })

      await createObjectiveScopeRecords(tx, input.id, input)

      return tx.objective.findUnique({
        where: { id: input.id },
        include: {
          sites: {
            include: {
              studySite: true,
            },
          },
          tags: {
            include: {
              studyTag: true,
            },
          },
          subPosts: true,
        },
      })
    })
  })

export const deleteObjective = async (id: string) =>
  withServerResponse('deleteObjective', async () => {
    const objective = await prismaClient.objective.findUnique({
      where: { id },
      include: {
        trajectory: {
          include: { transitionPlan: true },
        },
      },
    })
    if (!objective) {
      throw new Error('Objective not found')
    }

    const hasEditAccess = await hasEditAccessOnStudy(objective.trajectory.transitionPlan.studyId)
    if (!hasEditAccess) {
      throw new Error(NOT_AUTHORIZED)
    }

    await dbDeleteObjective(id)
  })

export const getStudySitesForTrajectory = async (studyId: string) =>
  withServerResponse('getStudySitesForTrajectory', async () => {
    const hasReadAccess = await hasReadAccessOnStudy(studyId)
    if (!hasReadAccess) {
      throw new Error(NOT_AUTHORIZED)
    }

    return prismaClient.studySite.findMany({
      where: { studyId },
      include: {
        site: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        site: {
          name: 'asc',
        },
      },
    })
  })

export const getStudyTagsForTrajectory = async (studyId: string) =>
  withServerResponse('getStudyTagsForTrajectory', async () => {
    const hasReadAccess = await hasReadAccessOnStudy(studyId)
    if (!hasReadAccess) {
      throw new Error(NOT_AUTHORIZED)
    }

    return prismaClient.studyTag.findMany({
      where: {
        family: {
          studyId,
        },
      },
      include: {
        family: true,
      },
      orderBy: [
        {
          family: {
            name: 'asc',
          },
        },
        {
          name: 'asc',
        },
      ],
    })
  })
