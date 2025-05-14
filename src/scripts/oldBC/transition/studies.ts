import { getEmissionQuality } from '@/services/importEmissionFactor/import'
import { ControlMode, EmissionFactor, Level, Prisma, Export as StudyExport, SubPost } from '@prisma/client'
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
  getExistingEmissionFactorsNames as getExistingEmissionFactorsNamesFromRepository,
  getExistingSitesIds,
} from './repositories'
import { SitesCAsMapper, SitesETPsMapper } from './sitesETPsAndCAs'

interface Study {
  oldBCId: string
  name: string
  startDate: Date | string
  endDate: Date | string
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
  emissionSourceImportedId: string
  CO2f: number
}

const parseStudies = (studiesWorksheet: StudiesWorkSheet): Study[] => {
  return studiesWorksheet
    .getRows()
    .filter((row) => row.name)
    .map((row) => ({
      oldBCId: row.oldBCId as string,
      name: row.name as string,
      startDate: row.startDate ? new Date(getJsDateFromExcel(row.startDate as number)) : '',
      endDate: row.endDate ? new Date(getJsDateFromExcel(row.endDate as number)) : '',
    }))
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
  if (type.startsWith('BEGES-r')) {
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
    .replace(/[\s,]/g, '')
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
    .map((row) => row.emissionFactorOldBCId as string)

  return await getExistingEmissionFactorsNamesFromRepository(transaction, emissionFactorsOldBCIds)
}

const buildEmissionSourceName = (
  row: EmissionSourceRow,
  emissionFactorsNames: Map<string, { name: string; id: string }>,
  newPostAndSubPost: NewPostAndSubPosts,
) => {
  let name = row.descriptifData as string
  if (!name) {
    const emissionFactorName = emissionFactorsNames.get(row.emissionFactorOldBCId as string)
    if (emissionFactorName) {
      name = emissionFactorName.name
    }
  }
  return !name ? `${newPostAndSubPost.newPost} - ${newPostAndSubPost.newSubPost}` : name
}

const parseEmissionSources = (
  postAndSubPostsOldNewMapping: OldNewPostAndSubPostsMapping,
  studyEmissionSourcesWorkSheet: EmissionSourcesWorkSheet,
  emissionFactorsNames: Map<string, { name: string; id: string }>,
): Map<string, EmissionSource[]> => {
  return studyEmissionSourcesWorkSheet
    .getRows()
    .slice(1)
    .filter((row) => row.studyOldBCId !== '00000000-0000-0000-0000-000000000000')
    .map<[string, EmissionSource] | null>((row) => {
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
      } catch (e) {
        console.warn(e)
        return null
      }
      const incertitudeDA = getEmissionQuality((row.incertitudeDA as number) * 100)
      return [
        row.studyOldBCId as string,
        {
          siteOldBCId: row.siteOldBCId as string,
          name: name,
          recycledPart: row.recycledPart as number,
          comment: `${row.commentaires as string} ${row.commentairesCollecte as string}`,
          validated: (row.validationDASaisie as number) === 1,
          emissionFactorOldBCId: row.emissionFactorOldBCId as string,
          value: row.daTotalValue as number,
          subPost: subPost,
          reliability: incertitudeDA,
          technicalRepresentativeness: incertitudeDA,
          geographicRepresentativeness: incertitudeDA,
          temporalRepresentativeness: incertitudeDA,
          completeness: incertitudeDA,
          emissionSourceImportedId: String(row.emissionSourceImportedId),
        },
          CO2f: row.CO2f as number,
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
}

const getExistingStudies = async (transaction: Prisma.TransactionClient, studiesIds: string[]) => {
  const existingObjects = await transaction.study.findMany({
    where: {
      oldBCId: {
        in: studiesIds,
      },
    },
    select: { id: true, oldBCId: true, startDate: true, endDate: true },
  })

  return existingObjects.reduce((map, currentExistingObject) => {
    if (currentExistingObject.oldBCId) {
      map.set(currentExistingObject.oldBCId, {
        id: currentExistingObject.id,
        startDate: currentExistingObject.startDate,
        endDate: currentExistingObject.endDate,
      })
    }
    return map
  }, new Map<string, { id: string; startDate: Date; endDate: Date }>())
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

export const uploadStudies = async (
  transaction: Prisma.TransactionClient,
  accountId: string,
  organizationVersionId: string,
  postAndSubPostsOldNewMapping: OldNewPostAndSubPostsMapping,
  oldBCWorksheetReader: OldBCWorkSheetsReader,
) => {
  console.log('Import des études...')

  const studies = parseStudies(oldBCWorksheetReader.studiesWorksheet)
  const studySites = parseStudySites(oldBCWorksheetReader.studySitesWorksheet)
  const studyExports = parseStudyExports(oldBCWorksheetReader.studyExportsWorksheet)
  const existingEmissionFactorNames = await getExistingEmissionFactorsNames(
    oldBCWorksheetReader.emissionSourcesWorksheet,
    transaction,
  )
  const studyEmissionSources = parseEmissionSources(
    postAndSubPostsOldNewMapping,
    oldBCWorksheetReader.emissionSourcesWorksheet,
    existingEmissionFactorNames,
  )

  const alreadyImportedStudyIds = await transaction.study.findMany({
    where: {
      oldBCId: { in: studies.map((study) => study.oldBCId) },
    },
    select: {
      id: true,
      oldBCId: true,
    },
  })

  const newStudies = studies.filter((study) =>
    alreadyImportedStudyIds.every((alreadyImportedStudy) => alreadyImportedStudy.oldBCId !== study.oldBCId),
  )

  await transaction.study.createMany({
    data: newStudies.map((study) => ({
      ...study,
      createdById: accountId,
      isPublic: false,
      level: Level.Initial,
      organizationVersionId: organizationVersionId,
    })),
  })

  const existingStudies = await getExistingStudies(transaction, Array.from(studySites.keys()))
  const sitesOldBCIds = Array.from(
    studySites.values().flatMap((studySites) => studySites.map((studySite) => studySite.siteOldBCId)),
  )
  const existingSiteIds = await getExistingSitesIds(transaction, sitesOldBCIds)

  const sitesETPsMapper = new SitesETPsMapper(oldBCWorksheetReader.sitesETPsWorksheet)
  const sitesCAsMapper = new SitesCAsMapper(oldBCWorksheetReader.sitesCAsWorksheet)
  await transaction.studySite.createMany({
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
            const existingSiteId = existingSiteIds.get(studySite.siteOldBCId)
            if (!existingSiteId) {
              console.warn(`Impossible de retrouver le site de oldBCId: ${studySite.siteOldBCId}`)
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

  await transaction.studyExport.createMany({
    data: Array.from(
      studyExports.entries().flatMap(([studyOldBCId, studyExports]) => {
        // N'importer que les exports d'études nouvelles.
        if (!newStudies.some((newStudy) => newStudy.oldBCId === studyOldBCId)) {
          return []
        }
        const existingStudy = existingStudies.get(studyOldBCId)
        if (!existingStudy) {
          console.warn(`Impossible de retrouver l'étude de oldBCId: ${studyOldBCId}`)
          return []
        }
        return studyExports
          .map((studyExport) => ({
            ...studyExport,
            studyId: existingStudy.id,
          }))
          .filter((studyExport) => studyExport !== null)
      }),
    ),
  })

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

  const emissionSourceImportedIds = Array.from(
    studyEmissionSources
      .values()
      .flatMap((studyEmissionSources) =>
        studyEmissionSources.map((studyEmissionSource) => studyEmissionSource.emissionSourceImportedId),
      ),
  )
  const emissionFactorOldBCIds = Array.from(
    studyEmissionSources
      .values()
      .flatMap((studyEmissionSources) =>
        studyEmissionSources.map((studyEmissionSource) => studyEmissionSource.emissionFactorOldBCId),
      ),
  )
  const emissionFactors = await transaction.emissionFactor.findMany({
    where: { OR: [{ importedId: { in: emissionSourceImportedIds } }, { oldBCId: { in: emissionFactorOldBCIds } }] },
    include: {
      version: true,
      importedId: { in: emissionSourceImportedIds },
    },
  })
  const emissionFactorsMap = emissionFactors.reduce(
    (emissionFactorsMap, emissionFactor) => {
      if (emissionFactor.importedId) {
        const emissionFactors = emissionFactorsMap.get(emissionFactor.importedId)
        const emissionFactorItem = {
          id: emissionFactor.id,
          version: emissionFactor.version
            ? {
                id: emissionFactor.version.id,
                source: emissionFactor.version.source,
                createdAt: emissionFactor.version.createdAt,
              }
            : null,
          importedId: emissionFactor.importedId,
          co2f: emissionFactor.co2f,
        }
        if (emissionFactors) {
          emissionFactors.push(emissionFactorItem)
        } else {
          emissionFactorsMap.set(emissionFactor.importedId, [emissionFactorItem])
        }
      }
      return emissionFactorsMap
    },
    new Map<
      string,
      {
        id: string
        version: { id: string; source: string; createdAt: Date } | null
        importedId: string
        co2f: number | null
      }[]
    >(),
  )

  const studiesEmissionFactorVersionsMap = new Map<string, Map<string, { id: string; createdAt: Date }[]>>()
  await transaction.studyEmissionSource.createMany({
    data: Array.from(
      studyEmissionSources.entries().flatMap(([studyOldBCId, studyEmissionSources]) => {
        // N'importer que les sources d'émission d'études nouvelles.
        if (!newStudies.some((newStudy) => newStudy.oldBCId === studyOldBCId)) {
          return []
        }
        const existingStudy = existingStudies.get(studyOldBCId)
        if (!existingStudy) {
          console.warn(`Impossible de retrouver l'étude de oldBCId: ${studyOldBCId}`)
          return []
        }
        return studyEmissionSources
          .map((studyEmissionSource) => {
            const existingSiteId = existingSiteIds.get(studyEmissionSource.siteOldBCId)
            if (!existingSiteId) {
              console.warn(`Impossible de retrouver le site de oldBCId: ${studyEmissionSource.siteOldBCId}`)
              return null
            }
            const studySites = existingStudySites.get(existingStudy.id)
            if (!studySites) {
              console.warn(`Impossible de retrouver les studySites de studyId: ${existingStudy.id}`)
              return null
            }
            const studySite = studySites.find((studySite) => studySite.siteId === existingSiteId)
            if (!studySite) {
              console.warn(`Impossible de retrouver le studySite d'id: ${existingSiteId}`)
              return null
            }
            let emissionFactor: {
              id: string
              version: { id: string; source: string; createdAt: Date } | null
              importedId: string
              co2f: number | null
            } | null = null
            let emissionFactorId: string | null = null
            if (studyEmissionSource.emissionSourceImportedId !== '0') {
              const emissionFactorList = emissionFactorsMap.get(studyEmissionSource.emissionSourceImportedId)
              if (emissionFactorList) {
                if (emissionFactorList.length === 1) {
                  emissionFactor = emissionFactorList[0]
                } else if (emissionFactorList.length > 1) {
                  const sortedByVersionNameEmissionFactors = emissionFactorList.sort((a, b) =>
                    a.version && b.version ? b.version.createdAt.getTime() - a.version.createdAt.getTime() : 1,
                  )
                  const filteredByCO2fEmissionFactors = sortedByVersionNameEmissionFactors.filter(
                    (emissionFactor) => emissionFactor.co2f === studyEmissionSource.CO2f,
                  )
                  if (filteredByCO2fEmissionFactors.length > 0) {
                    emissionFactor = filteredByCO2fEmissionFactors[0]
                  } else {
                    emissionFactor = sortedByVersionNameEmissionFactors[0]
                  }
                }
              }
              if (emissionFactor) {
                if (emissionFactor.version) {
                  const emissionFactorVersionsMap =
                    studiesEmissionFactorVersionsMap.get(existingStudy.id) ??
                    new Map<string, { id: string; createdAt: Date }[]>()
                  const emissionFactorItem = {
                    id: emissionFactor.version.id,
                    createdAt: emissionFactor.version.createdAt,
                  }
                  const emissionFactorVersions = emissionFactorVersionsMap.get(emissionFactor.version.source) ?? []
                  emissionFactorVersionsMap.set(
                    emissionFactor.version.source,
                    emissionFactorVersions.concat(emissionFactorItem),
                  )
                  studiesEmissionFactorVersionsMap.set(existingStudy.id, emissionFactorVersionsMap)
                }
              }
            } else {
              const existingEmissionFactor = existingEmissionFactorNames.get(studyEmissionSource.emissionFactorOldBCId)
              if (existingEmissionFactor) {
                emissionFactorId = existingEmissionFactor.id
              }
            }
            return {
              studyId: existingStudy.id,
              studySiteId: studySite.id,
              name: studyEmissionSource.name,
              subPost: studyEmissionSource.subPost,
              recycledPart: studyEmissionSource.recycledPart,
              comment: studyEmissionSource.comment,
              validated: studyEmissionSource.validated,
              value: studyEmissionSource.value,
              reliability: studyEmissionSource.reliability,
              technicalRepresentativeness: studyEmissionSource.technicalRepresentativeness,
              geographicRepresentativeness: studyEmissionSource.geographicRepresentativeness,
              temporalRepresentativeness: studyEmissionSource.temporalRepresentativeness,
              completeness: studyEmissionSource.completeness,
              emissionFactorId: emissionFactor ? emissionFactor.id : emissionFactorId,
            }
          })
          .filter((studyEmissionSource) => studyEmissionSource !== null)
      }),
    ),
  })

  await transaction.studyEmissionFactorVersion.createMany({
    data: Array.from(
      studiesEmissionFactorVersionsMap.entries().flatMap(([studyId, emissionFactorVersionsMap]) => {
        return emissionFactorVersionsMap
          .entries()
          .map(([importedFrom, emissionFactorVersions]) => {
            const emissionFactorVersion = emissionFactorVersions.sort(
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
          .filter((studyEmissionFactor) => studyEmissionFactor !== null)
      }),
    ),
  })

  return false
}
