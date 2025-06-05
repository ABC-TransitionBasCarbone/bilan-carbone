import { LocaleType } from '@/i18n/config'
import { EmissionFactorCommand, UpdateEmissionFactorCommand } from '@/services/serverFunctions/emissionFactor.command'
import { flattenSubposts } from '@/utils/post'
import { EmissionFactorStatus, Import, Unit, type Prisma } from '@prisma/client'
import { Session } from 'next-auth'
import { prismaClient } from './client'
import { getOrganizationVersionById } from './organization'

let cachedEmissionFactors: AsyncReturnType<typeof getDefaultEmissionFactors> = []

const selectEmissionFactor = {
  id: true,
  status: true,
  totalCo2: true,
  location: true,
  source: true,
  unit: true,
  customUnit: true,
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

const getEmissionFactorsFromIdsExceptVersions = (ids: string[], versionIds: string[]) =>
  prismaClient.emissionFactor.findMany({
    where: { id: { in: ids }, versionId: { notIn: versionIds } },
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

export const getAllEmissionFactors = async (
  organizationId: string | null,
  studyId?: string,
  withCut: boolean = false,
) => {
  let versionIds
  let studyOldEmissionFactors: Awaited<ReturnType<typeof getDefaultEmissionFactors>> = []
  if (studyId) {
    const study = await prismaClient.study.findFirst({
      where: { id: studyId },
      include: { emissionFactorVersions: true, emissionSources: true },
    })
    if (!study) {
      return []
    }
    versionIds = study.emissionFactorVersions.map((version) => version.importVersionId)
    const selectedEmissionFactors = study.emissionSources
      .map((emissionSource) => emissionSource.emissionFactorId)
      .filter((id) => id !== null)

    studyOldEmissionFactors = await getEmissionFactorsFromIdsExceptVersions(selectedEmissionFactors, versionIds)
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

  const allEmissionFactors = organizationEmissionFactor.concat(defaultEmissionFactors).concat(studyOldEmissionFactors)
  if (withCut) {
    return allEmissionFactors
  }

  return allEmissionFactors.filter((emissionFactor) => emissionFactor.importedFrom !== Import.CUT)
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

export const createEmissionFactorWithParts = (
  emissionFactor: Prisma.EmissionFactorCreateInput,
  parts: EmissionFactorCommand['parts'],
  local: LocaleType,
) => {
  return prismaClient.$transaction(async (transaction) => {
    const createdEmissionFactor = await transaction.emissionFactor.create({ data: emissionFactor })
    await Promise.all(
      parts.map(({ name, ...part }) =>
        transaction.emissionFactorPart.create({
          data: {
            emissionFactorId: createdEmissionFactor.id,
            ...part,
            metaData: { create: { language: local, title: name } },
          },
        }),
      ),
    )
  })
}

export const updateEmissionFactor = async (
  session: Session,
  local: string,
  { id, name, unit, attribute, comment, parts, subPosts, ...command }: UpdateEmissionFactorCommand,
) => {
  const accountOrganizationVersion = await getOrganizationVersionById(session.user.organizationVersionId)

  const emissionFactor = {
    ...command,
    importedFrom: Import.Manual,
    status: EmissionFactorStatus.Valid,
    organization: { connect: { id: accountOrganizationVersion?.organizationId } },
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

export const deleteEmissionFactorAndDependencies = (id: string) =>
  prismaClient.$transaction(async (transaction) => {
    const emissionFactorParts = await transaction.emissionFactorPart.findMany({ where: { emissionFactorId: id } })
    await transaction.emissionFactorPartMetaData.deleteMany({
      where: { emissionFactorPartId: { in: emissionFactorParts.map((emissionFactorPart) => emissionFactorPart.id) } },
    })

    await Promise.all([
      transaction.studyEmissionSource.deleteMany({ where: { emissionFactorId: id } }),
      transaction.emissionFactorMetaData.deleteMany({ where: { emissionFactorId: id } }),
      transaction.emissionFactorPart.deleteMany({
        where: { id: { in: emissionFactorParts.map((emissionFactorPart) => emissionFactorPart.id) } },
      }),
    ])

    await transaction.emissionFactor.delete({ where: { id } })
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

export const getEmissionFactorSources = async (withCut: boolean = false) => {
  if (withCut) {
    return prismaClient.emissionFactorImportVersion.findMany()
  }
  return prismaClient.emissionFactorImportVersion.findMany({ where: { source: { not: Import.CUT } } })
}

export const getStudyEmissionFactorSources = async (studyId: string, withCut: boolean = false) => {
  const versionIds = (
    await prismaClient.studyEmissionFactorVersion.findMany({
      where: { studyId },
      select: { importVersionId: true },
    })
  ).map((studyVersion) => studyVersion.importVersionId)
  if (withCut) {
    return prismaClient.emissionFactorImportVersion.findMany({ where: { id: { in: versionIds } } })
  }
  return prismaClient.emissionFactorImportVersion.findMany({
    where: { id: { in: versionIds }, source: { not: Import.CUT } },
  })
}

export const getEmissionFactorVersionsBySource = async (source: Import) =>
  prismaClient.emissionFactorImportVersion.findMany({ where: { source }, orderBy: { createdAt: 'desc' } })

export const getManualEmissionFactors = async (units: Unit[]) =>
  prismaClient.emissionFactor.findMany({ where: { importedFrom: Import.Manual, unit: { in: units } } })

export const setEmissionFactorUnitAsCustom = async (id: string, unit: string) =>
  prismaClient.emissionFactor.update({ where: { id }, data: { unit: Unit.CUSTOM, customUnit: unit } })

export const getEmissionFactorsImportActiveVersion = async (source: Import) =>
  prismaClient.emissionFactorImportVersion.findFirst({
    where: { source },
    orderBy: { createdAt: 'desc' },
  })

export const findEmissionFactorByImportedId = (id: string) =>
  prismaClient.emissionFactor.findFirst({
    where: { importedId: id },
    select: {
      id: true,
      versionId: true,
      importedId: true,
      unit: true,
      customUnit: true,
      version: { select: { id: true } },
      metaData: true,
    },
  })
