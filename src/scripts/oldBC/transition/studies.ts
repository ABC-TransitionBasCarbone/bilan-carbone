import { Prisma } from '@prisma/client'

export enum RequiredStudiesColumns {
  id = 'IDETUDE',
  name = 'NOM_ETUDE',
  startDate = 'PERIODE_DEBUT',
  endDate = 'PERIODE_FIN',
  siteId = 'ID_ENTITE',
  exportType = 'LIB_REFERENTIEL',
  exportControl = 'LIBELLE_MODE_CONTROLE',
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
  data: (string | number)[][],
  indexes: Record<string, number>,
) => {
  console.log('Import des études...')

  const studies = parseStudies(indexes, data)

  console.log(studies)

  return false
}
