import {
  ActionIndicatorCommand,
  ActionStepCommand,
  AddActionInputCommand,
} from '@/services/serverFunctions/transitionPlan.command'
import {
  Action,
  ActionIndicator,
  ActionStep,
  ExternalStudy,
  Objective,
  Prisma,
  Trajectory,
  TransitionPlan,
  TransitionPlanStudy,
} from '@prisma/client'
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
  actions: Array<ActionWithRelations>
  externalStudies: ExternalStudy[]
}

export type TrajectoryWithObjectives = Trajectory & {
  objectives: Objective[]
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
      actions: {
        include: {
          indicators: true,
          steps: true,
        },
      },
      externalStudies: true,
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
  maxYear: number,
): Promise<TransitionPlanWithStudies[]> => {
  return prismaClient.transitionPlan.findMany({
    where: {
      study: {
        organizationVersionId,
        startDate: { lt: new Date(maxYear + 1, 0, 1) },
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

export const createTransitionPlan = async (studyId: string) => {
  return prismaClient.transitionPlan.create({
    data: {
      studyId,
    },
  })
}

export const duplicateTransitionPlanWithRelations = async (
  sourceTransitionPlan: TransitionPlanWithRelations,
  targetStudyId: string,
): Promise<TransitionPlanWithRelations> => {
  return prismaClient.$transaction(async (tx) => {
    return tx.transitionPlan.create({
      data: {
        studyId: targetStudyId,
        transitionPlanStudies: {
          create: sourceTransitionPlan.transitionPlanStudies.map((tpStudy) => ({ studyId: tpStudy.studyId })),
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
        actions: {
          create: sourceTransitionPlan.actions.map(
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            ({ id, transitionPlanId, createdAt, updatedAt, indicators, steps, ...rest }) => ({
              ...rest,
              indicators: {
                create: indicators.map((indicator) => ({
                  type: indicator.type,
                  description: indicator.description,
                })),
              },
              steps: {
                create: steps.map((step) => ({
                  title: step.title,
                  order: step.order,
                })),
              },
            }),
          ),
        },
        externalStudies: {
          create: sourceTransitionPlan.externalStudies.map(
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            ({ id, transitionPlanId, createdAt, updatedAt, ...rest }) => rest,
          ),
        },
      },
      include: {
        trajectories: {
          include: {
            objectives: true,
          },
        },
        transitionPlanStudies: true,
        actions: {
          include: {
            indicators: true,
            steps: true,
          },
        },
        externalStudies: true,
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

export const createAction = async (data: Prisma.ActionUncheckedCreateInput) => prismaClient.action.create({ data })

export const createActionWithRelations = async (command: AddActionInputCommand) => {
  const { indicators, steps, ...actionData } = command

  return prismaClient.action.create({
    data: {
      ...actionData,
      ...(indicators && {
        indicators: { create: indicators },
      }),
      ...(steps && {
        steps: { create: steps },
      }),
    },
  })
}

export const updateAction = async (id: string, data: Prisma.ActionUpdateInput) =>
  prismaClient.action.update({
    where: { id },
    data,
  })

export const deleteAction = async (id: string) => prismaClient.action.delete({ where: { id } })

export type ActionWithRelations = Action & {
  indicators: ActionIndicator[]
  steps: ActionStep[]
}

export const getActionById = async (id: string): Promise<ActionWithRelations | null> =>
  prismaClient.action.findUnique({
    where: { id },
    include: { indicators: { orderBy: { createdAt: 'asc' } }, steps: { orderBy: { order: 'asc' } } },
  })

export const getActions = async (transitionPlanId: string): Promise<ActionWithRelations[]> =>
  prismaClient.action.findMany({
    where: { transitionPlanId },
    orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    include: { indicators: { orderBy: { createdAt: 'asc' } }, steps: { orderBy: { order: 'asc' } } },
  })

export const createTransitionPlanStudy = async (transitionPlanId: string, studyId: string) =>
  prismaClient.transitionPlanStudy.create({ data: { transitionPlanId, studyId } })

export const createExternalStudy = async (data: Prisma.ExternalStudyUncheckedCreateInput) => {
  return prismaClient.externalStudy.create({ data })
}

export const updateExternalStudy = async (id: string, data: Prisma.ExternalStudyUpdateInput) => {
  return prismaClient.externalStudy.update({
    where: { id },
    data,
  })
}

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

export const deleteLinkedStudy = async (studyId: string, transitionPlanId: string) =>
  prismaClient.transitionPlanStudy.delete({ where: { transitionPlanId_studyId: { studyId, transitionPlanId } } })

export const deleteExternalStudy = async (externalStudyId: string) =>
  prismaClient.externalStudy.delete({ where: { id: externalStudyId } })

export const createTrajectoryWithObjectives = async (data: Prisma.TrajectoryCreateInput) => {
  return prismaClient.trajectory.create({
    data,
    include: {
      objectives: {
        orderBy: {
          targetYear: 'asc',
        },
      },
    },
  })
}

export const getTrajectoriesByTransitionPlanId = async (
  transitionPlanId: string,
): Promise<TrajectoryWithObjectives[]> => {
  return prismaClient.trajectory.findMany({
    where: { transitionPlanId },
    include: {
      objectives: {
        orderBy: {
          targetYear: 'asc',
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

export const studyHasObjectives = async (studyId: string): Promise<boolean> => {
  const count = await prismaClient.objective.count({
    where: {
      trajectory: {
        transitionPlan: {
          studyId,
        },
      },
    },
  })
  return count > 0
}

export const getTrajectoryById = async (id: string): Promise<TrajectoryWithObjectives | null> => {
  return prismaClient.trajectory.findUnique({
    where: { id },
    include: {
      objectives: {
        orderBy: {
          targetYear: 'asc',
        },
      },
    },
  })
}

export const hasTrajectory = async (transitionPlanId: string): Promise<boolean> => {
  const count = await prismaClient.trajectory.count({
    where: { transitionPlanId },
  })
  return count > 0
}

export const deleteTrajectory = async (id: string): Promise<void> => {
  await prismaClient.trajectory.delete({
    where: { id },
  })
}

export const updateTrajectory = async (
  id: string,
  data: { name?: string; description?: string },
): Promise<TrajectoryWithObjectives> => {
  return prismaClient.trajectory.update({
    where: { id },
    data,
    include: {
      objectives: {
        orderBy: {
          targetYear: 'asc',
        },
      },
    },
  })
}

export const deleteObjective = async (id: string): Promise<Objective> => {
  return prismaClient.objective.delete({
    where: { id },
  })
}

export const updateObjective = async (
  id: string,
  data: { targetYear?: number; reductionRate?: number },
): Promise<Objective> => {
  return prismaClient.objective.update({
    where: { id },
    data,
  })
}

export const updateTrajectoryWithObjectives = async (
  trajectoryId: string,
  data: {
    name?: string
    description?: string
    objectives?: Array<{ id: string; targetYear: number; reductionRate: number }>
  },
): Promise<TrajectoryWithObjectives> => {
  if (data.objectives) {
    await Promise.all(
      data.objectives.map((obj) =>
        prismaClient.objective.upsert({
          where: { id: obj.id },
          update: {
            targetYear: obj.targetYear,
            reductionRate: obj.reductionRate,
          },
          create: {
            trajectoryId: trajectoryId,
            targetYear: obj.targetYear,
            reductionRate: obj.reductionRate,
          },
        }),
      ),
    )
  }

  return prismaClient.trajectory.update({
    where: { id: trajectoryId },
    data: {
      name: data.name,
      description: data.description,
    },
    include: {
      objectives: {
        orderBy: {
          targetYear: 'asc',
        },
      },
    },
  })
}

export const deleteTransitionPlan = async (id: string): Promise<void> => {
  await prismaClient.transitionPlan.delete({
    where: { id },
  })
}

export const saveIndicatorsOnAction = async (
  actionId: string,
  indicatorsToKeep: ActionIndicatorCommand[],
  indicatorsToDelete: string[],
) => {
  await prismaClient.$transaction([
    prismaClient.actionIndicator.deleteMany({
      where: {
        id: { in: indicatorsToDelete },
      },
    }),
    ...indicatorsToKeep.map((ind) => {
      if (ind.id) {
        return prismaClient.actionIndicator.update({
          where: { id: ind.id },
          data: {
            description: ind.description,
            type: ind.type,
          },
        })
      } else {
        return prismaClient.actionIndicator.create({
          data: {
            actionId,
            type: ind.type,
            description: ind.description,
          },
        })
      }
    }),
  ])
}

export const saveStepsOnAction = async (
  actionId: string,
  stepsToKeep: ActionStepCommand[],
  stepsToDelete: string[],
) => {
  await prismaClient.$transaction([
    prismaClient.actionStep.deleteMany({
      where: {
        id: { in: stepsToDelete },
      },
    }),
    ...stepsToKeep.map((step) => {
      if (step.id) {
        return prismaClient.actionStep.update({
          where: { id: step.id },
          data: {
            title: step.title,
            order: step.order,
          },
        })
      } else {
        return prismaClient.actionStep.create({
          data: {
            actionId,
            title: step.title,
            order: step.order,
          },
        })
      }
    }),
  ])
}
