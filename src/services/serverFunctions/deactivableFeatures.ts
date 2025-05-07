'use server'

import {
  createDeactivableFeatures,
  createOrUpdateDeactivableFeature,
  getDeactivableFeatures,
} from '@/db/deactivableFeatures'
import { withServerResponse } from '@/utils/serverResponse'
import { DeactivatableFeature, Role } from '@prisma/client'
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

export const changeDeactivableFeatureStatus = async (feature: DeactivatableFeature, status: boolean) =>
  withServerResponse(async () => {
    const session = await auth()
    if (!session || !session.user || session.user.role !== Role.SUPER_ADMIN) {
      throw new Error(NOT_AUTHORIZED)
    }

    await createOrUpdateDeactivableFeature(feature, status, session.user.id)
  })
