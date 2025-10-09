'use server'

import { FullStudy, getStudyById } from '@/db/study'
import {
  createTransitionPlan,
  getOrganizationTransitionPlans,
  getTransitionPlanById,
  getTransitionPlanByStudyId,
  TransitionPlanWithStudies,
} from '@/db/transitionPlan'
import { ApiResponse, withServerResponse } from '@/utils/serverResponse'
import { getAccountRoleOnStudy, hasEditionRights } from '@/utils/study'
import { TransitionPlan } from '@prisma/client'
import { UserSession } from 'next-auth'
import { auth } from '../auth'
import { NOT_AUTHORIZED } from '../permissions/check'

export const getStudyTransitionPlan = async (studyId: string): Promise<ApiResponse<TransitionPlan | null>> =>
  withServerResponse('getStudyTransitionPlan', async () => {
    const session = await auth()
    if (!session?.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    const transitionPlan = await getTransitionPlanByStudyId(studyId)
    return transitionPlan
  })

export const getAvailableTransitionPlans = async (studyId: string) =>
  withServerResponse('getAvailableTransitionPlans', async (): Promise<TransitionPlanWithStudies[]> => {
    const session = await auth()
    if (!session?.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    const study = await getStudyById(studyId, session.user.organizationVersionId)
    if (!study) {
      throw new Error('Study not found')
    }

    const plans = await getOrganizationTransitionPlans(study.organizationVersionId)

    return plans.filter((plan) => plan.studyId !== studyId)
  })

export const initializeTransitionPlan = async (studyId: string, sourceTransitionPlanId?: string) =>
  withServerResponse('initializeTransitionPlan', async (): Promise<TransitionPlan> => {
    const session = await auth()
    if (!session?.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    const study = await getStudyById(studyId, session.user.organizationVersionId)
    if (!study) {
      throw new Error('Study not found')
    }

    const userRoleOnStudy = getAccountRoleOnStudy(session.user as UserSession, study as FullStudy)
    if (!hasEditionRights(userRoleOnStudy)) {
      throw new Error(NOT_AUTHORIZED)
    }

    const existingPlan = await getTransitionPlanByStudyId(studyId)
    if (existingPlan) {
      throw new Error('Transition plan already exists for this study')
    }

    if (sourceTransitionPlanId) {
      return duplicateTransitionPlan(sourceTransitionPlanId, studyId)
    } else {
      return createTransitionPlan(studyId)
    }
  })

export const duplicateTransitionPlan = async (
  sourceTransitionPlanId: string,
  targetStudyId: string,
): Promise<TransitionPlan> => {
  const sourceTransitionPlan = await getTransitionPlanById(sourceTransitionPlanId)

  if (!sourceTransitionPlan) {
    throw new Error('Source transition plan not found with id ' + sourceTransitionPlanId)
  }

  return createTransitionPlan(targetStudyId)
}
