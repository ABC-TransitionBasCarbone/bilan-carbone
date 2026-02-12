'use server'

import { SubPost } from '@prisma/client'
import { prismaClient } from './client'

export const getExistingObjectives = async (trajectoryId: string, targetYear: number, excludeObjectiveId?: string) =>
  prismaClient.objective.findMany({
    where: {
      trajectoryId,
      targetYear,
      isDefault: false,
      ...(excludeObjectiveId && { id: { not: excludeObjectiveId } }),
    },
    select: {
      id: true,
      sites: { select: { studySiteId: true } },
      tags: { select: { studyTagId: true } },
      subPosts: { select: { subPost: true } },
    },
  })

export const getObjectiveWithTransitionPlan = async (id: string) =>
  prismaClient.objective.findUnique({
    where: { id },
    include: {
      trajectory: {
        include: { transitionPlan: true },
      },
    },
  })

export const createObjective = async (input: {
  trajectoryId: string
  targetYear: number
  reductionRate: number
  siteIds?: string[]
  tagIds?: string[]
  subPosts?: SubPost[]
}) => {
  return prismaClient.$transaction(async (tx) => {
    const trajectory = await tx.trajectory.findUnique({
      where: { id: input.trajectoryId },
      select: { type: true },
    })

    if (!trajectory) {
      throw new Error('Trajectory not found')
    }

    const shouldConvertToCustom = trajectory.type !== 'CUSTOM'

    const objective = await tx.objective.create({
      data: {
        trajectoryId: input.trajectoryId,
        targetYear: input.targetYear,
        reductionRate: input.reductionRate,
        isDefault: false,
      },
    })

    if (input.siteIds && input.siteIds.length > 0) {
      await tx.objectiveSite.createMany({
        data: input.siteIds.map((siteId) => ({ objectiveId: objective.id, studySiteId: siteId })),
      })
    }
    if (input.tagIds && input.tagIds.length > 0) {
      await tx.objectiveTag.createMany({
        data: input.tagIds.map((tagId) => ({ objectiveId: objective.id, studyTagId: tagId })),
      })
    }
    if (input.subPosts && input.subPosts.length > 0) {
      await tx.objectiveSubPost.createMany({
        data: input.subPosts.map((subPost) => ({ objectiveId: objective.id, subPost })),
      })
    }

    if (shouldConvertToCustom) {
      await tx.trajectory.update({
        where: { id: input.trajectoryId },
        data: { type: 'CUSTOM' },
      })
    }

    return objective
  })
}

export const updateObjective = async (input: {
  id: string
  targetYear: number
  reductionRate: number
  siteIds?: string[]
  tagIds?: string[]
  subPosts?: SubPost[]
}) => {
  return prismaClient.$transaction(async (tx) => {
    await tx.objective.update({
      where: { id: input.id },
      data: {
        targetYear: input.targetYear,
        reductionRate: input.reductionRate,
      },
    })

    await tx.objectiveSite.deleteMany({ where: { objectiveId: input.id } })
    await tx.objectiveTag.deleteMany({ where: { objectiveId: input.id } })
    await tx.objectiveSubPost.deleteMany({ where: { objectiveId: input.id } })

    if (input.siteIds && input.siteIds.length > 0) {
      await tx.objectiveSite.createMany({
        data: input.siteIds.map((siteId) => ({ objectiveId: input.id, studySiteId: siteId })),
      })
    }
    if (input.tagIds && input.tagIds.length > 0) {
      await tx.objectiveTag.createMany({
        data: input.tagIds.map((tagId) => ({ objectiveId: input.id, studyTagId: tagId })),
      })
    }
    if (input.subPosts && input.subPosts.length > 0) {
      await tx.objectiveSubPost.createMany({
        data: input.subPosts.map((subPost) => ({ objectiveId: input.id, subPost })),
      })
    }

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
}

export const deleteObjective = async (id: string) => {
  return prismaClient.objective.delete({
    where: { id },
  })
}
