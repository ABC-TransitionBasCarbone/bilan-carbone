import { ControlMode, Level, Prisma, Export as StudyExport, SubPost } from '@prisma/client'
import { getJsDateFromExcel } from 'excel-date-to-js'
import { getExistingObjectsIds, getExistingSitesIds } from './repositories'

export enum RequiredStudiesColumns {
  oldBCId = 'IDETUDE',
  name = 'NOM_ETUDE',
  startDate = 'PERIODE_DEBUT',
  endDate = 'PERIODE_FIN',
  siteId = 'ID_ENTITE',
}

export enum RequiredStudySitesColumns {
  siteOldBCId = 'ID_ENTITE',
  studyOldBCId = 'IDETUDE',
}

export enum RequiredStudyExportsColumns {
  studyOldBCId = 'IDETUDE',
  type = 'LIB_REFERENTIEL',
  control = 'LIBELLE_MODE_CONTROLE',
}

export enum RequiredStudyEmissionSourcesColumns {
  studyOldBCId = 'ID_ETUDE',
  siteOldBCId = 'ID_ENTITE',
}

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
}

const parseStudies = (indexes: Record<string, number>, data: (string | number)[][]): Study[] => {
  return data
    .slice(1)
    .filter((row) => row[indexes[RequiredStudiesColumns.name]])
    .map((row) => ({
      oldBCId: row[indexes[RequiredStudiesColumns.oldBCId]] as string,
      name: row[indexes[RequiredStudiesColumns.name]] as string,
      startDate: row[indexes[RequiredStudiesColumns.startDate]]
        ? new Date(getJsDateFromExcel(row[indexes[RequiredStudiesColumns.startDate]] as number))
        : '',
      endDate: row[indexes[RequiredStudiesColumns.startDate]]
        ? new Date(getJsDateFromExcel(row[indexes[RequiredStudiesColumns.endDate]] as number))
        : '',
    }))
}

const parseStudySites = (indexes: Record<string, number>, data: (string | number)[][]): Map<string, StudySite[]> => {
  return data
    .slice(1)
    .map<[string, StudySite]>((row) => [
      row[indexes[RequiredStudySitesColumns.studyOldBCId]] as string,
      {
        siteOldBCId: row[indexes[RequiredStudySitesColumns.siteOldBCId]] as string,
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

const parseExports = (indexes: Record<string, number>, data: (string | number)[][]): Map<string, Export[]> => {
  return data
    .slice(1)
    .map<[string, Export | null]>((row) => {
      const type = getType(row[indexes[RequiredStudyExportsColumns.type]] as string)
      const control = getControl(row[indexes[RequiredStudyExportsColumns.control]] as string)
      if (!type) {
        console.warn(`Type ${type} invalide`)
        return [row[indexes[RequiredStudyExportsColumns.studyOldBCId]] as string, null]
      }
      if (!control) {
        console.warn(`Control ${control} invalide`)
        return [row[indexes[RequiredStudyExportsColumns.studyOldBCId]] as string, null]
      }
      return [
        row[indexes[RequiredStudyExportsColumns.studyOldBCId]] as string,
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

const parseEmissionSources = (
  indexes: Record<string, number>,
  data: (string | number)[][],
): Map<string, EmissionSource[]> => {
  return data
    .slice(1)
    .map<[string, EmissionSource]>((row) => [
      row[indexes[RequiredStudyEmissionSourcesColumns.studyOldBCId]] as string,
      {
        siteOldBCId: row[indexes[RequiredStudyEmissionSourcesColumns.siteOldBCId]] as string,
      },
    ])
    .reduce((accumulator, currentValue) => {
      const EmissionSources = accumulator.get(currentValue[0])
      if (EmissionSources) {
        EmissionSources.push(currentValue[1])
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
  return existingStudySites.reduce((accumulator, currentExistingStudySite) => {
    const studySite = {
      id: currentExistingStudySite.id,
      siteId: currentExistingStudySite.siteId,
    }
    const studySites = accumulator.get(studyId)
    if (studySites) {
      studySites.push(studySite)
    } else {
      accumulator.set(currentExistingStudySite.studyId, [studySite])
    }
    return accumulator
  }, new Map<string, [{ id: string; siteId: string }]>())
}

export const uploadStudies = async (
  transaction: Prisma.TransactionClient,
  userId: string,
  organizationId: string,
  studiesIndexes: Record<string, number>,
  studiesData: (string | number)[][],
  studySitesIndexes: Record<string, number>,
  studySitesData: (string | number)[][],
  studyExportsIndexes: Record<string, number>,
  studyExportsData: (string | number)[][],
  studyEmissionSourceIndexes: Record<string, number>,
  studyEmissionSourceData: (string | number)[][],
) => {
  console.log('Import des études...')

  const studies = parseStudies(studiesIndexes, studiesData)
  const studySites = parseStudySites(studySitesIndexes, studySitesData)
  const studyExports = parseExports(studyExportsIndexes, studyExportsData)
  const studyEmissionSources = parseEmissionSources(studyEmissionSourceIndexes, studyEmissionSourceData)

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
  const sitesIds = Array.from(
    studySites.values().flatMap((studySites) => studySites.map((studySite) => studySite.siteOldBCId)),
  )
  const existingSiteIds = await getExistingSitesIds(transaction, sitesIds)

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

  const existingStudySites = await getExistingStudySites(transaction, Array.from(studyEmissionSources.keys()))

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
        console.log(studyEmissionSources)
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
              studySiteId: studySite.siteId,
              name: 'toto',
              subPost: SubPost.CombustiblesFossiles,
            }
          })
          .filter((studyEmissionSource) => studyEmissionSource !== null)
      }),
    ),
  })

  return false
}
