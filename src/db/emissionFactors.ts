import { LocaleType } from '@/i18n/config'
import { isSourceForEnv } from '@/services/importEmissionFactor/import'
import { EmissionFactorCommand, UpdateEmissionFactorCommand } from '@/services/serverFunctions/emissionFactor.command'
import { localeType } from '@/types/translation'
import { isMonetaryEmissionFactor } from '@/utils/emissionFactors'
import { flattenSubposts } from '@/utils/post'
import { EmissionFactorStatus, Environment, Import, Prisma, Unit } from '@prisma/client'
import { Session } from 'next-auth'
import { prismaClient } from './client'
import { getOrganizationVersionById } from './organization'
import { getSourcesLatestImportVersionId, getSourcesLatestImportVersionIdByOrganizationId } from './study'

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
  subPosts: string[]
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

const getDefaultEmissionFactors = (
  skip: number,
  take: number,
  locale: localeType,
  withCut: boolean,
  organizationId: string | null,
  versionIds?: string[],
): EmissionFactorList[] => {
  const skipSQL = Prisma.sql`${skip}`
  const takeSQL = Prisma.sql`${take}`
  const versionsString = versionIds?.length
    ? Prisma.sql`AND (version_id IN (${Prisma.join(versionIds)}) and ef.organization_id IS NULL) OR (version_id is null and ef.organization_id = ${Prisma.sql`${organizationId}`})`
    : Prisma.empty
  const withCutCondition = withCut ? Prisma.empty : Prisma.sql`AND ef.imported_from != 'CUT'`

  return prismaClient.$queryRaw(Prisma.sql`
 SELECT ef.id, ef.status, ef.total_co2 as ${Prisma.sql`"totalCo2"`}, ef.location, ef.source, ef.unit, ${Prisma.sql`ef."customUnit"`}, ef.is_monetary as ${Prisma.sql`"isMonetary"`},
        ef.imported_from as ${Prisma.sql`"importedFrom"`}, ef.imported_id as ${Prisma.sql`"importedId"`}, ef.organization_id as ${Prisma.sql`"organizationId"`},
        ef.reliability, ef.technical_representativeness as ${Prisma.sql`"technicalRepresentativeness"`},
        ef.geographic_representativeness as ${Prisma.sql`"geographicRepresentativeness"`},
        ef.temporal_representativeness as ${Prisma.sql`"temporalRepresentativeness"`},
        ef.completeness, ef.sub_posts as ${Prisma.sql`"subPosts"`},
        ef.co2f, ef.ch4f, ef.ch4b, ef.n2o, ef.co2b, ef.sf6, ef.hfc, ef.pfc, ef.other_ges as otherGES,
        (SELECT row_to_json(m.*) FROM emission_metadata m WHERE m.emission_factor_id = ef.id AND m.language = ${locale} LIMIT 1 ) AS ${Prisma.sql`"metaData"`}
  FROM emission_factors ef
  JOIN emission_metadata m
    ON m.emission_factor_id = ef.id
  WHERE m.language = 'fr' ${withCutCondition} AND ef.sub_posts IS NOT NULL AND ef.sub_posts::text != '{}' ${versionsString}
  ORDER BY m.title ASC
  LIMIT ${takeSQL} OFFSET ${skipSQL}`) as unknown as EmissionFactorList[]
}

const getDefaultEmissionFactorsCount = (organizationId: string, withCut: boolean, versionIds?: string[]) =>
  prismaClient.emissionFactor.count({
    where: {
      OR: [{ ...(versionIds && { versionId: { in: versionIds } }), organizationId: null }, { organizationId }],
      subPosts: { isEmpty: false },
      ...(!withCut && { importedFrom: { not: Import.CUT } }),
    },
  })

const keepOnlyOneMetadata = <T extends EmissionFactorList>(
  emissionFactors: (Omit<T, 'metaData'> & { metaData: EmissionFactorList['metaData'][] })[],
  locale: localeType,
) => {
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

const getEmissionFactorsFromIdsExceptVersions = async (ids: string[], versionIds: string[], locale: localeType) => {
  const efFromBdd = await prismaClient.emissionFactor.findMany({
    where: { id: { in: ids }, versionId: { notIn: versionIds } },
    select: selectEmissionFactor,
    orderBy: { createdAt: 'desc' },
  })

  return keepOnlyOneMetadata(efFromBdd, locale)
}

export const getAllEmissionFactors = async (
  organizationId: string,
  skip: number,
  take: number,
  locale: localeType,
  studyId?: string,
  withCut: boolean = false,
) => {
  let versionIds
  let studyOldEmissionFactors: EmissionFactorList[] = []
  if (studyId) {
    const study = await prismaClient.study.findFirst({
      where: { id: studyId },
      include: { emissionFactorVersions: true, emissionSources: true },
    })
    if (!study) {
      return { emissionFactors: [], count: 0 }
    }
    versionIds = study.emissionFactorVersions.map((version) => version.importVersionId)
    const selectedEmissionFactors = study.emissionSources
      .map((emissionSource) => emissionSource.emissionFactorId)
      .filter((id) => id !== null)

    studyOldEmissionFactors = await getEmissionFactorsFromIdsExceptVersions(selectedEmissionFactors, versionIds, locale)
  } else {
    versionIds = (await getSourcesLatestImportVersionIdByOrganizationId(organizationId)).map((v) => v.importVersionId)

    if (versionIds.length <= 0) {
      versionIds = (
        await getSourcesLatestImportVersionId(isSourceForEnv(Environment.BC).filter((s) => s !== Import.Manual))
      ).map((v) => v.id)
    }
  }

  const defaultEmissionFactors = await getDefaultEmissionFactors(
    skip,
    take,
    locale,
    withCut,
    organizationId,
    versionIds,
  )

  const emissionFactorsCount = await getDefaultEmissionFactorsCount(organizationId, withCut, versionIds)

  const allEmissionFactors = defaultEmissionFactors.concat(studyOldEmissionFactors)

  return { emissionFactors: allEmissionFactors, count: emissionFactorsCount + studyOldEmissionFactors.length }
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
