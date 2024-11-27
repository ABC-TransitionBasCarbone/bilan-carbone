import { type Prisma, EmissionFactorStatus } from '@prisma/client'
import { prismaClient } from './client'

const selectEmissionFactor = {
  id: true,
  status: true,
  totalCo2: true,
  location: true,
  source: true,
  unit: true,
  importedFrom: true,
  reliability: true,
  technicalRepresentativeness: true,
  geographicRepresentativeness: true,
  temporalRepresentativeness: true,
  completeness: true,
  metaData: {
    select: {
      language: true,
      title: true,
      attribute: true,
      comment: true,
      location: true,
    },
  },
}

export const getAllValidEmissionFactors = (organizationId: string) =>
  prismaClient.emissionFactor.findMany({
    where: {
      status: EmissionFactorStatus.Valid,
      OR: [{ organizationId: null }, { organizationId }],
    },
    select: selectEmissionFactor,
    orderBy: { createdAt: 'desc' },
  })

export const getAllEmissionFactorsByIds = (ids: string[], organizationId: string) =>
  prismaClient.emissionFactor.findMany({
    where: {
      id: { in: ids },
      OR: [{ organizationId: null }, { organizationId }],
    },
    select: selectEmissionFactor,
    orderBy: { createdAt: 'desc' },
  })

export const getAllEmissionFactorsByIds = (ids: string[], organizationId: string) =>
  prismaClient.emissionFactor.findMany({
    where: {
      id: { in: ids },
      OR: [{ organizationId: null }, { organizationId }],
    },
    select: {
      id: true,
      status: true,
      totalCo2: true,
      location: true,
      source: true,
      unit: true,
      importedFrom: true,
      reliability: true,
      technicalRepresentativeness: true,
      geographicRepresentativeness: true,
      temporalRepresentativeness: true,
      completeness: true,
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
    orderBy: { createdAt: 'desc' },
  })

export const createEmissionFactor = (emissionFactor: Prisma.EmissionFactorCreateInput) =>
  prismaClient.emissionFactor.create({
    data: emissionFactor,
  })
