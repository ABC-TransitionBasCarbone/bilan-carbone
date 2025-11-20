import axios from 'axios'

export const isValidAssociationSiret = async (siret: string) => {
  const trimmedSiret = siret.trim()
  if (!trimmedSiret || trimmedSiret.length !== 14) {
    return false
  }

  try {
    const result = await axios.get(`${process.env.INSEE_SERVICE_URL}/${trimmedSiret}`, {
      headers: {
        'X-INSEE-Api-Key-Integration': process.env.INSEE_API_SECRET,
      },
    })

    const etablissement = result?.data?.etablissement
    if (!etablissement) {
      return false
    }

    // Vérifier que le SIRET correspond bien à l'établissement
    if (etablissement.siret !== trimmedSiret) {
      return false
    }

    // Codes juridiques des associations :
    // 9210 : Association non déclarée
    // 9220 : Association déclarée
    // 9221 : Association déclarée d'insertion par l'économique
    // 9222 : Association intermédiaire
    // 9223 : Groupement d'employeurs
    // 9224 : Association d'avocats à responsabilité professionnelle individuelle
    // 9230 : Association déclarée, reconnue d'utilité publique
    // 9240 : Congrégation
    // 9260 : Association de droit local (Bas-Rhin, Haut-Rhin et Moselle)
    const associationCategories = ['9210', '9220', '9221', '9222', '9223', '9224', '9230', '9240', '9260']
    const categorieJuridique = etablissement.uniteLegale?.categorieJuridiqueUniteLegale
    const isAssociation = associationCategories.includes(categorieJuridique)

    return isAssociation
  } catch (error) {
    console.error('Error validating association SIRET:', error)
    return false
  }
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
