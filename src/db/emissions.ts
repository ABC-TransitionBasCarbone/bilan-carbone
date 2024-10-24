import { type Prisma } from '@prisma/client'
import { prismaClient } from './client'

export const getAllEmissions = (organizationId: string) =>
  prismaClient.emission.findMany({
    where: {
      OR: [{ organizationId: null }, { organizationId }],
    },
    select: {
      status: true,
      totalCo2: true,
      location: true,
      source: true,
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
