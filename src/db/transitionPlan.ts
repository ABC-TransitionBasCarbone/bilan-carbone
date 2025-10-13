import { AddActionCommand } from '@/services/serverFunctions/study.command'
import { ExternalStudyCommand } from '@/services/serverFunctions/transitionPlan.command'
import { Objective, Trajectory, TransitionPlan, TransitionPlanStudy } from '@prisma/client'
import { prismaClient } from './client'

export type TransitionPlanWithStudies = TransitionPlan & {
  study: {
    id: string
    name: string
    startDate: Date
  }
  transitionPlanStudies: TransitionPlanStudy[]
}

export type TransitionPlanWithRelations = TransitionPlan & {
  trajectories: Array<
    Trajectory & {
      objectives: Objective[]
    }
  >
  transitionPlanStudies: TransitionPlanStudy[]
}

export const getTransitionPlanById = async (id: string): Promise<TransitionPlan | null> => {
  return prismaClient.transitionPlan.findUnique({
    where: { id },
  })
}

export const getTransitionPlanByIdWithRelations = async (id: string): Promise<TransitionPlanWithRelations | null> => {
  return prismaClient.transitionPlan.findUnique({
    where: { id },
    include: {
      trajectories: {
        include: {
          objectives: true,
        },
      },
      transitionPlanStudies: true,
    },
  })
}

export const getTransitionPlanByStudyId = async (studyId: string): Promise<TransitionPlan | null> => {
  return prismaClient.transitionPlan.findUnique({
    where: {
      studyId,
    },
  })
}

export const getOrganizationTransitionPlans = async (
  organizationVersionId: string,
): Promise<TransitionPlanWithStudies[]> => {
  return prismaClient.transitionPlan.findMany({
    where: {
      study: {
        organizationVersionId,
      },
    },
    include: {
      study: {
        select: {
          id: true,
          name: true,
          startDate: true,
        },
      },
      transitionPlanStudies: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

export const createTransitionPlan = async (studyId: string): Promise<TransitionPlanWithRelations> => {
  return prismaClient.transitionPlan.create({
    data: {
      studyId,
      transitionPlanStudies: {
        create: {
          studyId,
        },
      },
    },
    include: {
      transitionPlanStudies: true,
      trajectories: {
        include: {
          objectives: true,
        },
      },
    },
  })
}

export const duplicateTransitionPlanWithRelations = async (
  sourceTransitionPlan: TransitionPlanWithRelations,
  targetStudyId: string,
): Promise<TransitionPlanWithRelations> => {
  const linkedStudyIds = sourceTransitionPlan.transitionPlanStudies
    .map((tps) => tps.studyId)
    .filter((studyId) => studyId !== sourceTransitionPlan.studyId)

  return prismaClient.$transaction(async (tx) => {
    return tx.transitionPlan.create({
      data: {
        studyId: targetStudyId,
        transitionPlanStudies: {
          create: [{ studyId: targetStudyId }, ...linkedStudyIds.map((studyId) => ({ studyId }))],
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
        // TODO: Add actions
      },
      include: {
        trajectories: {
          include: {
            objectives: true,
          },
        },
        transitionPlanStudies: true,
      },
    })
  })
}

export const hasTransitionPlan = async (studyId: string): Promise<boolean> => {
  const count = await prismaClient.transitionPlan.count({
    where: {
      studyId,
    },
  })
  return count > 0
}

export const createAction = async (data: AddActionCommand) => prismaClient.action.create({ data })

export const updateAction = async (id: string, data: AddActionCommand) =>
  prismaClient.action.update({ where: { id }, data })

export const getActionById = async (id: string) => prismaClient.action.findUnique({ where: { id } })

export const getActions = async (transitionPlanId: string) =>
  prismaClient.action.findMany({ where: { transitionPlanId } })
export const createTransitionPlanStudy = async (transitionPlanId: string, studyId: string) =>
  prismaClient.transitionPlanStudy.create({ data: { transitionPlanId, studyId } })

export const createExternalStudy = async (data: ExternalStudyCommand) => prismaClient.externalStudy.create({ data })

export const getExternalStudiesForTransitionPlanAndYear = async (
  transitionPlanId: string,
  startDate: Date,
  endDate: Date,
) =>
  prismaClient.externalStudy.findMany({
    where: { transitionPlanId, date: { gte: startDate, lt: endDate } },
  })

export const getLinkedStudiesForTransitionPlanAndYear = async (
  transitionPlanId: string,
  startDate: Date,
  endDate: Date,
) =>
  prismaClient.transitionPlanStudy.findMany({
    where: { transitionPlanId, study: { startDate: { gte: startDate, lt: endDate } } },
  })

export const getExternalStudiesForTransitionPlan = async (transitionPlanId: string) =>
  prismaClient.externalStudy.findMany({ where: { transitionPlanId } })

export const getLinkedStudiesForTransitionPlan = async (transitionPlanId: string) =>
  prismaClient.transitionPlanStudy.findMany({ where: { transitionPlanId } })
