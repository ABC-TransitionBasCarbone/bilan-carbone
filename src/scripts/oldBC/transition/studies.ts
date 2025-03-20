import { Prisma } from '@prisma/client'
import { getJsDateFromExcel } from 'excel-date-to-js'

export enum RequiredStudiesColumns {
  id = 'IDETUDE',
  name = 'NOM_ETUDE',
  startDate = 'PERIODE_DEBUT',
  endDate = 'PERIODE_FIN',
  siteId = 'ID_ENTITE',
}

export enum RequiredStudySitesColumns {
  id = 'ID_ENTITE',
  studyId = 'IDETUDE',
}

export enum RequiredStudyExportsColumns {
  studyId = 'IDETUDE',
  type = 'LIB_REFERENTIEL',
  control = 'LIBELLE_MODE_CONTROLE',
}

interface Study {
  id: string
  name: string
  startDate: Date | string
  endDate: Date | string
  sites: Site[]
  exports: Export[]
}

interface Site {
  id: string
}

interface Export {
  type: string
  control: string
}

const parseStudies = (indexes: Record<string, number>, data: (string | number)[][]): Study[] => {
  return data
    .slice(1)
    .filter((row) => row[indexes[RequiredStudiesColumns.name]])
    .map((row) => ({
      id: row[indexes[RequiredStudiesColumns.id]] as string,
      name: row[indexes[RequiredStudiesColumns.name]] as string,
      startDate: row[indexes[RequiredStudiesColumns.startDate]]
        ? new Date(getJsDateFromExcel(row[indexes[RequiredStudiesColumns.startDate]] as number))
        : '',
      endDate: row[indexes[RequiredStudiesColumns.startDate]]
        ? new Date(getJsDateFromExcel(row[indexes[RequiredStudiesColumns.endDate]] as number))
        : '',
      sites: [],
      exports: [],
    }))
}

const parseSites = (indexes: Record<string, number>, data: (string | number)[][]): Map<string, Site[]> => {
  return data
    .slice(1)
    .map<[string, Site]>((row) => [
      row[indexes[RequiredStudySitesColumns.studyId]] as string,
      {
        id: row[indexes[RequiredStudySitesColumns.id]] as string,
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
    }, new Map<string, Site[]>())
}

const parseExports = (indexes: Record<string, number>, data: (string | number)[][]): Map<string, Export[]> => {
  return data
    .slice(1)
    .map<[string, Export]>((row) => [
      row[indexes[RequiredStudyExportsColumns.studyId]] as string,
      {
        type: row[indexes[RequiredStudyExportsColumns.type]] as string,
        control: row[indexes[RequiredStudyExportsColumns.control]] as string,
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
    }, new Map<string, Export[]>())
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
  const studySites = parseSites(studySitesIndexes, studySitesData)
  const studyExports = parseExports(studyExportsIndexes, studyExportsData)

  studySites.entries().forEach(([studyId, sites]) => {
    const study = studies.find((study) => study.id === studyId)
    if (study) {
      study.sites = sites
    } else {
      console.warn(`Study of id ${studyId} not found.`)
    }
  })

  studyExports.entries().forEach(([studyId, exports]) => {
    const study = studies.find((study) => study.id === studyId)
    if (study) {
      study.exports = exports
    } else {
      console.warn(`Study of id ${studyId} not found.`)
    }
  })

  const existingStudyIds = await transaction.study.findMany({
    where: {
      id: { in: studies.map((study) => study.id) },
    },
    select: {
      id: true,
    },
  })

  const newStudies = studies.filter((study) => !existingStudyIds.find((existingStudy) => study.id !== existingStudy.id))

  console.log(newStudies)

  return false
}
