import { type Prisma, EmissionStatus } from '@prisma/client'
import { prismaClient } from './client'

export const getAllValidEmissions = (organizationId: string) =>
  prismaClient.emission.findMany({
    where: {
      status: EmissionStatus.Valid,
      OR: [{ organizationId: null }, { organizationId }],
    },
    select: {
      status: true,
      totalCo2: true,
      location: true,
      source: true,
      unit: true,
      importedFrom: true,
      metaData: {
        select: {
          language: true,
          title: true,
          attribute: true,
          comment: true,
          location: true,
        },
      },
    },
  })

export const createEmission = (emission: Prisma.EmissionCreateInput) =>
  prismaClient.emission.create({
    data: emission,
  })
