import axios from 'axios'

const apiUrl = 'https://siva-integ1.cegedim.cloud/apim/api-asso/api/structure'

export const isValidAssociationSiret = async (siret: string) => {
  const trimmedSiret = siret.trim()
  if (!trimmedSiret || trimmedSiret.length !== 14) {
    return false
  }

  const result = await axios.get(`${apiUrl}/${trimmedSiret}`)

  if (!result?.data?.identite?.id_siret_siege) {
    return false
  }

  if (result.data.identite.id_siret_siege !== parseInt(trimmedSiret)) {
    return false
  }

  if (!result?.data?.identite?.lib_forme_juridique?.includes('Association déclarée')) {
    return false
  }

  return true
}
