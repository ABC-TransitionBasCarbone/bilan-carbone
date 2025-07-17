import axios from 'axios'

const apiUrl = 'https://siva-integ1.cegedim.cloud/apim/api-asso/api/structure'

export const isValidAssociationSiret = async (siret: string) => {
  if (!siret || siret.length !== 14) {
    return false
  }

  const result = await axios.get(`${apiUrl}/${siret}`)

  if (!result?.data?.identite?.id_siret_siege) {
    return false
  }
  if (result.data.identite.id_siret_siege !== parseInt(siret)) {
    return false
  }

  return true
}
