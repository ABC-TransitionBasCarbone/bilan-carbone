import { getTransitionPlanById } from '@/db/transitionPlan'
import { getEnvironment } from '@/i18n/environment'
import { DeactivatableFeature, Environment } from '@prisma/client'
import { isDeactivableFeatureActiveForEnvironment } from '../serverFunctions/deactivableFeatures'
import { hasEditAccessOnStudy, hasReadAccessOnStudy } from './study'

export const isFeatureTransitionPlanActive = async (environment: Environment) => {
  const isTransitionPlanFeatureActive = await isDeactivableFeatureActiveForEnvironment(
    DeactivatableFeature.TransitionPlan,
    environment,
  )
  return isTransitionPlanFeatureActive.success && isTransitionPlanFeatureActive.data
}

export const canReadTransitionPlan = async (transitionPlanId: string) => {
  const environment = await getEnvironment()

  if (!(await isFeatureTransitionPlanActive(environment))) {
    return false
  }

  const transitionPlan = await getTransitionPlanById(transitionPlanId)
  if (!transitionPlan) {
    return false
  }

  return hasReadAccessOnStudy(transitionPlan.studyId)
}

export const canEditTransitionPlan = async (transitionPlanId: string) => {
  const environment = await getEnvironment()

  if (!(await isFeatureTransitionPlanActive(environment))) {
    return false
  }

  const transitionPlan = await getTransitionPlanById(transitionPlanId)
  if (!transitionPlan) {
    return false
  }

  return hasEditAccessOnStudy(transitionPlan.studyId)
}
