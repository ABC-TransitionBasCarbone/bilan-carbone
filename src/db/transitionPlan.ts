import { AddActionCommand } from '@/services/serverFunctions/study.command'
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
