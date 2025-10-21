'use server'

import {
  createTrajectoryWithObjectives as dbCreateTrajectoryWithObjectives,
  getTrajectoriesByTransitionPlanId,
  TrajectoryWithObjectives,
} from '@/db/trajectory'
import { getTransitionPlanById } from '@/db/transitionPlan'
import { ApiResponse, withServerResponse } from '@/utils/serverResponse'
import { MID_TAREGT_YEAR, SBTI_REDUCTION_RATE_15, SBTI_REDUCTION_RATE_WB2C, TARGET_YEAR } from '@/utils/trajectory'
import { TrajectoryType } from '@prisma/client'
import { auth } from '../auth'
import { NOT_AUTHORIZED } from '../permissions/check'

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
    const session = await auth()
    if (!session?.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    const transitionPlan = await getTransitionPlanById(input.transitionPlanId)
    if (!transitionPlan) {
      throw new Error('Transition plan not found')
    }

    let objectives: { targetYear: number; reductionRate: number }[]

    if (input.type === TrajectoryType.SBTI_15) {
      objectives = [
        { targetYear: MID_TAREGT_YEAR, reductionRate: SBTI_REDUCTION_RATE_15 },
        { targetYear: TARGET_YEAR, reductionRate: SBTI_REDUCTION_RATE_15 },
      ]
    } else if (input.type === TrajectoryType.SBTI_WB2C) {
      objectives = [
        { targetYear: MID_TAREGT_YEAR, reductionRate: SBTI_REDUCTION_RATE_WB2C },
        { targetYear: TARGET_YEAR, reductionRate: SBTI_REDUCTION_RATE_WB2C },
      ]
    } else if (input.type === TrajectoryType.CUSTOM) {
      if (!input.objectives || input.objectives.length < 1 || input.objectives.length > 2) {
        throw new Error('Custom trajectory must have 1 or 2 objectives')
      }
      objectives = input.objectives
    } else {
      throw new Error('SNBC mode is not yet supported')
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

export const getTrajectoriesForTransitionPlan = async (
  transitionPlanId: string,
): Promise<ApiResponse<TrajectoryWithObjectives[]>> =>
  withServerResponse('getTrajectoriesForTransitionPlan', async () => {
    const session = await auth()
    if (!session?.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    return getTrajectoriesByTransitionPlanId(transitionPlanId)
  })
