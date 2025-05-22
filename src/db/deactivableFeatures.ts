import { DeactivatableFeature, Environment, Prisma, UserSource } from '@prisma/client'
import { prismaClient } from './client'

export type RestrictionsTypes = UserSource | Environment

export const isFeatureActive = async (feature: DeactivatableFeature) => {
  const featureStatus = await prismaClient.deactivatableFeatureStatus.findUnique({ where: { feature } })
  return !!featureStatus?.active
}

export const getFeaturesRestictions = async () => {
  const deactivableFeatures = await prismaClient.deactivatableFeatureStatus.findMany()
  return deactivableFeatures.map((feature) => ({
    feature: feature.feature,
    active: feature.active,
    deactivatedSources: feature.deactivatedSources,
    deactivatedEnvironments: feature.deactivatedEnvironments,
  }))
}

export const getFeatureRestictions = async (feature: DeactivatableFeature) => {
  const deactivableFeature = await prismaClient.deactivatableFeatureStatus.findUnique({ where: { feature } })
  return {
    deactivatedSources: deactivableFeature?.deactivatedSources,
    deactivatedEnvironments: deactivableFeature?.deactivatedEnvironments,
  }
}

export const updateFeatureRestictions = async (
  feature: DeactivatableFeature,
  target: 'deactivatedSources' | 'deactivatedEnvironments',
  value: RestrictionsTypes[],
) => prismaClient.deactivatableFeatureStatus.update({ where: { feature }, data: { [target]: value } })

export const createDeactivableFeatures = async (data: Prisma.DeactivatableFeatureStatusCreateManyInput[]) =>
  prismaClient.deactivatableFeatureStatus.createMany({ data })

export const createOrUpdateDeactivableFeature = async (
  feature: DeactivatableFeature,
  status: boolean,
  accountId: string,
) =>
  prismaClient.deactivatableFeatureStatus.upsert({
    where: { feature },
    create: { feature, active: status, updatedById: accountId },
    update: { active: status, updatedById: accountId },
  })
