'use server'

import { prismaClient } from '@/db/client'
import { DeactivatableFeature, Role } from '@prisma/client'
import { auth } from '../auth'
import { NOT_AUTHORIZED } from '../permissions/check'

export const getDeactivableFeaturesStatuses = async () => {
  const session = await auth()
  if (!session || !session.user || session.user.role !== Role.SUPER_ADMIN) {
    return NOT_AUTHORIZED
  }
  const selector = { id: true, feature: true, active: true }

  const featuresStatuses = await prismaClient.deactivatableFeatureStatus.findMany({ select: selector })
  if (featuresStatuses.length === Object.values(DeactivatableFeature).length) {
    return featuresStatuses
  }
  const missing = Object.values(DeactivatableFeature).filter(
    (feature) => !featuresStatuses.map((featuresStatus) => featuresStatus.feature).includes(feature),
  )
  await prismaClient.deactivatableFeatureStatus.createMany({
    data: missing.map((feature) => ({ feature })),
  })

  return prismaClient.deactivatableFeatureStatus.findMany({ select: selector })
}

export const changeDeactivableFeatureStatus = async (feature: DeactivatableFeature, status: boolean) => {
  const session = await auth()
  if (!session || !session.user || session.user.role !== Role.SUPER_ADMIN) {
    return NOT_AUTHORIZED
  }
  await prismaClient.deactivatableFeatureStatus.upsert({
    where: { feature },
    create: { feature, active: status, updatedById: session.user.accountId },
    update: { active: status, updatedById: session.user.accountId },
  })
}

export const isFeatureActive = async (feature: DeactivatableFeature) => {
  const featureStatus = await prismaClient.deactivatableFeatureStatus.findUnique({ where: { feature } })
  return !!featureStatus?.active
}
