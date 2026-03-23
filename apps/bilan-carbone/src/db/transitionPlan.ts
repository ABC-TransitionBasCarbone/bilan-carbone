import {
  ActionIndicatorCommand,
  ActionStepCommand,
  AddActionInputCommand,
} from '@/services/serverFunctions/action.command'
import { SectorPercentages } from '@/services/serverFunctions/trajectory.command'
import {
  Action,
  ActionIndicator,
  ActionSite,
  ActionStep,
  ActionSubPost,
  ActionTag,
  ExternalStudy,
  Objective,
  ObjectiveSite,
  ObjectiveSubPost,
  ObjectiveTag,
  Prisma,
  Study,
  StudySite,
  StudyTag,
  SubPost,
  Trajectory,
  TransitionPlan,
  TransitionPlanStudy,
} from '@repo/db-common'
import { prismaClient } from './client.server'

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
      objectives: ObjectiveWithScope[]
    }
  >
  transitionPlanStudies: Array<TransitionPlanStudy & { study: Pick<Study, 'startDate'> }>
  actions: Array<ActionWithRelations>
  externalStudies: ExternalStudy[]
}

export type TrajectoryWithObjectives = Trajectory & {
  objectives: Objective[]
}

export type ObjectiveWithScope = Objective & {
  sites: Array<ObjectiveSite & { studySite: StudySite }>
  tags: Array<ObjectiveTag & { studyTag: StudyTag }>
  subPosts: ObjectiveSubPost[]
}

export type TrajectoryWithObjectivesAndScope = Trajectory & {
  objectives: ObjectiveWithScope[]
}

export type ObjectiveScopeFormData = {
  siteIds: string[]
  tagIds: string[]
  subPosts: SubPost[]
}

const actionInclude = {
  indicators: true,
  steps: true,
  sites: { include: { studySite: true } },
  tags: { include: { studyTag: true } },
  subPosts: true,
} as const

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
          objectives: {
            include: {
              sites: { include: { studySite: true } },
              tags: { include: { studyTag: true } },
              subPosts: true,
            },
          },
        },
      },
      transitionPlanStudies: { include: { study: { select: { startDate: true } } } },
      actions: {
        include: actionInclude,
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

export const createTransitionPlan = async (studyId: string, sectenVersionId?: string) => {
  return prismaClient.transitionPlan.create({
    data: {
      studyId,
      sectenVersionId,
    },
  })
}

export const updateTransitionPlanSectenVersion = async (transitionPlanId: string, sectenVersionId: string) => {
  return prismaClient.transitionPlan.update({
    where: { id: transitionPlanId },
    data: { sectenVersionId },
  })
}

export const duplicateTransitionPlanWithRelations = async (
  sourceTransitionPlan: TransitionPlanWithRelations,
  targetStudyId: string,
  targetYear: number,
): Promise<TransitionPlanWithRelations> => {
  return prismaClient.$transaction(async (tx) => {
    return tx.transitionPlan.create({
      data: {
        studyId: targetStudyId,
        sectenVersionId: sourceTransitionPlan.sectenVersionId,
        transitionPlanStudies: {
          create: sourceTransitionPlan.transitionPlanStudies
            .filter((tpStudy) => tpStudy.study.startDate.getUTCFullYear() < targetYear)
            .map((tpStudy) => ({ studyId: tpStudy.studyId })),
        },
        trajectories: {
          create: sourceTransitionPlan.trajectories.map((trajectory) => ({
            name: trajectory.name,
            description: trajectory.description,
            type: trajectory.type,
            referenceYear: trajectory.referenceYear,
            sectorPercentages: trajectory.sectorPercentages as SectorPercentages,
            objectives: {
              create: trajectory.objectives.map((objective) => ({
                targetYear: objective.targetYear,
                reductionRate: objective.reductionRate,
                isDefault: objective.isDefault,
                sites: {
                  create: objective.sites.map((s) => ({ studySiteId: s.studySiteId })),
                },
                tags: {
                  create: objective.tags.map((t) => ({ studyTagId: t.studyTagId })),
                },
                subPosts: {
                  create: objective.subPosts.map((sp) => ({ subPost: sp.subPost })),
                },
              })),
            },
          })),
        },
        actions: {
          create: sourceTransitionPlan.actions.map(
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            ({ id, transitionPlanId, createdAt, updatedAt, indicators, steps, sites, tags, subPosts, ...rest }) => ({
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
              sites: {
                create: sites.map((s) => ({ studySiteId: s.studySiteId })),
              },
              tags: {
                create: tags.map((t) => ({ studyTagId: t.studyTagId })),
              },
              subPosts: {
                create: subPosts.map((sp) => ({ subPost: sp.subPost })),
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
            objectives: {
              include: {
                sites: { include: { studySite: true } },
                tags: { include: { studyTag: true } },
                subPosts: true,
              },
            },
          },
        },
        transitionPlanStudies: { include: { study: { select: { startDate: true } } } },
        actions: {
          include: actionInclude,
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

export const createActionWithRelations = async (
  command: Omit<AddActionInputCommand, 'siteIds' | 'tagIds' | 'subPosts'>,
) => {
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
  sites: Array<ActionSite & { studySite: StudySite }>
  tags: Array<ActionTag & { studyTag: StudyTag }>
  subPosts: ActionSubPost[]
}

export const getActionById = async (id: string): Promise<ActionWithRelations | null> =>
  prismaClient.action.findUnique({
    where: { id },
    include: {
      ...actionInclude,
      indicators: { orderBy: { createdAt: 'asc' } },
      steps: { orderBy: { order: 'asc' } },
    },
  })

export const getActions = async (transitionPlanId: string): Promise<ActionWithRelations[]> =>
  prismaClient.action.findMany({
    where: { transitionPlanId },
    orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    include: {
      ...actionInclude,
      indicators: { orderBy: { createdAt: 'asc' } },
      steps: { orderBy: { order: 'asc' } },
    },
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

export const getTransitionPlansWhereStudyIsLinked = async (studyId: string) =>
  prismaClient.transitionPlanStudy.findMany({
    where: { studyId },
    include: { transitionPlan: { include: { study: { select: { startDate: true, name: true } } } } },
  })

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
): Promise<TrajectoryWithObjectivesAndScope[]> => {
  return prismaClient.trajectory.findMany({
    where: { transitionPlanId },
    include: {
      objectives: {
        orderBy: {
          targetYear: 'asc',
        },
        include: {
          sites: { include: { studySite: true } },
          tags: { include: { studyTag: true } },
          subPosts: true,
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

export const getTrajectoryWithTransitionPlan = async (id: string) =>
  prismaClient.trajectory.findUnique({
    where: { id },
    include: { transitionPlan: true },
  })

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

export const updateTrajectoryWithObjectives = async (
  trajectoryId: string,
  data: {
    name?: string
    description?: string
    referenceYear?: number | null
    sectorPercentages?: SectorPercentages
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
      referenceYear: data.referenceYear,
      sectorPercentages: data.sectorPercentages,
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

export const saveActionScope = async (actionId: string, siteIds: string[], tagIds: string[], subPosts: SubPost[]) => {
  await prismaClient.$transaction([
    prismaClient.actionSite.deleteMany({ where: { actionId } }),
    prismaClient.actionTag.deleteMany({ where: { actionId } }),
    prismaClient.actionSubPost.deleteMany({ where: { actionId } }),
    prismaClient.actionSite.createMany({ data: siteIds.map((studySiteId) => ({ actionId, studySiteId })) }),
    prismaClient.actionTag.createMany({ data: tagIds.map((studyTagId) => ({ actionId, studyTagId })) }),
    prismaClient.actionSubPost.createMany({ data: subPosts.map((subPost) => ({ actionId, subPost })) }),
  ])
}
