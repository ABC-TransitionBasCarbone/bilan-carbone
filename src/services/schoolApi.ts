export interface School {
  identifiant_de_l_etablissement: string
  code_postal: string
  adresse_1: string
  nom_etablissement: string
  date_ouverture: string
}

export const getSchoolsFromPostalCode = async (postalCode: string): Promise<School[]> => {
  const trimmedPostalCode = postalCode.trim()
  if (!trimmedPostalCode || trimmedPostalCode.length !== 5) {
    return []
  }

  const res = await fetch(`/api/schools/${trimmedPostalCode}`)
  const data = await res.json()

  return data || []
}
