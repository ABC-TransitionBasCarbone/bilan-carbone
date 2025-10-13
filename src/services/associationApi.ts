import axios from 'axios'

export const isValidAssociationSiret = async (siret: string) => {
  const trimmedSiret = siret.trim()
  if (!trimmedSiret || trimmedSiret.length !== 14) {
    return false
  }

<<<<<<< HEAD
  const result = await axios.get(`${process.env.ASSOCIATION_SERVICE_URL}/${trimmedSiret}`)
=======
  const result = await axios.get(`${process.env.INSEE_SERVICE_URL}/${trimmedSiret}`)
>>>>>>> c333578655d7a15131797e6879a1c172fae10fc0

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
