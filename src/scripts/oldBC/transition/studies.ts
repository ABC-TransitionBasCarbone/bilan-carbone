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
  sites: StudySite[]
  exports: Export[]
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
      sites: [],
      exports: [],
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

const parseExports = (indexes: Record<string, number>, data: (string | number)[][]): Map<string, Export[]> => {
  return data
    .slice(1)
    .map<[string, Export]>((row) => [
      row[indexes[RequiredStudyExportsColumns.studyOldBCId]] as string,
      {
        type: StudyExport.GHGP,
        control: ControlMode.CapitalShare,
      },
    ])
    .reduce((accumulator, currentValue) => {
      const exports = accumulator.get(currentValue[0])
      if (exports) {
        exports.push(currentValue[1])
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
  const studySites = parseStudySites(studySitesIndexes, studySitesData)
  const studyExports = parseExports(studyExportsIndexes, studyExportsData)

  studySites.entries().forEach(([studyId, sites]) => {
    const study = studies.find((study) => study.oldBCId === studyId)
    if (study) {
      study.sites = sites
    } else {
      console.warn(`Study of id ${studyId} not found.`)
    }
  })

  studyExports.entries().forEach(([studyId, exports]) => {
    const study = studies.find((study) => study.oldBCId === studyId)
    if (study) {
      study.exports = exports
    } else {
      console.warn(`Study of id ${studyId} not found.`)
    }
  })

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
      sites: undefined,
      exports: undefined,
      createdById: userId,
      isPublic: false,
      level: Level.Initial,
      organizationId: organizationId,
    })),
  })

  await transaction.studySite.createMany({
    data: newStudies.slice(0, 1).flatMap((study) =>
      study.sites.slice(0, 1).map((site) => ({
        studyId: study.oldBCId,
        siteId: site.siteOldBCId,
        etp: 1,
        ca: 1,
      })),
    ),
  })

  await transaction.studyExport.createMany({
    data: newStudies.slice(0, 1).flatMap((study) =>
      study.exports.slice(0, 1).map((site) => ({
        ...site,
        studyId: study.oldBCId,
      })),
    ),
  })

  return false
}
