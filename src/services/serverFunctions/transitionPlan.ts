'use server'

import { prismaClient } from '@/db/client'
import { getStudyById, getStudyByIds } from '@/db/study'
import {
  createExternalStudy,
  createTransitionPlan,
  createTransitionPlanStudy,
  deleteAction as dbDeleteAction,
  deleteExternalStudy as dbDeleteExternalStudy,
  deleteLinkedStudy as dbDeleteLinkedStudy,
  deleteTransitionPlan as dbDeleteTransitionPlan,
  updateExternalStudy as dbUpdateExternalStudy,
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
  saveIndicatorsOnAction,
  TransitionPlanWithRelations,
  TransitionPlanWithStudies,
  updateAction,
} from '@/db/transitionPlan'
import { ApiResponse, withServerResponse } from '@/utils/serverResponse'
import { getYearFromDateStr } from '@/utils/time'
import { TransitionPlan } from '@prisma/client'
import { dbActualizedAuth } from '../auth'
import { NOT_AUTHORIZED, NOT_FOUND } from '../permissions/check'
import { canReadStudy, hasEditAccessOnStudy, hasReadAccessOnStudy } from '../permissions/study'
import { canEditTransitionPlan, canReadTransitionPlan } from '../permissions/transitionPlan'
import { AddActionCommand, ExternalStudyCommand } from './transitionPlan.command'

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

    const plans = await getOrganizationTransitionPlans(study.organizationVersionId, study.startDate.getFullYear())

    const accessiblePlans = await Promise.all(
      plans.map(async (plan) => {
        const hasReadAccess = await hasReadAccessOnStudy(plan.studyId)
        return hasReadAccess ? plan : null
      }),
    )

    return accessiblePlans.filter((plan) => plan !== null && plan.studyId !== studyId) as TransitionPlanWithStudies[]
  })

export const initializeTransitionPlan = async (studyId: string, sourceTransitionPlanId?: string) =>
  withServerResponse('initializeTransitionPlan', async () => {
    const hasEditAccess = await hasEditAccessOnStudy(studyId)
    if (!hasEditAccess) {
      throw new Error(NOT_AUTHORIZED)
    }

    const existingPlan = await getTransitionPlanByStudyId(studyId)
    if (existingPlan) {
      throw new Error('Transition plan already exists for this study')
    }

    if (sourceTransitionPlanId) {
      await duplicateTransitionPlan(sourceTransitionPlanId, studyId)
    } else {
      await createTransitionPlan(studyId)
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

  const duplicated = await duplicateTransitionPlanWithRelations(sourceTransitionPlan, targetStudyId)

  const [sourceStudy, targetStudy] = await Promise.all([
    getStudyById(sourceTransitionPlan.studyId, null),
    getStudyById(targetStudyId, null),
  ])

  if (!targetStudy) {
    console.error('Cannot link studies because target is not found with id ' + targetStudyId)
    return duplicated
  }

  if (!sourceStudy) {
    console.error('Cannot link studies because source is not found with id ' + sourceTransitionPlan.studyId)
    return duplicated
  }

  if (targetStudy.startDate.getFullYear() > sourceStudy.startDate.getFullYear()) {
    await linkOldStudy(duplicated.id, sourceStudy.id)
  }

  return duplicated
}

export const addAction = async (command: AddActionCommand) =>
  withServerResponse('addAction', async () => {
    const hasEditAccess = await canEditTransitionPlan(command.transitionPlanId)
    if (!hasEditAccess) {
      throw new Error(NOT_AUTHORIZED)
    }

    const { indicators, ...actionData } = command
    await prismaClient.action.create({
      data: {
        ...actionData,
        ...(indicators && {
          indicators: { create: indicators.map((ind) => ({ type: ind.type, description: ind.description })) },
        }),
      },
    })
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

    const currentStudyYear = transitionPlanStudy.startDate.getFullYear()
    const linkedStudyYear = studyToLink.startDate.getFullYear()

    if (linkedStudyYear >= currentStudyYear) {
      throw new Error('studyYearMustBeBeforeCurrent')
    }

    if (await isYearAlreadyLinked(transitionPlan.id, linkedStudyYear)) {
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

    const transitionPlan = await getTransitionPlanById(command.transitionPlanId)
    if (!transitionPlan) {
      throw new Error(NOT_AUTHORIZED)
    }

    const session = await dbActualizedAuth()
    if (!session || !session.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    const currentStudy = await getStudyById(transitionPlan.studyId, session.user.organizationVersionId)
    if (!currentStudy) {
      throw new Error(NOT_AUTHORIZED)
    }

    const currentStudyYear = currentStudy.startDate.getFullYear()
    const externalStudyYear = getYearFromDateStr(command.date)

    if (externalStudyYear >= currentStudyYear) {
      throw new Error('studyYearMustBeBeforeCurrent')
    }

    if (await isYearAlreadyLinked(command.transitionPlanId, externalStudyYear)) {
      throw new Error('yearAlreadySet')
    }

    await createExternalStudy(command)
  })

export const updateExternalStudy = async (command: ExternalStudyCommand) =>
  withServerResponse('updateExternalStudy', async () => {
    const { transitionPlanId, externalStudyId, ...updateData } = command

    const hasEditAccess = await canEditTransitionPlan(transitionPlanId)
    if (!hasEditAccess) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (!externalStudyId) {
      throw new Error('External study ID is required for update')
    }

    const transitionPlan = await getTransitionPlanById(transitionPlanId)
    if (!transitionPlan) {
      throw new Error(NOT_AUTHORIZED)
    }

    const session = await dbActualizedAuth()
    if (!session || !session.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    const currentStudy = await getStudyById(transitionPlan.studyId, session.user.organizationVersionId)
    if (!currentStudy) {
      throw new Error(NOT_AUTHORIZED)
    }

    const currentStudyYear = currentStudy.startDate.getFullYear()

    if (updateData.date) {
      const updatedYear = getYearFromDateStr(updateData.date)

      if (updatedYear >= currentStudyYear) {
        throw new Error('studyYearMustBeBeforeCurrent')
      }

      if (await isYearAlreadyLinked(transitionPlanId, updatedYear)) {
        const startDate = new Date(`01-01-${updatedYear}`)
        const endDate = new Date(`01-01-${updatedYear + 1}`)

        const [externalStudies, linkedStudies] = await Promise.all([
          getExternalStudiesForTransitionPlanAndYear(transitionPlanId, startDate, endDate),
          getLinkedStudiesForTransitionPlanAndYear(transitionPlanId, startDate, endDate),
        ])

        const otherStudies = [...externalStudies.filter((s) => s.id !== externalStudyId), ...linkedStudies]

        if (otherStudies.length > 0) {
          throw new Error('yearAlreadySet')
        }
      }
    }

    await dbUpdateExternalStudy(externalStudyId, updateData)
  })

export const deleteExternalStudy = async (studyId: string, transitionPlanId: string) =>
  withServerResponse('deleteExternalStudy', async () => {
    const hasEditAccess = await canEditTransitionPlan(transitionPlanId)
    if (!hasEditAccess) {
      throw new Error(NOT_AUTHORIZED)
    }

    await dbDeleteExternalStudy(studyId)
  })

export const getLinkedAndExternalStudies = async (transitionPlanId: string) =>
  withServerResponse('getLinkedAndExternalStudies', async () => {
    const hasReadAccess = await canReadTransitionPlan(transitionPlanId)
    if (!hasReadAccess) {
      throw new Error(NOT_AUTHORIZED)
    }

    const [externalStudies, transitionPlanStudies] = await Promise.all([
      getExternalStudiesForTransitionPlan(transitionPlanId),
      getLinkedStudiesForTransitionPlan(transitionPlanId),
    ])

    const linkedStudyIds = transitionPlanStudies.map((transitionPlan) => transitionPlan.studyId)

    const linkedStudies = await getStudyByIds(linkedStudyIds)

    return { linkedStudies, externalStudies }
  })

export const deleteLinkedStudy = async (studyId: string, transitionPlanId: string) =>
  withServerResponse('deleteLinkedStudy', async () => {
    const hasEditAccess = await canEditTransitionPlan(transitionPlanId)
    if (!hasEditAccess) {
      throw new Error(NOT_AUTHORIZED)
    }

    await dbDeleteLinkedStudy(studyId, transitionPlanId)
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

    const { indicators, ...actionData } = command

    await updateAction(id, actionData)

    if (indicators) {
      const existingIndicatorIds = action.indicators.map((ind) => ind.id)
      const newIndicatorIds = indicators.map((ind) => ind.id).filter(Boolean)
      const indicatorsToDelete = existingIndicatorIds.filter((existingId) => !newIndicatorIds.includes(existingId))

      await saveIndicatorsOnAction(id, indicators, indicatorsToDelete)
    }
  })

export const deleteAction = async (id: string) =>
  withServerResponse('deleteAction', async () => {
    const action = await getActionById(id)
    if (!action) {
      throw new Error(NOT_AUTHORIZED)
    }

    const hasEditAccess = await canEditTransitionPlan(action.transitionPlanId)
    if (!hasEditAccess) {
      throw new Error(NOT_AUTHORIZED)
    }

    await dbDeleteAction(id)
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

export const deleteTransitionPlan = async (studyId: string) =>
  withServerResponse('deleteTransitionPlan', async () => {
    const hasEditAccess = await hasEditAccessOnStudy(studyId)
    if (!hasEditAccess) {
      throw new Error(NOT_AUTHORIZED)
    }

    const transitionPlan = await getTransitionPlanByStudyId(studyId)
    if (!transitionPlan) {
      throw new Error(NOT_FOUND)
    }

    await dbDeleteTransitionPlan(transitionPlan.id)
  })
