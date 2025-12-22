import { getSourceLatestImportVersionId } from '@/db/study'
import { getCaracterisationsBySubPost } from '@/services/emissionSource'
import { getEmissionQuality } from '@/services/importEmissionFactor/import'
import { hasDeprecationPeriod } from '@/utils/study'
import {
  ControlMode,
  EmissionFactorImportVersion,
  EmissionFactor as EmissionFactorPrismaModel,
  EmissionSourceCaracterisation,
  Environment,
  Import,
  Level,
  Prisma,
  Export as StudyExport,
  SubPost,
  Unit,
} from '@prisma/client'
import { getJsDateFromExcel } from 'excel-date-to-js'
import { NewPostAndSubPosts, OldNewPostAndSubPostsMapping } from './newPostAndSubPosts'
import {
  EmissionSourceRow,
  EmissionSourcesWorkSheet,
  OldBCWorkSheetsReader,
  StudiesWorkSheet,
  StudyExportsWorkSheet,
  StudySitesWorkSheet,
} from './oldBCWorkSheetsReader'
import {
  getExistingEmissionFactors,
  getExistingEmissionFactorsNames as getExistingEmissionFactorsNamesFromRepository,
  getExistingSitesIds,
} from './repositories'
import { SitesCAsMapper, SitesETPsMapper } from './sitesETPsAndCAs'

interface Study {
  oldBCId: string
  name: string
  startDate: Date | string
  endDate: Date | string
  organizationVersionId: string
}

interface StudySite {
  siteOldBCId: string
}

interface Export {
  type: StudyExport
  control: ControlMode
}

interface EmissionSource {
  siteOldBCId: string
  name: string
  recycledPart: number
  deprecation?: number
  duration?: number
  hectare?: number
  comment: string
  validated: boolean
  emissionFactorOldBCId: string
  value: number
  subPost: SubPost
  reliability: number
  technicalRepresentativeness: number
  geographicRepresentativeness: number
  temporalRepresentativeness: number
  completeness: number
  emissionFactorImportedId: string
  emissionFactorConsoValue: number
  caracterisation: string
}

interface EmissionFactor {
  id: string
  unit: string | null
  version: { id: string; source: string; createdAt: Date } | null
  importedId: string
  emissionFactorConsoValue: number | null
}

const caracterisationMapping: Record<string, EmissionSourceCaracterisation> = {
  Détenu: EmissionSourceCaracterisation.Held,
  'Non détenu location simple': EmissionSourceCaracterisation.NotHeldSimpleRent,
  'Non détenue location simple': EmissionSourceCaracterisation.NotHeldSimpleRent,
  'Non détenu, autre': EmissionSourceCaracterisation.NotHeldOther,
  'Non détenue, autre': EmissionSourceCaracterisation.NotHeldOther,
  'Détenue, procédés': EmissionSourceCaracterisation.HeldProcedeed,
  'Détenue, fugitives': EmissionSourceCaracterisation.HeldFugitive,
  'Non détenu, supporté': EmissionSourceCaracterisation.NotHeldSupported,
  'Non détenue, non suporté': EmissionSourceCaracterisation.NotHeldNotSupported,
  Opéré: EmissionSourceCaracterisation.Operated,
  'Non opéré': EmissionSourceCaracterisation.NotOperated,
  'Non opérée': EmissionSourceCaracterisation.NotOperated,
  'Opérée, procédés': EmissionSourceCaracterisation.OperatedProcedeed,
  'Opérée, fugitives': EmissionSourceCaracterisation.OperatedFugitive,
  'Non opéré, supporté': EmissionSourceCaracterisation.NotOperatedSupported,
  'Non opéré, non supporté': EmissionSourceCaracterisation.NotOperatedNotSupported,
  Location: EmissionSourceCaracterisation.Rented,
  'Mis en location': EmissionSourceCaracterisation.Rented,
  'Utilisé par un intermédiaire': EmissionSourceCaracterisation.UsedByIntermediary,
  'Utilisé par le client final': EmissionSourceCaracterisation.FinalClient,
}

const isCAS = (emissionSource: EmissionSource, emissionFactor: EmissionFactor | null) => {
  return (
    emissionSource.subPost === SubPost.EmissionsLieesAuChangementDAffectationDesSolsCas &&
    emissionFactor &&
    emissionFactor.unit === Unit.HA_YEAR
  )
}

const parseStudies = async (
  transaction: Prisma.TransactionClient,
  studiesWorksheet: StudiesWorkSheet,
  organizationVersionId: string,
): Promise<Study[]> => {
  const relevantStudies = studiesWorksheet.getRows().filter((row) => row.name)

  const orgaVersionIds = await transaction.organizationVersion.findMany({
    where: {
      OR: [{ id: organizationVersionId }, { parentId: organizationVersionId }],
      environment: Environment.BC,
    },
    select: { id: true, organizationId: true },
  })

  const studiesSites = await transaction.site.findMany({
    where: {
      oldBCId: { in: relevantStudies.map((row) => row.siteId as string) },
      organization: { id: { in: orgaVersionIds.map((org) => org.organizationId) } },
    },
    select: { organizationId: true },
  })

  const studiesOrganizations = await transaction.organization.findMany({
    where: {
      id: { in: studiesSites.map((site) => site.organizationId) },
    },
    select: {
      oldBCId: true,
      organizationVersions: true,
      sites: true,
    },
  })

  return relevantStudies
    .map((row) => {
      const studyOrga = studiesOrganizations.find((org) => org.sites.some((site) => site.oldBCId === row.siteId))

      if (!studyOrga) {
        console.warn(`Impossible de retrouver l'organisation pour l'étude oldBCId: ${row.siteId}`)
        return null
      }

      const organizationVersionId = studyOrga.organizationVersions.find(
        (orgVer) => orgVer.environment === Environment.BC,
      )?.id

      if (!organizationVersionId) {
        console.warn(
          `Impossible de retrouver l'organisation dans studyOrga.organizationVersions pour l'étude oldBCId: ${row.siteId}`,
        )
        return null
      }

      return {
        oldBCId: row.oldBCId as string,
        name: row.name as string,
        startDate: row.startDate ? new Date(getJsDateFromExcel(row.startDate as number)) : '',
        endDate: row.endDate ? new Date(getJsDateFromExcel(row.endDate as number)) : '',
        organizationVersionId,
      }
    })
    .filter((study) => study) as Study[]
}

const parseStudySites = (studySitesWorksheet: StudySitesWorkSheet): Map<string, StudySite[]> => {
  return studySitesWorksheet
    .getRows()
    .map<[string, StudySite]>((row) => [
      row.studyOldBCId as string,
      {
        siteOldBCId: row.siteOldBCId as string,
      },
    ])
    .reduce((accumulator, currentValue) => {
      const sites = accumulator.get(currentValue[0])
      if (sites) {
        if (sites.every((site) => site.siteOldBCId !== currentValue[1].siteOldBCId)) {
          sites.push(currentValue[1])
        }
      } else {
        accumulator.set(currentValue[0], [currentValue[1]])
      }
      return accumulator
    }, new Map<string, StudySite[]>())
}

const getType = (type: string) => {
  if (type.startsWith('BEGES')) {
    return StudyExport.Beges
  } else if (type === 'GHG-P') {
    return StudyExport.GHGP
  } else if (type === 'ISO 14069') {
    return StudyExport.ISO14069
  } else {
    return null
  }
}

const getControl = (control: string) => {
  if (control === 'Part du capital') {
    return ControlMode.CapitalShare
  } else if (control === 'Contrôle financier') {
    return ControlMode.Financial
  } else if (control === 'Contrôle opérationnel') {
    return ControlMode.Operational
  } else {
    return null
  }
}

const parseStudyExports = (studyExportsWorksheet: StudyExportsWorkSheet): Map<string, Export[]> => {
  return studyExportsWorksheet
    .getRows()
    .filter((row) => row.type !== 'NULL')
    .map<[string, Export | null]>((row) => {
      const type = getType(row.type as string)
      const control = getControl(row.control as string)
      if (!type) {
        console.warn(`Type ${type} invalide`)
        return [row.studyOldBCId as string, null]
      }
      if (!control) {
        console.warn(`Control ${control} invalide`)
        return [row.studyOldBCId as string, null]
      }
      return [
        row.studyOldBCId as string,
        {
          type: type,
          control: control,
        },
      ]
    })
    .reduce((accumulator, currentValue) => {
      const currentExport = currentValue[1]
      if (currentExport === null) {
        return accumulator
      }
      const exports = accumulator.get(currentValue[0])
      if (exports) {
        if (!exports.some((e) => e.type === currentExport.type)) {
          exports.push(currentExport)
        }
      } else {
        accumulator.set(currentValue[0], [currentExport])
      }
      return accumulator
    }, new Map<string, Export[]>())
}

const mapToSubPost = (newSubPost: string) => {
  const normalizedSubPost = newSubPost
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s,']/g, '')
    .toLowerCase()

  const foundSubPost = Object.values(SubPost).find((subPost) => subPost.toLowerCase() === normalizedSubPost)
  if (foundSubPost) {
    return foundSubPost
  }
  throw new Error(`Sous poste invalide "${newSubPost}"`)
}

const getExistingEmissionFactorsNames = async (
  studyEmissionSourcesWorksheet: EmissionSourcesWorkSheet,
  transaction: Prisma.TransactionClient,
) => {
  const emissionFactorsOldBCIds = studyEmissionSourcesWorksheet
    .getRows()
    .filter((row) => row.studyOldBCId !== '00000000-0000-0000-0000-000000000000')
    .map((row) =>
      row.emissionFactorImportedId == '0' ? `${row.emissionFactorOldBCId}` : `${row.emissionFactorImportedId}`,
    )

  const test = await getExistingEmissionFactorsNamesFromRepository(transaction, emissionFactorsOldBCIds)
  return test
}

const buildEmissionSourceName = (
  row: EmissionSourceRow,
  emissionFactorsNames: Map<string, { name: string; id: string }>,
  newPostAndSubPost: NewPostAndSubPosts,
) => {
  let name = row.descriptifData as string
  if (!name) {
    const emissionFactorName = emissionFactorsNames.get(`${row.emissionFactorImportedId || row.emissionFactorOldBCId}`)
    if (emissionFactorName) {
      name = emissionFactorName.name
    }
  }
  return !name ? `${newPostAndSubPost.newPost} - ${newPostAndSubPost.newSubPost}` : name
}

const parseEmissionSources = (
  postAndSubPostsOldNewMapping: OldNewPostAndSubPostsMapping,
  studyEmissionSourcesWorkSheet: EmissionSourceRow[],
  emissionFactorsNames: Map<string, { name: string; id: string }>,
): [Map<string, EmissionSource[]>, { oldPost: string; reason: string }[]] => {
  const skippedEmissionSource: { oldPost: string; reason: string }[] = []
  const emissionsSources = studyEmissionSourcesWorkSheet
    .map<[string, EmissionSource] | null>((row) => {
      if (row.siteOldBCId === '00000000-0000-0000-0000-000000000000' || row.idefType !== 1) {
        console.log('skipped', row.studyOldBCId)
        return null
      }

      const newPostAndSubPost = postAndSubPostsOldNewMapping.getNewPostAndSubPost({
        domain: row.domain as string,
        category: row.category as string,
        subCategory: row.subCategory as string,
        oldPost: row.post as string,
        oldSubPost: row.subPost as string,
      })
      const name = buildEmissionSourceName(row, emissionFactorsNames, newPostAndSubPost)
      let subPost

      try {
        subPost = mapToSubPost(newPostAndSubPost.newSubPost)
      } catch {
        skippedEmissionSource.push({
          oldPost: `${row.domain} ${row.category} ${row.subCategory} ${row.post} ${row.subPost}`,
          reason: `Sous poste invalide ${subPost}`,
        })
        return null
      }

      const incertitudeDA = getEmissionQuality((row.incertitudeDA as number) * 100)

      return [
        row.studyOldBCId as string,
        {
          siteOldBCId: row.siteOldBCId as string,
          name: name,
          recycledPart: row.recycledPart as number,
          comment: `${row.commentaires ? row.commentaires : ''} ${row.commentairesCollecte ? row.commentairesCollecte : ''}`,
          validated: (row.validationDASaisie as number) === 1,
          emissionFactorOldBCId: row.emissionFactorOldBCId as string,
          value: row.daTotalValue as number,
          subPost: subPost,
          reliability: incertitudeDA,
          technicalRepresentativeness: incertitudeDA,
          geographicRepresentativeness: incertitudeDA,
          temporalRepresentativeness: incertitudeDA,
          completeness: incertitudeDA,
          emissionFactorImportedId: String(row.emissionFactorImportedId),
          emissionFactorConsoValue: row.emissionFactorConsoValue as number,
          caracterisation: row.caracterisation as string,
          deprecation: (row.amortissement === 1 ? row.immoVal : row.amortissement) as number,
          ...(subPost === SubPost.EmissionsLieesAuChangementDAffectationDesSolsCas && {
            duration: 20,
            hectare: typeof row.daTotalValue === 'number' ? row.daTotalValue / 20 : parseFloat(row.daTotalValue) / 20,
          }),
        },
      ]
    })
    .reduce((accumulator, currentValue) => {
      if (currentValue === null) {
        return accumulator
      }
      const emissionSources = accumulator.get(currentValue[0])
      if (emissionSources) {
        emissionSources.push(currentValue[1])
      } else {
        accumulator.set(currentValue[0], [currentValue[1]])
      }
      return accumulator
    }, new Map<string, EmissionSource[]>())

  return [emissionsSources, skippedEmissionSource]
}

const getExistingStudies = async (
  transaction: Prisma.TransactionClient,
  studiesIds: string[],
  organizationVersionId: string,
) => {
  const orgaVersionIds = await transaction.organizationVersion.findMany({
    where: {
      OR: [{ id: organizationVersionId }, { parentId: organizationVersionId }],
      environment: Environment.BC,
    },
    select: { id: true },
  })

  const existingObjects = await transaction.study.findMany({
    where: {
      oldBCId: {
        in: studiesIds,
      },
      organizationVersionId: { in: orgaVersionIds.map((v) => v.id) },
    },
    select: {
      id: true,
      oldBCId: true,
      startDate: true,
      endDate: true,
      organizationVersion: { select: { id: true, organization: { select: { name: true } } } },
    },
  })

  return existingObjects.reduce((map, currentExistingObject) => {
    if (currentExistingObject.oldBCId) {
      map.set(currentExistingObject.oldBCId, {
        id: currentExistingObject.id,
        startDate: currentExistingObject.startDate,
        endDate: currentExistingObject.endDate,
        orgaVersion: currentExistingObject.organizationVersion.organization,
      })
    }
    return map
  }, new Map<string, { id: string; startDate: Date; endDate: Date; orgaVersion: { name: string } }>())
}

const getExistingStudySites = async (transaction: Prisma.TransactionClient, studiesIds: string[]) => {
  const existingStudySites = await transaction.studySite.findMany({
    where: {
      studyId: {
        in: studiesIds,
      },
    },
    select: { id: true, studyId: true, siteId: true },
  })

  return existingStudySites.reduce((map, currentExistingStudySite) => {
    const studySite = {
      id: currentExistingStudySite.id,
      siteId: currentExistingStudySite.siteId,
    }
    const studySites = map.get(currentExistingStudySite.studyId)
    if (studySites) {
      studySites.push(studySite)
    } else {
      map.set(currentExistingStudySite.studyId, [studySite])
    }
    return map
  }, new Map<string, [{ id: string; siteId: string }]>())
}

interface EmissionFactorWithVersion extends EmissionFactorPrismaModel {
  version: EmissionFactorImportVersion | null
}

class EmissionFactorsByImportedIdMap {
  emissionFactorsMap: Map<string, EmissionFactor[]>
  skippedEmissionFactors: Set<string> = new Set()

  constructor(emissionFactors: EmissionFactorWithVersion[]) {
    this.emissionFactorsMap = emissionFactors.reduce((emissionFactorsMap, emissionFactor) => {
      if (emissionFactor.importedId) {
        const emissionFactors = emissionFactorsMap.get(emissionFactor.importedId)
        const emissionFactorItem = {
          id: emissionFactor.id,
          unit: emissionFactor.unit,
          version: emissionFactor.version
            ? {
                id: emissionFactor.version.id,
                source: emissionFactor.version.source,
                createdAt: emissionFactor.version.createdAt,
              }
            : null,
          importedId: emissionFactor.importedId,
          emissionFactorConsoValue: emissionFactor.totalCo2,
        }
        if (emissionFactors) {
          emissionFactors.push(emissionFactorItem)
        } else {
          emissionFactorsMap.set(emissionFactor.importedId, [emissionFactorItem])
        }
      }
      return emissionFactorsMap
    }, new Map<string, EmissionFactor[]>())
  }

  retrieveEmissionFactorMatchingConsoValueOrTakeMoreRecentOne(
    emissionFactorImportedId: string,
    emissionFactorConsoValue: number,
  ) {
    const emissionFactorList = this.emissionFactorsMap.get(emissionFactorImportedId)
    if (!emissionFactorList) {
      this.skippedEmissionFactors.add(emissionFactorImportedId)
      return null
    }

    const sortedByCreatedAtEmissionFactors = emissionFactorList.sort((a, b) =>
      a.version && b.version ? b.version.createdAt.getTime() - a.version.createdAt.getTime() : 1,
    )
    const filteredByConsoValueEmissionFactors = sortedByCreatedAtEmissionFactors.filter(
      (emissionFactor) => emissionFactor.emissionFactorConsoValue === emissionFactorConsoValue,
    )
    if (filteredByConsoValueEmissionFactors.length > 0) {
      return filteredByConsoValueEmissionFactors[0]
    } else {
      return sortedByCreatedAtEmissionFactors[0]
    }
  }
}

class StudiesEmissionFactorVersionsMap {
  studiesEmissionFactorVersionsMap = new Map<string, Map<string, { id: string; createdAt: Date }[]>>()

  getMap() {
    return this.studiesEmissionFactorVersionsMap
  }

  addEmissionFactor(studyId: string, emissionFactor: EmissionFactor) {
    const emissionFactorVersionsMap =
      this.studiesEmissionFactorVersionsMap.get(studyId) ?? new Map<string, { id: string; createdAt: Date }[]>()
    if (emissionFactor.version) {
      const emissionFactorItem = {
        id: emissionFactor.version.id,
        createdAt: emissionFactor.version.createdAt,
      }
      const emissionFactorVersions = emissionFactorVersionsMap.get(emissionFactor.version.source) ?? []
      emissionFactorVersionsMap.set(emissionFactor.version.source, emissionFactorVersions.concat(emissionFactorItem))
      this.studiesEmissionFactorVersionsMap.set(studyId, emissionFactorVersionsMap)
    }
  }
}

export const uploadStudies = async (
  transaction: Prisma.TransactionClient,
  accountId: string,
  organizationVersionId: string,
  postAndSubPostsOldNewMapping: OldNewPostAndSubPostsMapping,
  oldBCWorksheetReader: OldBCWorkSheetsReader,
) => {
  console.log('Import des études...')

  const skippedStudiesInfos: { oldBcId: string; reason: string }[] = []
  const skippedSitesInfos: { oldBcId: string; reason: string }[] = []
  const emissionSourceWithoutFe: Record<string, string[]> = {}
  const nonExistingFEs: Record<string, string[]> = {}

  const studies = await parseStudies(transaction, oldBCWorksheetReader.studiesWorksheet, organizationVersionId)
  const existingEmissionFactorNames = await getExistingEmissionFactorsNames(
    oldBCWorksheetReader.emissionSourcesWorksheet,
    transaction,
  )

  if (studies.length === 0) {
    console.log('Aucune étude à importer.')
    return false
  }

  const studySites = parseStudySites(oldBCWorksheetReader.studySitesWorksheet)
  const studyExports = parseStudyExports(oldBCWorksheetReader.studyExportsWorksheet)

  const studyEmissionSourcesWorksheet = oldBCWorksheetReader.emissionSourcesWorksheet
    .getRows()
    .filter((row) => row.studyOldBCId !== '00000000-0000-0000-0000-000000000000')

  const [studyEmissionSources, skippedEmissionSource] = parseEmissionSources(
    postAndSubPostsOldNewMapping,
    studyEmissionSourcesWorksheet,
    existingEmissionFactorNames,
  )

  const alreadyImportedStudyIds = await transaction.study.findMany({
    where: {
      oldBCId: { in: studies.map((study) => study.oldBCId) },
      organizationVersionId: organizationVersionId,
    },
    select: {
      id: true,
      oldBCId: true,
    },
  })

  const newStudies = studies
    .filter((study) =>
      alreadyImportedStudyIds.every((alreadyImportedStudy) => alreadyImportedStudy.oldBCId !== study.oldBCId),
    )
    .filter((study) => {
      const studySitesArray = studySites.get(study.oldBCId)
      const canCreateStudy = studySitesArray?.some((site) => site.siteOldBCId !== 'NULL')

      if (!canCreateStudy) {
        console.log({
          oldBcId: study.oldBCId,
          reason: "Etude ignorée - Aucun site sélectionné, demander à l'utilisateur de le sélectionner",
        })
        return false
      }
      return true
    })

  const createdStudies = await transaction.study.createMany({
    data: newStudies.map((study) => ({
      ...study,
      createdById: accountId,
      isPublic: false,
      level: Level.Initial,
      organizationVersionId: study.organizationVersionId,
    })),
  })

  console.log(createdStudies.count, 'études créées.')

  const existingStudies = await getExistingStudies(transaction, Array.from(studySites.keys()), organizationVersionId)
  const sitesOldBCIds = Array.from(
    studySites.values().flatMap((studySites) => studySites.map((studySite) => studySite.siteOldBCId)),
  )
  const existingSiteIds = await getExistingSitesIds(transaction, sitesOldBCIds)

  const sitesETPsMapper = new SitesETPsMapper(oldBCWorksheetReader.sitesETPsWorksheet)
  const sitesCAsMapper = new SitesCAsMapper(oldBCWorksheetReader.sitesCAsWorksheet)

  const createdStudySites = await transaction.studySite.createMany({
    data: Array.from(
      studySites.entries().flatMap(([studyOldBCId, studySites]) => {
        // N'importer que les studySites d'études nouvelles.
        if (!newStudies.some((newStudy) => newStudy.oldBCId === studyOldBCId)) {
          return []
        }
        const existingStudy = existingStudies.get(studyOldBCId)
        if (!existingStudy) {
          console.warn(`Impossible de retrouver l'étude de oldBCId: ${studyOldBCId}`)
          return []
        }
        return studySites
          .map((studySite) => {
            if (studySite.siteOldBCId === 'NULL') {
              skippedStudiesInfos.push({
                oldBcId: studyOldBCId,
                reason: "Etude ignorée - Aucun site sélectionné, demander à l'utilisateur de le sélectionner",
              })
              return null
            }

            const existingSiteId = existingSiteIds.get(studySite.siteOldBCId)
            if (!existingSiteId) {
              skippedSitesInfos.push({
                oldBcId: studySite.siteOldBCId,
                reason: `Site d'étude ignoré - Le site n'existe plus ${studySite.siteOldBCId} ${studyOldBCId}`,
              })
              return null
            }

            const siteETP = sitesETPsMapper.getMatchingSiteAdditionalData(
              studySite.siteOldBCId,
              existingStudy.startDate,
              existingStudy.endDate,
            )
            const siteCA = sitesCAsMapper.getMatchingSiteAdditionalData(
              studySite.siteOldBCId,
              existingStudy.startDate,
              existingStudy.endDate,
            )

            return {
              studyId: existingStudy.id,
              siteId: existingSiteId,
              etp: siteETP ? siteETP.numberOfEmployees : 1,
              ca: siteCA ? siteCA.ca : 1,
            }
          })
          .filter((studySite) => studySite !== null)
      }),
    ),
  })

  console.log(`Création de ${createdStudySites.count} studySites.`)

  const createdStudyExport = await transaction.studyExport.createMany({
    data: Array.from(
      studyExports.entries().flatMap(([studyOldBCId, exportsForThisStudy]) => {
        // N'importer que les exports d'études nouvelles.
        if (!newStudies.some((newStudy) => newStudy.oldBCId === studyOldBCId)) {
          return []
        }
        const existingStudy = existingStudies.get(studyOldBCId)
        if (!existingStudy) {
          console.warn(`Impossible de retrouver l'étude de oldBCId: ${studyOldBCId}`)
          return []
        }
        if (skippedStudiesInfos.some((s) => s.oldBcId === studyOldBCId)) {
          return []
        }

        return exportsForThisStudy
          .map((studyExport) => ({
            ...studyExport,
            studyId: existingStudy.id,
          }))
          .filter((studyExport) => studyExport !== null)
      }),
    ),
  })

  console.log(`Création de ${createdStudyExport.count} studyExports.`)

  const existingStudySites = await getExistingStudySites(
    transaction,
    Array.from(
      studyEmissionSources
        .keys()
        .map((studyOldBCId) => existingStudies.get(studyOldBCId))
        .filter((study) => study !== undefined)
        .map((study) => study.id),
    ),
  )

  const emissionFactorImportedIds = new Set(
    Array.from(
      studyEmissionSources
        .values()
        .flatMap((studyEmissionSources) =>
          studyEmissionSources.map((studyEmissionSource) => studyEmissionSource.emissionFactorImportedId),
        ),
    ),
  )

  const emissionFactorOldBCIds = Array.from(
    studyEmissionSources
      .values()
      .flatMap((studyEmissionSources) =>
        studyEmissionSources.map((studyEmissionSource) => studyEmissionSource.emissionFactorOldBCId),
      ),
  )
  const emissionFactors = await getExistingEmissionFactors(
    transaction,
    Array.from(emissionFactorImportedIds),
    emissionFactorOldBCIds,
  )

  const emissionFactorsByImportedIdMap = new EmissionFactorsByImportedIdMap(emissionFactors)
  const studiesEmissionFactorVersionsMap = new StudiesEmissionFactorVersionsMap()
  const createdEmissionSource = await transaction.studyEmissionSource.createMany({
    data: Array.from(
      studyEmissionSources.entries().flatMap(([studyOldBCId, studyEmissionSourcesNew]) => {
        // N'importer que les sources d'émission d'études nouvelles.
        if (!newStudies.some((newStudy) => newStudy.oldBCId === studyOldBCId)) {
          return []
        }
        const existingStudy = existingStudies.get(studyOldBCId)
        if (!existingStudy) {
          console.warn(`Impossible de retrouver l'étude de oldBCId: ${studyOldBCId}`)
          return []
        }
        if (skippedStudiesInfos.some((s) => s.oldBcId === studyOldBCId)) {
          console.log(`Étude ignorée ${studyOldBCId} car dans la liste des études à ignorer`)
          return []
        }

        return studyEmissionSourcesNew
          .map((studyEmissionSource) => {
            if (
              studyEmissionSource.siteOldBCId === 'NULL' ||
              skippedSitesInfos.some((s) => s.oldBcId === studyEmissionSource.siteOldBCId)
            ) {
              console.log(
                `Source d'émission ignorée - car dans skippedINfos ${studyOldBCId} ${studyEmissionSource.siteOldBCId}`,
              )
              return null
            }

            const existingSiteId = existingSiteIds.get(studyEmissionSource.siteOldBCId)
            if (!existingSiteId) {
              console.warn(
                `Source d'émission ignorée - Impossible de retrouver le site de oldBCId: ${studyEmissionSource.siteOldBCId}`,
              )
              return null
            }
            const studySites = existingStudySites.get(existingStudy.id)
            if (!studySites) {
              console.warn(
                `Source d'émission ignorée - Impossible de retrouver les studySites de studyId: ${existingStudy.id} ${studyOldBCId}`,
              )
              return null
            }
            const studySite = studySites.find((studySite) => studySite.siteId === existingSiteId)
            if (!studySite) {
              skippedStudiesInfos.push({
                oldBcId: studyOldBCId,
                reason: `Source d'émission ignorée - Le site associée n'est pas sélectionné pour l'étude ${studyOldBCId} ${studyEmissionSource.siteOldBCId}`,
              })
              return null
            }

            let emissionFactor: EmissionFactor | null = null
            let emissionFactorId: string | null = null
            if (studyEmissionSource.emissionFactorImportedId !== '0') {
              emissionFactor =
                emissionFactorsByImportedIdMap.retrieveEmissionFactorMatchingConsoValueOrTakeMoreRecentOne(
                  studyEmissionSource.emissionFactorImportedId,
                  studyEmissionSource.emissionFactorConsoValue,
                )
              if (emissionFactor) {
                studiesEmissionFactorVersionsMap.addEmissionFactor(existingStudy.id, emissionFactor)
                emissionFactorId = emissionFactor.id
              } else {
                if (!emissionSourceWithoutFe[studyEmissionSource.emissionFactorImportedId]) {
                  emissionSourceWithoutFe[studyEmissionSource.emissionFactorImportedId] = [studyOldBCId]
                } else {
                  emissionSourceWithoutFe[studyEmissionSource.emissionFactorImportedId].push(studyOldBCId)
                }
              }
            } else {
              const existingEmissionFactor = existingEmissionFactorNames.get(studyEmissionSource.emissionFactorOldBCId)
              if (existingEmissionFactor) {
                emissionFactorId = existingEmissionFactor.id
              } else {
                if (!nonExistingFEs[studyEmissionSource.emissionFactorOldBCId]) {
                  nonExistingFEs[studyEmissionSource.emissionFactorOldBCId] = [studyEmissionSource.name]
                } else {
                  nonExistingFEs[studyEmissionSource.emissionFactorOldBCId].push(studyEmissionSource.name)
                }
                console.log(
                  `Impossible de retrouver le facteur d'émission de oldBCId: ${studyEmissionSource.emissionFactorOldBCId} - On crée la source sans FE`,
                )
              }
            }

            const exports = studyExports.get(studyOldBCId) ?? []
            const subPostCaracterisation = getCaracterisationsBySubPost(
              studyEmissionSource.subPost,
              exports,
              Environment.BC,
            )

            let caracterisation = caracterisationMapping[studyEmissionSource.caracterisation]
            if (!caracterisation && subPostCaracterisation.length === 1) {
              caracterisation = subPostCaracterisation[0]
            }

            const canBeValidated = !!(
              emissionFactorId &&
              studyEmissionSource.value &&
              // (!exports.length || caracterisation) &&
              (!isCAS(studyEmissionSource, emissionFactor) || studyEmissionSource.emissionFactorConsoValue) &&
              (!hasDeprecationPeriod(studyEmissionSource.subPost) || studyEmissionSource.deprecation)
            )

            return {
              studyId: existingStudy.id,
              studySiteId: studySite.id,
              name: studyEmissionSource.name,
              subPost: studyEmissionSource.subPost,
              recycledPart: studyEmissionSource.recycledPart,
              comment: studyEmissionSource.comment,
              validated: studyEmissionSource.validated && canBeValidated,
              value: studyEmissionSource.value,
              reliability: studyEmissionSource.reliability,
              technicalRepresentativeness: studyEmissionSource.technicalRepresentativeness,
              geographicRepresentativeness: studyEmissionSource.geographicRepresentativeness,
              temporalRepresentativeness: studyEmissionSource.temporalRepresentativeness,
              completeness: studyEmissionSource.completeness,
              emissionFactorId: emissionFactorId,
              ...(caracterisation && { caracterisation }),
              ...(studyEmissionSource.deprecation && { depreciationPeriod: studyEmissionSource.deprecation }),
              duration: emissionFactor?.unit === Unit.HA_YEAR ? 20 : null,
              hectare: emissionFactor?.unit === Unit.HA_YEAR ? studyEmissionSource.emissionFactorConsoValue / 20 : null,
            }
          })
          .filter((studyEmissionSource) => studyEmissionSource !== null)
      }),
    ),
  })

  console.log(`Création de ${createdEmissionSource.count} sources d'émissions.`)

  const createdStudyFEVersion = await transaction.studyEmissionFactorVersion.createMany({
    data: Array.from(
      studiesEmissionFactorVersionsMap
        .getMap()
        .entries()
        .flatMap(([studyId, emissionFactorVersionsMap]) => {
          return emissionFactorVersionsMap
            .entries()
            .map(([importedFrom, emissionFactorVersions]) => {
              // on compte le nombre d'utilisations des versions des facteurs d'émissions
              const emissionFactorVersionsCounters = emissionFactorVersions
                .reduce(
                  // je parcours les versions des facteurs d'émissions
                  (emissionFactorVersionsCountersMap, emissionFactorVersion) => {
                    // pour une version de facteur d'émission, je recupère le nombre de fois que la version est déjà utilisée, 0 si pas retrouvée car c'est la première fois
                    const counter = emissionFactorVersionsCountersMap.get(emissionFactorVersion.id)?.counter ?? 0
                    // je stocke cette version de facteur d'émission et j'incrémente son compteur
                    emissionFactorVersionsCountersMap.set(emissionFactorVersion.id, {
                      emissionFactorVersion: emissionFactorVersion,
                      counter: counter + 1,
                    })
                    return emissionFactorVersionsCountersMap
                  },
                  new Map<string, { emissionFactorVersion: { id: string; createdAt: Date }; counter: number }>(),
                )
                .values()
              // on récupère les facteurs d'émissions les plus utilisés (il y en a potentiellement plusieurs utilisés le même nombre de fois)
              const moreFrequentEmissionFactorVersionsIds = emissionFactorVersionsCounters.reduce<{
                counter: number
                emissionFactorVersions: { id: string; createdAt: Date }[]
              }>(
                // je parcours les versions des facteurs d'émissions, et leur nombre d'utilisations
                (moreFrequentEmissionFactorVersionsCounter, emissionFactorVersion) => {
                  if (emissionFactorVersion.counter > moreFrequentEmissionFactorVersionsCounter.counter) {
                    // si j'ai une version de facteur d'émission utilisée plus de fois que celles en mémoire, alors je mets celle-ci en mémoire
                    return {
                      counter: moreFrequentEmissionFactorVersionsCounter.counter,
                      emissionFactorVersions: [emissionFactorVersion.emissionFactorVersion],
                    }
                  } else if (emissionFactorVersion.counter == moreFrequentEmissionFactorVersionsCounter.counter) {
                    // si j'ai une version de facteur d'émission utilisée le même nombre de fois que celles en mémoire, alors je la rajoute à la liste en mémoire.
                    return {
                      counter: emissionFactorVersion.counter,
                      emissionFactorVersions: moreFrequentEmissionFactorVersionsCounter.emissionFactorVersions.concat([
                        emissionFactorVersion.emissionFactorVersion,
                      ]),
                    }
                  } else {
                    // sinon, c'est que ma version de facteur d'émission est moins utilisées, et donc je l'ignore et je garde celles en mémoire
                    return moreFrequentEmissionFactorVersionsCounter
                  }
                },
                { counter: 0, emissionFactorVersions: [] },
              ).emissionFactorVersions // à la fin, je récupère la liste des versions des facteurs d'émissions les plus utilisées
              // et je prends la plus récente
              const emissionFactorVersion = moreFrequentEmissionFactorVersionsIds.sort(
                (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
              )[0]
              const foundImport = Object.values(Import).find((importValue) => importValue === importedFrom)
              if (!foundImport) {
                return null
              }
              return {
                studyId: studyId,
                importVersionId: emissionFactorVersion.id,
                source: foundImport,
              }
            })
            .filter((studyEmissionFactorVersion) => studyEmissionFactorVersion !== null)
        }),
    ),
  })

  console.log(`Création de ${createdStudyFEVersion.count} versions de facteurs d'émissions.`)

  const studyWithoutFEImportVersions = await transaction.study.findMany({
    where: {
      oldBCId: { in: studies.map((study) => study.oldBCId) },
      emissionFactorVersions: {
        none: {},
      },
    },
    select: { id: true },
  })

  for (const study of studyWithoutFEImportVersions) {
    const studyEmissionFactorVersions = []
    for (const source of [Import.BaseEmpreinte, Import.Legifrance, Import.NegaOctet]) {
      const latestImportVersion = await getSourceLatestImportVersionId(source)
      if (latestImportVersion) {
        studyEmissionFactorVersions.push({ studyId: study.id, source, importVersionId: latestImportVersion.id })
      }
    }
    await transaction.studyEmissionFactorVersion.createMany({ data: studyEmissionFactorVersions })
  }

  if (emissionFactorsByImportedIdMap.skippedEmissionFactors.size > 0) {
    console.log(emissionFactorsByImportedIdMap.skippedEmissionFactors)
  }
  if (studyWithoutFEImportVersions.length) {
    console.log(
      studyWithoutFEImportVersions.length,
      "études sans version de facteur d'émission, ajout des versions par défaut.",
      studyWithoutFEImportVersions,
    )
  }

  if (skippedStudiesInfos.length) {
    console.log('skippedStudiesInfos', JSON.stringify(skippedStudiesInfos))
  }
  if (skippedSitesInfos.length) {
    console.log('skippedSitesInfos', JSON.stringify(skippedSitesInfos))
  }
  if (Object.keys(nonExistingFEs).length) {
    console.log('skippedFes', JSON.stringify(nonExistingFEs))
  }
  if (skippedEmissionSource.length) {
    console.log('sous poste en erreur', new Set(skippedEmissionSource.map((e) => e.oldPost)))
    console.log('raisons des sous postes en erreur', new Set(skippedEmissionSource.map((e) => e.reason)))
  }
  if (Object.keys(emissionSourceWithoutFe).length) {
    console.log('emissionSourceWithoutFe', JSON.stringify(emissionSourceWithoutFe))
  }

  return false
}
