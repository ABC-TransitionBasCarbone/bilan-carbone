import { DeactivatableFeature, Prisma } from '@prisma/client'
import { prismaClient } from './client'

const selector = { id: true, feature: true, active: true }

export const getDeactivableFeatures = async () => prismaClient.deactivatableFeatureStatus.findMany({ select: selector })

export const isFeatureActive = async (feature: DeactivatableFeature) => {
  const featureStatus = await prismaClient.deactivatableFeatureStatus.findUnique({ where: { feature } })
  return !!featureStatus?.active
}

export const getFeaturesRestictions = async () => {
  const deactivableFeatures = await prismaClient.deactivatableFeatureStatus.findMany()
  return deactivableFeatures.map((feature) => ({
    feature: feature.feature,
    sources: feature.deactivatedSources,
    environments: feature.deactivatedEnvironments,
  }))
}

export const getFeatureRestictions = async (feature: DeactivatableFeature) => {
  const deactivableFeature = await prismaClient.deactivatableFeatureStatus.findUnique({ where: { feature } })
  return {
    deactivatedSources: deactivableFeature?.deactivatedSources,
    deactivatedEnvironments: deactivableFeature?.deactivatedEnvironments,
  }
}

export const createDeactivableFeatures = async (data: Prisma.DeactivatableFeatureStatusCreateManyInput[]) =>
  prismaClient.deactivatableFeatureStatus.createMany({
    data,
  })

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
