import { type Prisma } from '@prisma/client'
import { unstable_cache } from 'next/cache'
import { prismaClient } from './client'

const selectEmissionFactor = {
  id: true,
  status: true,
  totalCo2: true,
  location: true,
  source: true,
  unit: true,
  importedFrom: true,
  organizationId: true,
  reliability: true,
  technicalRepresentativeness: true,
  geographicRepresentativeness: true,
  temporalRepresentativeness: true,
  completeness: true,
  subPosts: true,
  co2f: true,
  ch4f: true,
  ch4b: true,
  n2o: true,
  co2b: true,
  sf6: true,
  hfc: true,
  pfc: true,
  otherGES: true,
  metaData: {
    select: {
      language: true,
      title: true,
      attribute: true,
      comment: true,
      location: true,
      frontiere: true,
    },
  },
  version: {
    select: {
      name: true,
    },
  },
} as Prisma.EmissionFactorSelect

const getDefaultEmissionFactors = () =>
  prismaClient.emissionFactor.findMany({
    where: { organizationId: null },
    select: selectEmissionFactor,
    orderBy: { createdAt: 'desc' },
  })

const getCachedDefaultEmissionFactors = unstable_cache(() => {
  return getDefaultEmissionFactors()
})

export const getAllEmissionFactors = async (organizationId: string) => {
  const organizationEmissionFactor = await prismaClient.emissionFactor.findMany({
    where: { organizationId },
    select: selectEmissionFactor,
    orderBy: { createdAt: 'desc' },
  })
  const defaultEmissionFactors = await (process.env.NO_CACHE === 'true'
    ? getDefaultEmissionFactors()
    : getCachedDefaultEmissionFactors())
  return organizationEmissionFactor.concat(defaultEmissionFactors)
}

export const getEmissionFactorById = (id: string) =>
  prismaClient.emissionFactor.findUnique({
    where: {
      id,
    },
    select: selectEmissionFactor,
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

export const createEmissionFactor = (emissionFactor: Prisma.EmissionFactorCreateInput) =>
  prismaClient.emissionFactor.create({
    data: emissionFactor,
  })

export const updateEmissionFactor = (
  transaction: Prisma.TransactionClient,
  id: string,
  emissionFactor: Prisma.EmissionFactorUpdateInput,
) =>
  transaction.emissionFactor.update({
    where: { id },
    data: emissionFactor,
  })

const gazColumns = {
  ch4b: true,
  ch4f: true,
  co2b: true,
  co2f: true,
  n2o: true,
  pfc: true,
  hfc: true,
  sf6: true,
  otherGES: true,
  totalCo2: true,
}
export const getEmissionFactorsWithPartsInIds = async (ids: string[]) =>
  prismaClient.emissionFactor.findMany({
    select: {
      id: true,
      organizationId: true,
      ...gazColumns,
      reliability: true,
      technicalRepresentativeness: true,
      geographicRepresentativeness: true,
      temporalRepresentativeness: true,
      completeness: true,
      emissionFactorParts: {
        select: {
          ...gazColumns,
          type: true,
        },
      },
    },
    where: { id: { in: ids } },
  })

export type EmissionFactorWithParts = AsyncReturnType<typeof getEmissionFactorsWithPartsInIds>[0]

export const getEmissionFactorDetailsById = async (id: string) =>
  prismaClient.emissionFactor.findUnique({
    where: { id },
    select: {
      ...selectEmissionFactor,
      ...gazColumns,
      organizationId: true,
      emissionFactorParts: {
        select: {
          ...gazColumns,
          type: true,
          metaData: {
            select: { title: true, language: true },
          },
        },
      },
    },
  })
export type DetailedEmissionFactor = AsyncReturnType<typeof getEmissionFactorDetailsById>
