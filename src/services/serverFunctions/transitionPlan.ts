'use server'

import { getStudyById, getStudyByIds } from '@/db/study'
import {
  createAction,
  createExternalStudy,
  createTransitionPlan,
  createTransitionPlanStudy,
  duplicateTransitionPlanWithRelations,
  getActionById,
  getActions,
  getExternalStudiesForTransitionPlan,
  getExternalStudiesForTransitionPlanAndYear,
  getLinkedStudiesForTransitionPlan,
  getLinkedStudiesForTransitionPlanAndYear,
  getOrganizationTransitionPlans,
  getTransitionPlanById,
  getTransitionPlanByIdWithRelations,
  getTransitionPlanByStudyId,
  TransitionPlanWithRelations,
  TransitionPlanWithStudies,
  updateAction,
} from '@/db/transitionPlan'
import { ApiResponse, withServerResponse } from '@/utils/serverResponse'
import { getYearFromDateStr } from '@/utils/time'
import { TransitionPlan } from '@prisma/client'
import { dbActualizedAuth } from '../auth'
import { NOT_AUTHORIZED } from '../permissions/check'
import { canReadStudy, hasEditAccessOnStudy, hasReadAccessOnStudy } from '../permissions/study'
import { canEditTransitionPlan, canReadTransitionPlan } from '../permissions/transitionPlan'
import { AddActionCommand } from './study.command'
import { ExternalStudyCommand } from './transitionPlan.command'

export const getStudyTransitionPlan = async (studyId: string): Promise<ApiResponse<TransitionPlan | null>> =>
  withServerResponse('getStudyTransitionPlan', async () => {
    const transitionPlan = await getTransitionPlanByStudyId(studyId)
    if (!transitionPlan) {
      throw new Error(NOT_AUTHORIZED)
    }

    const hasReadAccess = await canReadTransitionPlan(transitionPlan.id)
    if (!hasReadAccess) {
      throw new Error(NOT_AUTHORIZED)
    }

    return transitionPlan
  })

export const getAvailableTransitionPlans = async (studyId: string) =>
  withServerResponse('getAvailableTransitionPlans', async (): Promise<TransitionPlanWithStudies[]> => {
    const session = await dbActualizedAuth()
    if (!session || !session.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    const study = await getStudyById(studyId, session.user.organizationVersionId)
    if (!study) {
      throw new Error('Study not found')
    }

    const hasReadAccess = await canReadStudy(session.user, studyId)
    if (!hasReadAccess) {
      throw new Error(NOT_AUTHORIZED)
    }

    const plans = await getOrganizationTransitionPlans(study.organizationVersionId)

    const accessiblePlans = await Promise.all(
      plans.map(async (plan) => {
        const hasReadAccess = await hasReadAccessOnStudy(plan.studyId)
        return hasReadAccess ? plan : null
      }),
    )

    return accessiblePlans.filter((plan) => plan !== null && plan.studyId !== studyId) as TransitionPlanWithStudies[]
  })

export const initializeTransitionPlan = async (studyId: string, sourceTransitionPlanId?: string) =>
  withServerResponse('initializeTransitionPlan', async (): Promise<TransitionPlanWithRelations> => {
    const hasEditAccess = await hasEditAccessOnStudy(studyId)
    if (!hasEditAccess) {
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

const duplicateTransitionPlan = async (
  sourceTransitionPlanId: string,
  targetStudyId: string,
): Promise<TransitionPlanWithRelations> => {
  const sourceTransitionPlan = await getTransitionPlanByIdWithRelations(sourceTransitionPlanId)

  if (!sourceTransitionPlan) {
    throw new Error('Source transition plan not found with id ' + sourceTransitionPlanId)
  }

  return duplicateTransitionPlanWithRelations(sourceTransitionPlan, targetStudyId)
}

export const addAction = async (command: AddActionCommand) =>
  withServerResponse('addAction', async () => {
    const hasEditAccess = await canEditTransitionPlan(command.transitionPlanId)
    if (!hasEditAccess) {
      throw new Error(NOT_AUTHORIZED)
    }

    await createAction(command)
  })

const isYearAlreadyLinked = async (transitionPlanId: string, year: number) => {
  const startDate = new Date(`01-01-${year}`)
  const endDate = new Date(`01-01-${year + 1}`)

  const [externalStudies, linkedStudies] = await Promise.all([
    getExternalStudiesForTransitionPlanAndYear(transitionPlanId, startDate, endDate),
    getLinkedStudiesForTransitionPlanAndYear(transitionPlanId, startDate, endDate),
  ])

  return externalStudies.length || linkedStudies.length
}

export const linkOldStudy = async (transitionPlanId: string, studyIdToLink: string) =>
  withServerResponse('linkOldStudy', async () => {
    const session = await dbActualizedAuth()

    if (!session || !session.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    const hasReadAccess = await canReadStudy(session.user, studyIdToLink)
    if (!hasReadAccess) {
      throw new Error(NOT_AUTHORIZED)
    }

    const [transitionPlan, studyToLink] = await Promise.all([
      getTransitionPlanById(transitionPlanId),
      getStudyById(studyIdToLink, session.user.organizationVersionId),
    ])

    if (!studyToLink || !transitionPlan) {
      throw new Error(NOT_AUTHORIZED)
    }

    const hasEditAccess = await canEditTransitionPlan(transitionPlanId)
    if (!hasEditAccess) {
      throw new Error(NOT_AUTHORIZED)
    }

    const transitionPlanStudy = await getStudyById(transitionPlan.studyId, session.user.organizationVersionId)
    if (studyToLink.organizationVersion?.id !== transitionPlanStudy?.organizationVersionId) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (await isYearAlreadyLinked(transitionPlan.id, studyToLink.startDate.getFullYear())) {
      throw new Error('yearAlreadySet')
    }

    await createTransitionPlanStudy(transitionPlanId, studyIdToLink)
  })

export const addExternalStudy = async (command: ExternalStudyCommand) =>
  withServerResponse('addExternalStudy', async () => {
    const hasEditAccess = await canEditTransitionPlan(command.transitionPlanId)
    if (!hasEditAccess) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (await isYearAlreadyLinked(command.transitionPlanId, getYearFromDateStr(command.date))) {
      throw new Error('yearAlreadySet')
    }

    await createExternalStudy(command)
  })

export const getLinkedStudies = async (transitionPlanId: string) =>
  withServerResponse('getLinkedStudies', async () => {
    const hasReadAccess = await canReadTransitionPlan(transitionPlanId)
    if (!hasReadAccess) {
      throw new Error(NOT_AUTHORIZED)
    }

    const [externalStudies, transitionPlanStudies] = await Promise.all([
      getExternalStudiesForTransitionPlan(transitionPlanId),
      getLinkedStudiesForTransitionPlan(transitionPlanId),
    ])

    const studies = await getStudyByIds(transitionPlanStudies.map((transitionPlan) => transitionPlan.studyId))

    return { studies, externalStudies }
  })

export const editAction = async (id: string, command: AddActionCommand) =>
  withServerResponse('editAction', async () => {
    const hasEditAccess = await canEditTransitionPlan(command.transitionPlanId)
    if (!hasEditAccess) {
      throw new Error(NOT_AUTHORIZED)
    }

    const action = await getActionById(id)
    if (!action || action.transitionPlanId !== command.transitionPlanId) {
      throw new Error(NOT_AUTHORIZED)
    }

    await updateAction(id, command)
  })

export const getStudyActions = async (studyId: string) =>
  withServerResponse('getStudyActions', async () => {
    const transitionPlan = await getTransitionPlanByStudyId(studyId)
    if (!transitionPlan) {
      throw new Error(NOT_AUTHORIZED)
    }

    const hasReadAccess = await canReadTransitionPlan(transitionPlan.id)
    if (!hasReadAccess) {
      throw new Error(NOT_AUTHORIZED)
    }

    return getActions(transitionPlan.id)
  })

export const toggleActionEnabled = async (actionId: string, enabled: boolean) =>
  withServerResponse('toggleActionEnabled', async () => {
    const action = await getActionById(actionId)
    if (!action) {
      throw new Error(NOT_AUTHORIZED)
    }

    const hasEditAccess = await canEditTransitionPlan(action.transitionPlanId)
    if (!hasEditAccess) {
      throw new Error(NOT_AUTHORIZED)
    }

    await updateAction(actionId, { enabled })
  })
