import axios from 'axios'

export const isValidAssociationSiret = async (siret: string) => {
  const trimmedSiret = siret.trim()
  if (!trimmedSiret || trimmedSiret.length !== 14) {
    return false
  }

  const result = await axios.get(`${process.env.INSEE_SERVICE_URL}/${trimmedSiret}`)

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

export const getCompanyName = async (siret: string) => {
  const trimmedSiret = siret.trim()
  if (!trimmedSiret || trimmedSiret.length !== 14) {
    return null
  }

  const result = await axios.get(`${process.env.INSEE_SERVICE_URL}/${trimmedSiret}`, {
    headers: {
      'X-INSEE-Api-Key-Integration': process.env.INSEE_API_SECRET,
    },
  })

  return result.data.etablissement?.uniteLegale?.denominationUniteLegale as string
}
