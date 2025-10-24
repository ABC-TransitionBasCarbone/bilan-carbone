'use server'

import {
  createTrajectoryWithObjectives as dbCreateTrajectoryWithObjectives,
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
