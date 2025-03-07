import { Import, SubPost } from '@prisma/client'
import { getEmissionFactorsFromCSV as getEmissionFactors } from '../getEmissionFactorsFromCSV'
import { ImportEmissionFactor, mapEmissionFactors } from '../import'

const subPostByNetworkType = {
  froid: [SubPost.ReseauxDeFroid],
  chaud: [SubPost.ReseauxDeChaleurEtDeVapeur],
}

const getSubPostsFunc = (emissionFactor: ImportEmissionFactor) => () => {
  if (!emissionFactor.reseau || (emissionFactor.reseau !== 'chaud' && emissionFactor.reseau !== 'froid')) {
    throw new Error(
      `reseau is not provided for emission factor ${emissionFactor.Nom_base_français} - ${emissionFactor["Identifiant_de_l'élément"]}`,
    )
  }
  return subPostByNetworkType[emissionFactor.reseau]
}

const mapLegifranceEmissionFactors = (emissionFactor: ImportEmissionFactor, versionId: string) =>
  mapEmissionFactors(emissionFactor, Import.Legifrance, versionId, getSubPostsFunc(emissionFactor))

export const getEmissionFactorsFromCSV = async (name: string, file: string) =>
  getEmissionFactors(name, file, Import.Legifrance, (emissionFactor: ImportEmissionFactor, versionId: string) =>
    mapLegifranceEmissionFactors(emissionFactor, versionId),
  )
