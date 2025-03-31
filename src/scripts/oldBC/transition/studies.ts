import { ControlMode, Level, Prisma, Export as StudyExport } from '@prisma/client'
import { getJsDateFromExcel } from 'excel-date-to-js'

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
        sites.push(currentValue[1])
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

interface Delegate {
  findMany(args?: object): Promise<{ id: string; oldBCId: string | null }[]>
}

async function getExistingObjectsIds(delegate: Delegate, ids: string[]) {
  const existingObjects = await delegate.findMany({
    where: {
      oldBCId: {
        in: ids,
      },
    },
    select: { id: true, oldBCId: true },
  })

  return existingObjects.reduce((map, currentExistingObject) => {
    if (currentExistingObject.oldBCId) {
      map.set(currentExistingObject.oldBCId, currentExistingObject.id)
    }
    return map
  }, new Map<string, string>())
}

const getExistingStudiesIds = async (transaction: Prisma.TransactionClient, studiesIds: string[]) => {
  return getExistingObjectsIds(transaction.study, studiesIds)
}

const getExistingSitesIds = async (transaction: Prisma.TransactionClient, sitesIds: string[]) => {
  return getExistingObjectsIds(transaction.site, sitesIds)
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
) => {
  console.log('Import des études...')

  const studies = parseStudies(studiesIndexes, studiesData)
  const studySites = parseStudySites(studySitesIndexes, studySitesData)
  const studyExports = parseExports(studyExportsIndexes, studyExportsData)

  const existingStudyIds = await transaction.study.findMany({
    where: {
      oldBCId: { in: studies.map((study) => study.oldBCId) },
    },
    select: {
      id: true,
      oldBCId: true,
    },
  })

  const newStudies = studies.filter(
    (study) => !existingStudyIds.find((existingStudy) => study.oldBCId !== existingStudy.oldBCId),
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

  return false
}
