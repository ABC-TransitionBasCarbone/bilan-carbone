export interface School {
  identifiant_de_l_etablissement: string
  code_postal: string
  adresse_1: string
  nom_etablissement: string
  date_ouverture: string
}

export const getSchoolsFromPostalCodeOrName = async (postalCodeOrName: string): Promise<School[]> => {
  const res = await fetch(`/api/schools/${postalCodeOrName}`)
  const data = await res.json()

  return data || []
}
