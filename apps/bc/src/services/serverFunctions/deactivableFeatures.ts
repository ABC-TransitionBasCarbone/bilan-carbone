'use server'

import {
  createDeactivableFeatures,
  createOrUpdateDeactivableFeature,
  getFeatureRestictions,
  getFeaturesRestictions,
  isFeatureActive,
  isFeatureActiveForEnvironment,
  RestrictionsTypes,
  updateFeatureRestictions,
} from '@/db/deactivableFeatures'
import { withServerResponse } from '@/utils/serverResponse'
import { DeactivatableFeature, Environment, UserSource } from '@abc-transitionbascarbone/common/db/enums'
import { NOT_AUTHORIZED } from '@abc-transitionbascarbone/common/services/permissions/check'
import { dbActualizedAuth } from '../auth'
import { requireSuperAdmin } from '../permissions/superAdmin'

export const getDeactivableFeaturesRestrictionValues = async () =>
  withServerResponse('getDeactivableFeaturesRestrictionValues', async () => {
    await requireSuperAdmin('getDeactivableFeaturesRestrictionValues')
    const featuresStatuses = await getFeaturesRestictions()
    if (featuresStatuses.length === Object.values(DeactivatableFeature).length) {
      return featuresStatuses
    }
    const missing = Object.values(DeactivatableFeature).filter(
      (feature) => !featuresStatuses.map((featuresStatus) => featuresStatus.feature).includes(feature),
    )
    await createDeactivableFeatures(missing.map((feature) => ({ feature })))
    return getFeaturesRestictions()
  })

export const changeDeactivableFeatureStatus = async (feature: DeactivatableFeature, status: boolean) =>
  withServerResponse('changeDeactivableFeatureStatus', async () => {
    const user = await requireSuperAdmin('changeDeactivableFeatureStatus')

    await createOrUpdateDeactivableFeature(feature, status, user.accountId)
  })

export const changeDeactivableFeatureRestriction = async (
  feature: DeactivatableFeature,
  restriction: RestrictionsTypes,
  status: boolean,
) =>
  withServerResponse('changeDeactivableFeatureRestriction', async () => {
    await requireSuperAdmin('changeDeactivableFeatureRestriction')

    const active = await isFeatureActive(feature)
    if (!active) {
      console.error('changeDeactivableFeatureRestriction: NOT_AUTHORIZED', { feature })
      throw new Error(NOT_AUTHORIZED)
    }

    let targetRestriction: 'deactivatedSources' | 'deactivatedEnvironments'
    if (new Set(Object.values(UserSource)).has(restriction as UserSource)) {
      targetRestriction = 'deactivatedSources'
    } else if (new Set(Object.values(Environment)).has(restriction as Environment)) {
      targetRestriction = 'deactivatedEnvironments'
    } else {
      throw new Error('invalid value')
    }

    const restrictions = await getFeatureRestictions(feature)

    const targetRestrictions = restrictions ? restrictions[targetRestriction] || [] : []

    const newRestrictions = status
      ? [...targetRestrictions, restriction]
      : targetRestrictions.filter((existingRestriction) => existingRestriction !== restriction)

    return updateFeatureRestictions(feature, targetRestriction, newRestrictions)
  })

export const isDeactivableFeatureActive = async (feature: DeactivatableFeature) => isFeatureActive(feature)

export const isDeactivableFeatureActiveForEnvironment = async (
  feature: DeactivatableFeature,
  environment: Environment,
) =>
  withServerResponse('isDeactivableFeatureActiveForEnvironment', async () => {
    const session = await dbActualizedAuth()
    if (!session || !session.user) {
      console.error('isDeactivableFeatureActiveForEnvironment: NOT_AUTHORIZED', {
        userId: session?.user?.id ?? 'anonymous',
        accountId: session?.user?.accountId,
        environment,
      })
      throw new Error(NOT_AUTHORIZED)
    }

    return isFeatureActiveForEnvironment(feature, environment)
  })

export const getDeactivableFeatureRestrictions = async (feature: DeactivatableFeature) => getFeatureRestictions(feature)
