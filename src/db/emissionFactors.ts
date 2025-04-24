import { UpdateEmissionFactorCommand } from '@/services/serverFunctions/emissionFactor.command'
import { flattenSubposts } from '@/utils/post'
import { EmissionFactorStatus, Import, Unit, type Prisma } from '@prisma/client'
import { Session } from 'next-auth'
import { prismaClient } from './client'

let cachedEmissionFactors: AsyncReturnType<typeof getDefaultEmissionFactors> = []

const selectEmissionFactor = {
  id: true,
  status: true,
  totalCo2: true,
  location: true,
  source: true,
  unit: true,
  importedFrom: true,
  importedId: true,
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
      id: true,
      name: true,
    },
  },
} as Prisma.EmissionFactorSelect

const getDefaultEmissionFactors = (versionIds?: string[]) =>
  prismaClient.emissionFactor.findMany({
    where: {
      organizationId: null,
      subPosts: { isEmpty: false },
      ...(versionIds && { versionId: { in: versionIds } }),
    },
    select: selectEmissionFactor,
    orderBy: { createdAt: 'desc' },
  })

const filterVersionedEmissionFactor = (
  emissionFactor: AsyncReturnType<typeof getDefaultEmissionFactors>[0],
  versionIds?: string[],
) =>
  !versionIds ||
  !emissionFactor.version ||
  (emissionFactor.version.id && versionIds.includes(emissionFactor.version.id))

const getCachedDefaultEmissionFactors = async (versionIds?: string[]) => {
  if (cachedEmissionFactors.length) {
    return cachedEmissionFactors.filter((emissionFactor) => filterVersionedEmissionFactor(emissionFactor, versionIds))
  }
  const emissionFactors = await getDefaultEmissionFactors()
  cachedEmissionFactors = emissionFactors
  return emissionFactors.filter((emissionFactor) => filterVersionedEmissionFactor(emissionFactor, versionIds))
}

export const getAllEmissionFactors = async (organizationId: string | null, studyId?: string) => {
  let versionIds
  if (studyId) {
    const study = await prismaClient.study.findFirst({
      where: { id: studyId },
      include: { emissionFactorVersions: true },
    })
    if (!study) {
      return []
    }
    versionIds = study.emissionFactorVersions.map((version) => version.importVersionId)
  }
  const organizationEmissionFactor = organizationId
    ? await prismaClient.emissionFactor.findMany({
        where: { organizationId },
        select: selectEmissionFactor,
        orderBy: { createdAt: 'desc' },
      })
    : []

  const defaultEmissionFactors = await (process.env.NO_CACHE === 'true'
    ? getDefaultEmissionFactors(versionIds)
    : getCachedDefaultEmissionFactors(versionIds))

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

export const getEmissionFactorsByIdsAndSource = (ids: string[], source: Import) =>
  prismaClient.emissionFactor.findMany({
    where: {
      id: { in: ids },
      importedFrom: source,
    },
    select: selectEmissionFactor,
  })

export const getEmissionFactorsByImportedIdsAndVersion = (ids: string[], versionId: string) =>
  prismaClient.emissionFactor.findMany({
    where: {
      importedId: { in: ids },
      versionId,
    },
    select: selectEmissionFactor,
  })

export const createEmissionFactor = (emissionFactor: Prisma.EmissionFactorCreateInput) =>
  prismaClient.emissionFactor.create({
    data: emissionFactor,
  })

export const updateEmissionFactor = async (
  session: Session,
  local: string,
  { id, name, unit, attribute, comment, parts, subPosts, ...command }: UpdateEmissionFactorCommand,
) => {
  const emissionFactor = {
    ...command,
    importedFrom: Import.Manual,
    status: EmissionFactorStatus.Valid,
    organization: { connect: { id: session?.user.organizationId as string } },
    unit: unit as Unit,
    subPosts: flattenSubposts(subPosts),
  }
  await prismaClient.$transaction(async (transaction) => {
    await transaction.emissionFactor.update({
      where: { id },
      data: emissionFactor,
    })
    await transaction.emissionFactorMetaData.upsert({
      where: {
        emissionFactorId_language: { emissionFactorId: id, language: local },
      },
      create: { emissionFactorId: id, language: local, title: name, attribute, comment },
      update: { language: local, title: name, attribute, comment },
    })
    const emissionFactorParts = await transaction.emissionFactorPart.findMany({
      where: { emissionFactorId: id },
      select: { id: true },
    })
    const emissionFactorPartIds = emissionFactorParts.map((emissionFactorPart) => emissionFactorPart.id)
    await transaction.emissionFactorPartMetaData.deleteMany({
      where: { emissionFactorPartId: { in: emissionFactorPartIds } },
    })
    await transaction.emissionFactorPart.deleteMany({ where: { id: { in: emissionFactorPartIds } } })
    await Promise.all(
      parts.map(({ name, ...part }) =>
        prismaClient.emissionFactorPart.create({
          data: {
            emissionFactorId: id,
            ...part,
            metaData: {
              create: { language: local, title: name },
            },
          },
        }),
      ),
    )
  })
}

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

export const getEmissionFactorSources = async () => {
  return prismaClient.emissionFactorImportVersion.findMany()
}

export const getStudyEmissionFactorSources = async (studyId: string) => {
  const versionIds = (
    await prismaClient.studyEmissionFactorVersion.findMany({
      where: { studyId },
      select: { importVersionId: true },
    })
  ).map((studyVersion) => studyVersion.importVersionId)
  return prismaClient.emissionFactorImportVersion.findMany({ where: { id: { in: versionIds } } })
}

export const getEmissionFactorVersionsBySource = async (source: Import) =>
  prismaClient.emissionFactorImportVersion.findMany({ where: { source }, orderBy: { createdAt: 'desc' } })
