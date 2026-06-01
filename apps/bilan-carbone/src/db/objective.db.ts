import { Prisma, SubPost } from '@abc-transitionbascarbone/db-common'
import { prismaClient } from './client.server'

export const getSubObjectives = async (trajectoryId: string, targetYear: number, excludeObjectiveId?: string) => {
  return prismaClient.objective.findMany({
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
}

export const getObjectiveWithTransitionPlan = async (id: string) => {
  return prismaClient.objective.findUnique({
    where: { id },
    include: {
      trajectory: {
        include: { transitionPlan: true },
      },
    },
  })
}

export const createManyObjectivesAndReturn = async (
  objectives: Array<{
    name?: string
    trajectoryId: string
    targetYear: number
    startYear?: number
    reductionRate: number
    isDefault: boolean
  }>,
  tx: Prisma.TransactionClient,
) => {
  return tx.objective.createManyAndReturn({ data: objectives })
}

export const createManyObjectiveSites = async (
  data: Array<{ objectiveId: string; studySiteId: string }>,
  tx: Prisma.TransactionClient,
) => {
  return tx.objectiveSite.createMany({ data })
}

export const createManyObjectiveTags = async (
  data: Array<{ objectiveId: string; studyTagId: string }>,
  tx: Prisma.TransactionClient,
) => {
  return tx.objectiveTag.createMany({ data })
}

export const createManyObjectiveSubPosts = async (
  data: Array<{ objectiveId: string; subPost: SubPost }>,
  tx: Prisma.TransactionClient,
) => {
  return tx.objectiveSubPost.createMany({ data })
}

export const updateObjective = async (
  id: string,
  data: {
    targetYear: number
    startYear?: number
    reductionRate: number
    name?: string
  },
  tx: Prisma.TransactionClient,
) => {
  return tx.objective.update({
    where: { id },
    data,
  })
}

export const deleteObjectiveSites = async (objectiveId: string, tx: Prisma.TransactionClient) => {
  return tx.objectiveSite.deleteMany({ where: { objectiveId } })
}

export const deleteObjectiveTags = async (objectiveId: string, tx: Prisma.TransactionClient) => {
  return tx.objectiveTag.deleteMany({ where: { objectiveId } })
}

export const deleteObjectiveSubPosts = async (objectiveId: string, tx: Prisma.TransactionClient) => {
  return tx.objectiveSubPost.deleteMany({ where: { objectiveId } })
}

export const deleteObjective = async (id: string) => {
  return prismaClient.objective.delete({
    where: { id },
  })
}
