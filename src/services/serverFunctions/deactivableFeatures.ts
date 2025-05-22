'use server'

import {
  createDeactivableFeatures,
  createOrUpdateDeactivableFeature,
  getDeactivableFeatures,
  getFeatureRestictions,
  getFeaturesRestictions,
  isFeatureActive,
  RestrictionsTypes,
  updateFeatureRestictions,
} from '@/db/deactivableFeatures'
import { withServerResponse } from '@/utils/serverResponse'
import { DeactivatableFeature, Environment, Role, UserSource } from '@prisma/client'
import { auth } from '../auth'
import { NOT_AUTHORIZED } from '../permissions/check'

export const getDeactivableFeaturesStatuses = async () =>
  withServerResponse(async () => {
    const session = await auth()
    if (!session || !session.user || session.user.role !== Role.SUPER_ADMIN) {
      throw new Error(NOT_AUTHORIZED)
    }

    const featuresStatuses = await getDeactivableFeatures()
    if (featuresStatuses.length === Object.values(DeactivatableFeature).length) {
      return featuresStatuses
    }
    const missing = Object.values(DeactivatableFeature).filter(
      (feature) => !featuresStatuses.map((featuresStatus) => featuresStatus.feature).includes(feature),
    )
    await createDeactivableFeatures(missing.map((feature) => ({ feature })))

    return getDeactivableFeatures()
  })

export const getDeactivableFeaturesRestrictionValues = async () =>
  withServerResponse(async () => {
    const session = await auth()
    if (!session || !session.user || session.user.role !== Role.SUPER_ADMIN) {
      throw new Error(NOT_AUTHORIZED)
    }
    return getFeaturesRestictions()
  })

export const changeDeactivableFeatureStatus = async (feature: DeactivatableFeature, status: boolean) =>
  withServerResponse(async () => {
    const session = await auth()
    if (!session || !session.user || session.user.role !== Role.SUPER_ADMIN) {
      throw new Error(NOT_AUTHORIZED)
    }

    await createOrUpdateDeactivableFeature(feature, status, session.user.accountId)
  })

export const changeDeactivableFeatureRestriction = async (
  feature: DeactivatableFeature,
  restriction: RestrictionsTypes,
  status: boolean,
) =>
  withServerResponse(async () => {
    const session = await auth()
    if (!session || !session.user || session.user.role !== Role.SUPER_ADMIN) {
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

    const targetRestrictions = restrictions[targetRestriction] || []

    const newRestrictions = status
      ? [...targetRestrictions, restriction]
      : targetRestrictions.filter((existingRestriction) => existingRestriction !== restriction)

    return updateFeatureRestictions(feature, targetRestriction, newRestrictions)
  })

export const isDeactivableFeatureActive = async (feature: DeactivatableFeature) => isFeatureActive(feature)

export const getDeactivableFeatureRestrictions = async (feature: DeactivatableFeature) => getFeatureRestictions(feature)
