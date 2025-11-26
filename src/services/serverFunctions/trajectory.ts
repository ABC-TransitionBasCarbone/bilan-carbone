'use server'

import { prismaClient } from '@/db/client'
import {
  createTrajectoryWithObjectives as dbCreateTrajectoryWithObjectives,
  deleteObjective as dbDeleteObjective,
  deleteTrajectory as dbDeleteTrajectory,
  updateTrajectoryWithObjectives as dbUpdateTrajectoryWithObjectives,
  getTrajectoriesByTransitionPlanId,
  getTransitionPlanById,
  studyHasObjectives,
  TrajectoryWithObjectives,
} from '@/db/transitionPlan'
import { ApiResponse, withServerResponse } from '@/utils/serverResponse'
import { getDefaultObjectivesForTrajectoryType } from '@/utils/trajectory'
import { TrajectoryType } from '@prisma/client'
import { NOT_AUTHORIZED } from '../permissions/check'
import { hasEditAccessOnStudy, hasReadAccessOnStudy } from '../permissions/study'

export interface CreateTrajectoryInput {
  transitionPlanId: string
  name: string
  description?: string
  type: TrajectoryType
  objectives?: {
    targetYear: number
    reductionRate: number
  }[]
}

export const createTrajectoryWithObjectives = async (input: CreateTrajectoryInput) =>
  withServerResponse('createTrajectoryWithObjectives', async () => {
    const transitionPlan = await getTransitionPlanById(input.transitionPlanId)
    if (!transitionPlan) {
      throw new Error('Transition plan not found')
    }

    const hasEditAccess = await hasEditAccessOnStudy(transitionPlan.studyId)
    if (!hasEditAccess) {
      throw new Error(NOT_AUTHORIZED)
    }

    let objectives: { targetYear: number; reductionRate: number }[]

    const defaultObjectives = getDefaultObjectivesForTrajectoryType(input.type)
    if (defaultObjectives) {
      objectives = defaultObjectives
    } else if (input.type === TrajectoryType.CUSTOM) {
      if (!input.objectives || input.objectives.length < 1) {
        throw new Error('Custom trajectory must have at least 1 objective')
      }
      objectives = input.objectives
    } else {
      throw new Error(`${input.type} mode is not yet supported`)
    }

    return dbCreateTrajectoryWithObjectives({
      transitionPlan: {
        connect: {
          id: input.transitionPlanId,
        },
      },
      name: input.name,
      description: input.description,
      type: input.type,
      objectives: {
        createMany: {
          data: objectives,
        },
      },
    })
  })

export const getTrajectories = async (
  studyId: string,
  transitionPlanId: string,
): Promise<ApiResponse<TrajectoryWithObjectives[]>> =>
  withServerResponse('getTrajectories', async () => {
    const hasReadAccess = await hasReadAccessOnStudy(studyId)
    if (!hasReadAccess) {
      throw new Error(NOT_AUTHORIZED)
    }

    return getTrajectoriesByTransitionPlanId(transitionPlanId)
  })

export const checkStudyHasObjectives = async (studyId: string): Promise<ApiResponse<boolean>> =>
  withServerResponse('checkStudyHasObjectives', async () => {
    const hasReadAccess = await hasReadAccessOnStudy(studyId)
    if (!hasReadAccess) {
      throw new Error(NOT_AUTHORIZED)
    }

    return studyHasObjectives(studyId)
  })

export const updateTrajectory = async (
  id: string,
  data: {
    name?: string
    description?: string
    type?: TrajectoryType
    objectives?: Array<{ id?: string; targetYear: number; reductionRate: number }>
  },
) =>
  withServerResponse('updateTrajectory', async () => {
    const trajectory = await prismaClient.trajectory.findUnique({
      where: { id },
      include: { transitionPlan: true, objectives: true },
    })

    if (!trajectory) {
      throw new Error('Trajectory not found')
    }

    const hasEditAccess = await hasEditAccessOnStudy(trajectory.transitionPlan.studyId)
    if (!hasEditAccess) {
      throw new Error(NOT_AUTHORIZED)
    }

    const typeChanged = data.type && data.type !== trajectory.type

    if (typeChanged && data.type !== TrajectoryType.CUSTOM) {
      const defaultObjectives = getDefaultObjectivesForTrajectoryType(data.type!)
      if (defaultObjectives) {
        await prismaClient.$transaction(async (tx) => {
          await tx.objective.deleteMany({
            where: { trajectoryId: id },
          })
          await tx.objective.createMany({
            data: defaultObjectives.map((obj) => ({
              trajectoryId: id,
              targetYear: obj.targetYear,
              reductionRate: obj.reductionRate,
            })),
          })
          await tx.trajectory.update({
            where: { id },
            data: {
              type: data.type,
              name: data.name,
              description: data.description,
            },
          })
        })

        return prismaClient.trajectory.findUnique({
          where: { id },
          include: { objectives: { orderBy: { targetYear: 'asc' } } },
        }) as Promise<TrajectoryWithObjectives>
      }
    }

    if (data.objectives && trajectory.type === TrajectoryType.CUSTOM) {
      const existingObjectiveIds = trajectory.objectives.map((obj) => obj.id)
      const submittedObjectiveIds = data.objectives.filter((obj) => obj.id).map((obj) => obj.id!)
      const objectivesToDelete = existingObjectiveIds.filter((id) => !submittedObjectiveIds.includes(id))

      await prismaClient.$transaction(async (tx) => {
        if (objectivesToDelete.length > 0) {
          await tx.objective.deleteMany({
            where: {
              id: { in: objectivesToDelete },
            },
          })
        }

        await Promise.all(
          data.objectives!.map((obj) => {
            if (obj.id) {
              return tx.objective.update({
                where: { id: obj.id },
                data: {
                  targetYear: obj.targetYear,
                  reductionRate: obj.reductionRate,
                },
              })
            } else {
              return tx.objective.create({
                data: {
                  trajectoryId: id,
                  targetYear: obj.targetYear,
                  reductionRate: obj.reductionRate,
                },
              })
            }
          }),
        )

        await tx.trajectory.update({
          where: { id },
          data: {
            name: data.name,
            description: data.description,
            type: data.type,
          },
        })
      })

      return prismaClient.trajectory.findUnique({
        where: { id },
        include: { objectives: { orderBy: { targetYear: 'asc' } } },
      }) as Promise<TrajectoryWithObjectives>
    }

    return dbUpdateTrajectoryWithObjectives(id, {
      name: data.name,
      description: data.description,
    })
  })

export const deleteTrajectory = async (id: string) =>
  withServerResponse('deleteTrajectory', async () => {
    const trajectory = await prismaClient.trajectory.findUnique({
      where: { id },
      include: { transitionPlan: true },
    })
    if (!trajectory) {
      throw new Error('Trajectory not found')
    }

    const hasEditAccess = await hasEditAccessOnStudy(trajectory.transitionPlan.studyId)
    if (!hasEditAccess) {
      throw new Error(NOT_AUTHORIZED)
    }

    await dbDeleteTrajectory(id)
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
