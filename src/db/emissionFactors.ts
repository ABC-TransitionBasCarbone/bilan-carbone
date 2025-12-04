import { LocaleType } from '@/i18n/config'
import { EmissionFactorCommand, UpdateEmissionFactorCommand } from '@/services/serverFunctions/emissionFactor.command'
import { FeFilters } from '@/types/filters'
import { unique } from '@/utils/array'
import { getEmissionFactorSubPostsMap, isMonetaryEmissionFactor } from '@/utils/emissionFactors'
import { flattenSubposts } from '@/utils/post'
import { EmissionFactorStatus, Environment, Import, Prisma, SubPost, Unit } from '@prisma/client'
import { Session } from 'next-auth'
import { prismaClient } from './client'
import { getOrganizationVersionById } from './organization'

const otherSelectEmissionFactor = {
  id: true,
  status: true,
  totalCo2: true,
  location: true,
  source: true,
  unit: true,
  customUnit: true,
  isMonetary: true,
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
  version: {
    select: {
      id: true,
      name: true,
      archived: true,
    },
  },
  emissionFactorParts: { select: { type: true, totalCo2: true } },
}

const selectEmissionFactor = {
  id: true,
  status: true,
  totalCo2: true,
  location: true,
  source: true,
  unit: true,
  customUnit: true,
  isMonetary: true,
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
      archived: true,
    },
  },
  emissionFactorParts: { select: { type: true, totalCo2: true } },
} as Prisma.EmissionFactorSelect

export type EmissionFactorList = {
  id: string
  status: EmissionFactorStatus
  totalCo2: number
  location: string | null
  source: string | null
  unit: Unit | null
  customUnit: string | null
  isMonetary: boolean
  importedFrom: Import
  importedId: string | null
  organizationId: string | null
  reliability: number | null
  technicalRepresentativeness: number | null
  geographicRepresentativeness: number | null
  temporalRepresentativeness: number | null
  completeness: number | null
  subPosts: SubPost[]
  co2f: number | null
  ch4f: number | null
  ch4b: number | null
  n2o: number | null
  co2b: number | null
  sf6: number | null
  hfc: number | null
  pfc: number | null
  otherGES: number | null
  metaData: {
    language: string
    title: string | null
    attribute: string | null
    comment: string | null
    location: string | null
    frontiere: string | null
  }
  version: {
    id: string
    name: string
    archived: boolean
  } | null
  emissionFactorParts: {
    type: string
    totalCo2: number
  }[]
}

const getDefaultEmissionFactorsCount = async (
  filters: FeFilters,
  locale: LocaleType,
  environment: Environment,
  organizationId?: string,
): Promise<{ count: number }> => {
  const count = await prismaClient.emissionFactorMetaData.count(
    getBaseFilterForEmissionFactors(locale, filters, environment, organizationId),
  )

  return { count }
}

export const keepOnlyOneMetadata = <T extends { metaData: EmissionFactorList['metaData'][] }>(
  emissionFactors: T[],
  locale: LocaleType,
): (T & { metaData: EmissionFactorList['metaData'] })[] => {
  return emissionFactors.map((ef) => ({
    ...ef,
    metaData: ef.metaData.find((meta) => meta.language === locale) ?? {
      language: locale,
      title: null,
      attribute: null,
      comment: null,
      location: null,
      frontiere: null,
    },
  }))
}

const getBaseFilterForEmissionFactors = (
  locale: LocaleType,
  filters: FeFilters,
  environment: Environment,
  organizationId?: string,
) => {
  let importedFromCondition = {}
  if (filters.sources.length > 0 && filters.sources.some((source) => source !== 'all')) {
    if (filters.sources.includes(Import.Manual) && filters.sources.length === 1 && organizationId) {
      importedFromCondition = { OR: [{ importedFrom: Import.Manual, organizationId }] }
    } else if (filters.sources.includes(Import.Manual) && organizationId) {
      importedFromCondition = {
        OR: [
          { versionId: { in: filters.sources.filter((s) => s !== Import.Manual) } },
          { importedFrom: Import.Manual, organizationId },
        ],
      }
    } else {
      importedFromCondition = {
        OR: [{ versionId: { in: filters.sources.filter((s) => s !== Import.Manual) } }],
      }
    }
  }

  return {
    where: {
      language: locale,
      ...(filters.search && {
        OR: [
          { title: { contains: filters.search, mode: Prisma.QueryMode.insensitive } },
          { attribute: { contains: filters.search, mode: Prisma.QueryMode.insensitive } },
          { frontiere: { contains: filters.search, mode: Prisma.QueryMode.insensitive } },
        ],
      }),
      ...(filters.location && { location: { contains: filters.location, mode: Prisma.QueryMode.insensitive } }),
      emissionFactor: {
        AND: [
          {
            subPosts: filters.subPosts.some((sp) => sp === 'all')
              ? { isEmpty: false }
              : { hasSome: getEmissionFactorSubPostsMap(filters.subPosts as SubPost[], environment) },
          },
          filters.archived ? {} : { status: { not: EmissionFactorStatus.Archived } },
          filters.units.length > 0 && !filters.units.includes('all')
            ? {
                OR: [{ unit: { in: filters.units as Unit[] } }, { customUnit: { in: filters.units as string[] } }],
              }
            : {},
          importedFromCondition,
        ],
      },
    },
  }
}

const getDefaultEmissionFactors = async (
  skip: number,
  take: number | 'ALL',
  locale: LocaleType,
  filters: FeFilters,
  environment: Environment,
  organizationId?: string,
): Promise<EmissionFactorList[]> => {
  const emissionFactorsMetadata = await prismaClient.emissionFactorMetaData.findMany({
    ...getBaseFilterForEmissionFactors(locale, filters, environment, organizationId),
    skip,
    take: take === 'ALL' ? undefined : take,
    select: {
      language: true,
      title: true,
      attribute: true,
      comment: true,
      location: true,
      frontiere: true,
      emissionFactor: { select: otherSelectEmissionFactor },
    },
    orderBy: { title: 'asc' },
  })

  return emissionFactorsMetadata.map((metadata) => ({
    ...metadata.emissionFactor,
    metaData: {
      language: metadata.language,
      title: metadata.title,
      attribute: metadata.attribute,
      comment: metadata.comment,
      location: metadata.location,
      frontiere: metadata.frontiere,
    },
  }))
}

export const getAllEmissionFactorsLocations = async () => {
  const emissionFactors = await prismaClient.emissionFactor.findMany({
    where: { status: { not: EmissionFactorStatus.Archived } },
    select: { location: true },
  })

  return unique(emissionFactors.map((emissionFactor) => emissionFactor.location)).filter(
    (location) => location !== null,
  )
}

export const getAllEmissionFactors = async (
  organizationId: string | undefined,
  skip: number,
  take: number | 'ALL',
  locale: LocaleType,
  filters: FeFilters,
  environment: Environment,
) => {
  const [defaultEmissionFactors, emissionFactorsCountInfos] = await Promise.all([
    getDefaultEmissionFactors(skip, take, locale, filters, environment, organizationId),
    getDefaultEmissionFactorsCount(filters, locale, environment, organizationId),
  ])

  return {
    emissionFactors: defaultEmissionFactors,
    count: emissionFactorsCountInfos.count,
  }
}

export const getEmissionFactorById = (id: string) =>
  prismaClient.emissionFactor.findUnique({
    where: {
      id,
    },
    select: selectEmissionFactor,
  })

export const getEmissionFactorByImportedIdAndStudiesEmissionSource = (importedId: string, versionIds: string[]) =>
  prismaClient.emissionFactor.findFirst({
    where: {
      importedId,
      versionId: { in: versionIds },
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
) =>
  prismaClient.$transaction(async (transaction) => {
    const createdEmissionFactor = await transaction.emissionFactor.create({
      data: { ...emissionFactor, isMonetary: isMonetaryEmissionFactor(emissionFactor) },
    })
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
    isMonetary: isMonetaryEmissionFactor(command),
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

export const getEmissionFactorImportVersionsBC = async (withArchived?: boolean) => {
  return prismaClient.emissionFactorImportVersion.findMany({
    where: { source: { not: Import.CUT }, ...(!withArchived && { archived: false }) },
  })
}

export const getEmissionFactorImportVersionsCUT = async () => {
  return prismaClient.emissionFactorImportVersion.findMany()
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

export const getEmissionFactorWithoutQuality = async (organizationId: string) =>
  prismaClient.emissionFactor.findMany({
    select: { metaData: { select: { language: true, title: true } } },
    where: {
      organizationId,
      OR: [
        { reliability: null },
        { technicalRepresentativeness: null },
        { geographicRepresentativeness: null },
        { temporalRepresentativeness: null },
        { completeness: null },
      ],
    },
  })
