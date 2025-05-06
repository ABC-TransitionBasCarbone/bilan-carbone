'use server'

import { DeactivatableFeature, Prisma } from '@prisma/client'
import { prismaClient } from './client'

const selector = { id: true, feature: true, active: true }

export const getDeactivableFeatures = async () => prismaClient.deactivatableFeatureStatus.findMany({ select: selector })

export const isFeatureActive = async (feature: DeactivatableFeature) => {
  const featureStatus = await prismaClient.deactivatableFeatureStatus.findUnique({ where: { feature } })
  return !!featureStatus?.active
}

export const createDeactivableFeatures = async (data: Prisma.DeactivatableFeatureStatusCreateManyInput[]) =>
  prismaClient.deactivatableFeatureStatus.createMany({
    data,
  })

export const createOrUpdateDeactivableFeature = async (
  feature: DeactivatableFeature,
  status: boolean,
  userId: string,
) =>
  prismaClient.deactivatableFeatureStatus.upsert({
    where: { feature },
    create: { feature, active: status, updatedById: userId },
    update: { active: status, updatedById: userId },
  })
