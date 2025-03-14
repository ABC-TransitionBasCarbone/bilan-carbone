import { Prisma } from '@prisma/client'

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
}

const parseStudies = (indexes: Record<string, number>, data: (string | number)[][]): Study[] => {
  return data.slice(1).map((row) => ({
    id: row[indexes[RequiredStudiesColumns.id]] as string,
  }))
}

export const uploadStudies = async (
  transaction: Prisma.TransactionClient,
  studiesIndexes: Record<string, number>,
  studiesData: (string | number)[][],
  studySitesIndexes: Record<string, number>,
  studySitesData: (string | number)[][],
  studyExportsIndexes: Record<string, number>,
  studyExportsData: (string | number)[][],
) => {
  console.log('Import des études...')

  const studies = parseStudies(studiesIndexes, studiesData)

  console.log(studies)

  return false
}
