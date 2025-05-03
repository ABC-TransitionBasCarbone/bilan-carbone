import { ControlMode, Level, Prisma, Export as StudyExport, SubPost } from '@prisma/client'
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
  getExistingObjectsIds,
  getExistingSitesIds,
} from './repositories'

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
  value: number
  subPost: SubPost
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
      return [
        row.studyOldBCId as string,
        {
          siteOldBCId: row.siteOldBCId as string,
          name: name,
          recycledPart: row.recycledPart as number,
          comment: `${row.commentaires as string} ${row.commentairesCollecte as string}`,
          validated: (row.validationDASaisie as number) === 1,
          value: row.daTotalValue as number,
          subPost: subPost,
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
}

const getExistingStudiesIds = async (transaction: Prisma.TransactionClient, studiesIds: string[]) => {
  return getExistingObjectsIds(transaction.study, studiesIds)
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
  userId: string,
  organizationId: string,
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
      createdById: userId,
      isPublic: false,
      level: Level.Initial,
      organizationId: organizationId,
    })),
  })

  const existingStudiesIds = await getExistingStudiesIds(transaction, Array.from(studySites.keys()))
  const sitesOldBCIds = Array.from(
    studySites.values().flatMap((studySites) => studySites.map((studySite) => studySite.siteOldBCId)),
  )
  const existingSiteIds = await getExistingSitesIds(transaction, sitesOldBCIds)

  await transaction.studySite.createMany({
    data: Array.from(
      studySites.entries().flatMap(([studyOldBCId, studySites]) => {
        // N'importer que les studySites d'études nouvelles.
        if (!newStudies.some((newStudy) => newStudy.oldBCId === studyOldBCId)) {
          return []
        }
        const existingStudyId = existingStudiesIds.get(studyOldBCId)
        if (!existingStudyId) {
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
            return {
              studyId: existingStudyId,
              siteId: existingSiteId,
              etp: 1,
              ca: 1,
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
        const existingStudyId = existingStudiesIds.get(studyOldBCId)
        if (!existingStudyId) {
          console.warn(`Impossible de retrouver l'étude de oldBCId: ${studyOldBCId}`)
          return []
        }
        return studyExports
          .map((studyExport) => ({
            ...studyExport,
            studyId: existingStudyId,
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
        .map((studyOldBCId) => existingStudiesIds.get(studyOldBCId))
        .filter((studyId) => studyId !== undefined),
    ),
  )

  await transaction.studyEmissionSource.createMany({
    data: Array.from(
      studyEmissionSources.entries().flatMap(([studyOldBCId, studyEmissionSources]) => {
        // N'importer que les sources d'émission d'études nouvelles.
        if (!newStudies.some((newStudy) => newStudy.oldBCId === studyOldBCId)) {
          return []
        }
        const existingStudyId = existingStudiesIds.get(studyOldBCId)
        if (!existingStudyId) {
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
            const studySites = existingStudySites.get(existingStudyId)
            if (!studySites) {
              console.warn(`Impossible de retrouver les studySites de studyId: ${existingStudyId}`)
              return null
            }
            const studySite = studySites.find((studySite) => studySite.siteId === existingSiteId)
            if (!studySite) {
              console.warn(`Impossible de retrouver le studySite d'id: ${existingSiteId}`)
              return null
            }
            return {
              studyId: existingStudyId,
              studySiteId: studySite.id,
              name: studyEmissionSource.name,
              subPost: studyEmissionSource.subPost,
              recycledPart: studyEmissionSource.recycledPart,
              comment: studyEmissionSource.comment,
              validated: studyEmissionSource.validated,
              value: studyEmissionSource.value,
            }
          })
          .filter((studyEmissionSource) => studyEmissionSource !== null)
      }),
    ),
  })

  return false
}
