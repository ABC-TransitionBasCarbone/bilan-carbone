import { EstablishmentType } from '@prisma/client'

export interface School {
  identifiant_de_l_etablissement?: string
  code_postal?: string
  adresse_1?: string
  adresse_3?: string
  city?: string
  nom_etablissement: string
  date_ouverture?: string
  libelle_academie?: string
  libelle_nature?: string
}

export const establishmentTypeMap: Record<string, EstablishmentType> = {
  COLLEGE: EstablishmentType.COLLEGE,
  'LYCEE PROFESSIONNEL': EstablishmentType.LYCEE_PRO,
  'LYCEE ENSEIGNT GENERAL ET TECHNOLOGIQUE': EstablishmentType.LYCEE_GENERAL,
  'LYCEE D ENSEIGNEMENT GENERAL': EstablishmentType.LYCEE_GENERAL,
  'LYCEE D ENSEIGNEMENT TECHNOLOGIQUE': EstablishmentType.LYCEE_GENERAL,
  'LYCEE ENS GENERAL TECHNO PROF AGRICOLE': EstablishmentType.LYCEE_PRO_AGRICOLE,
}

export const getSchoolsFromPostalCodeOrName = async (postalCodeOrName: string): Promise<School[]> => {
  const res = await fetch(`/api/schools/${postalCodeOrName}`)
  const data = await res.json()

  return data || []
}
