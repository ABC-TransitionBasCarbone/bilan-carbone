'use server'

import { FullStudy, getStudyById, getStudyByIds } from '@/db/study'
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
import { getAccountRoleOnStudy, hasEditionRights } from '@/utils/study'
import { DeactivatableFeature, TransitionPlan } from '@prisma/client'
import { UserSession } from 'next-auth'
import { auth, dbActualizedAuth } from '../auth'
import { NOT_AUTHORIZED } from '../permissions/check'
import { canCreateAction, canLinkStudyToTransitionPlan, canViewTransitionPlan } from '../permissions/study'
import { isDeactivableFeatureActiveForEnvironment } from './deactivableFeatures'
import { AddActionCommand } from './study.command'
import { ExternalStudyCommand } from './transitionPlan.command'

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
  withServerResponse('initializeTransitionPlan', async (): Promise<TransitionPlanWithRelations> => {
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
): Promise<TransitionPlanWithRelations> => {
  const sourceTransitionPlan = await getTransitionPlanByIdWithRelations(sourceTransitionPlanId)

  if (!sourceTransitionPlan) {
    throw new Error('Source transition plan not found with id ' + sourceTransitionPlanId)
  }

  return duplicateTransitionPlanWithRelations(sourceTransitionPlan, targetStudyId)
}

export const addAction = async (command: AddActionCommand) =>
  withServerResponse('addAction', async () => {
    const session = await dbActualizedAuth()

    if (!session || !session.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    const transitionPlan = await getTransitionPlanById(command.transitionPlanId)
    if (!transitionPlan) {
      throw new Error('Transition plan not found')
    }

    const study = await getStudyById(transitionPlan.studyId, session.user.organizationVersionId)
    if (!study || !canCreateAction(session.user, study)) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (
      !(await isDeactivableFeatureActiveForEnvironment(
        DeactivatableFeature.TransitionPlan,
        study.organizationVersion.environment,
      ))
    ) {
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

export const linkOldStudy = async (transitionPlanId: string, studyId: string) =>
  withServerResponse('linkOldStudy', async () => {
    const session = await dbActualizedAuth()

    if (!session || !session.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    const [transitionPlan, study] = await Promise.all([
      getTransitionPlanById(transitionPlanId),
      getStudyById(studyId, session.user.organizationVersionId),
    ])
    if (!study || !transitionPlan || !canLinkStudyToTransitionPlan(session.user, study)) {
      throw new Error(NOT_AUTHORIZED)
    }

    const transitionStudy = await getStudyById(transitionPlan.studyId, session.user.organizationVersionId)
    if (study.organizationVersionId !== transitionStudy?.organizationVersionId) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (
      !(await isDeactivableFeatureActiveForEnvironment(
        DeactivatableFeature.TransitionPlan,
        transitionStudy.organizationVersion.environment,
      ))
    ) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (await isYearAlreadyLinked(transitionPlan.id, study.startDate.getFullYear())) {
      throw new Error('yearAlreadySet')
    }

    await createTransitionPlanStudy(transitionPlanId, studyId)
  })

export const addExternalStudy = async (command: ExternalStudyCommand) =>
  withServerResponse('linkExternalStudy', async () => {
    const session = await dbActualizedAuth()

    if (!session || !session.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    const transitionPlan = await getTransitionPlanById(command.transitionPlanId)

    if (!transitionPlan) {
      throw new Error(NOT_AUTHORIZED)
    }

    const study = await getStudyById(transitionPlan.studyId, session.user.organizationVersionId)

    if (!study || !canLinkStudyToTransitionPlan(session.user, study)) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (
      !(await isDeactivableFeatureActiveForEnvironment(
        DeactivatableFeature.TransitionPlan,
        study.organizationVersion.environment,
      ))
    ) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (await isYearAlreadyLinked(transitionPlan.id, new Date(command.date).getFullYear())) {
      throw new Error('yearAlreadySet')
    }

    await createExternalStudy(command)
  })

export const getLinkedStudies = async (transitionPlanId: string) =>
  withServerResponse('linkExternalStudy', async () => {
    const session = await dbActualizedAuth()

    if (!session || !session.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    const transitionPlan = await getTransitionPlanById(transitionPlanId)

    if (!transitionPlan) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (
      !(await isDeactivableFeatureActiveForEnvironment(DeactivatableFeature.TransitionPlan, session.user.environment))
    ) {
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
  withServerResponse('addAction', async () => {
    const session = await dbActualizedAuth()

    if (!session || !session.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    const action = await getActionById(id)
    if (!action || action.transitionPlanId !== command.transitionPlanId) {
      throw new Error(NOT_AUTHORIZED)
    }

    const transitionPlan = await getTransitionPlanById(command.transitionPlanId)
    if (!transitionPlan) {
      throw new Error('Transition plan not found')
    }

    const study = await getStudyById(transitionPlan.studyId, session.user.organizationVersionId)
    if (!study || !canCreateAction(session.user, study)) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (
      !(await isDeactivableFeatureActiveForEnvironment(
        DeactivatableFeature.TransitionPlan,
        study.organizationVersion.environment,
      ))
    ) {
      throw new Error(NOT_AUTHORIZED)
    }
    await updateAction(id, command)
  })

export const getStudyActions = async (studyId: string) =>
  withServerResponse('getStudyActions', async () => {
    const session = await dbActualizedAuth()

    if (!session || !session.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    const study = await getStudyById(studyId, session.user.organizationVersionId)
    if (!study || !getAccountRoleOnStudy(session.user, study)) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (
      !(await isDeactivableFeatureActiveForEnvironment(
        DeactivatableFeature.TransitionPlan,
        study.organizationVersion.environment,
      ))
    ) {
      throw new Error(NOT_AUTHORIZED)
    }

    const transitionPlan = await getTransitionPlanByStudyId(studyId)
    if (!transitionPlan) {
      return []
    }

    return getActions(transitionPlan.id)
  })
