'use server'

import { FullStudy, getStudyById } from '@/db/study'
import {
  createAction,
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
import { auth, dbActualizedAuth } from '../auth'
import { NOT_AUTHORIZED } from '../permissions/check'
import { canCreateAction, canViewTransitionPlan } from '../permissions/study'
import { AddActionCommand } from './study.command'

export const getStudyTransitionPlan = async (study: FullStudy): Promise<ApiResponse<TransitionPlan | null>> =>
  withServerResponse('getStudyTransitionPlan', async () => {
    const session = await auth()
    if (!session?.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    const hasAccess = await canViewTransitionPlan(session.user, study)
    if (!hasAccess) {
      throw new Error(NOT_AUTHORIZED)
    }

    const transitionPlan = await getTransitionPlanByStudyId(study.id)
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

    const hasViewAccess = await canViewTransitionPlan(session.user, study)
    if (!hasViewAccess) {
      throw new Error(NOT_AUTHORIZED)
    }

    const plans = await getOrganizationTransitionPlans(study.organizationVersionId)

    const accessiblePlans = await Promise.all(
      plans.map(async (plan) => {
        const fullStudy = await getStudyById(plan.studyId, session.user.organizationVersionId)
        if (!fullStudy) {
          return null
        }
        const hasViewAccess = await canViewTransitionPlan(session.user, fullStudy)
        return hasViewAccess ? plan : null
      }),
    )

    return accessiblePlans.filter((plan) => plan !== null && plan.studyId !== studyId) as TransitionPlanWithStudies[]
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

export const addAction = async (command: AddActionCommand) =>
  withServerResponse('addAction', async () => {
    const session = await dbActualizedAuth()

    if (!session || !session.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    const study = await getStudyById(command.studyId, session.user.organizationVersionId)
    if (!study || !canCreateAction(session.user, study)) {
      throw new Error(NOT_AUTHORIZED)
    }

    await createAction(command)
  })
