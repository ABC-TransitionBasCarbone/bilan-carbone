import { Import, SubPost } from '@prisma/client'
import { getEmissionFactorsFromCSV as getEmissionFactors } from '../getEmissionFactorsFromCSV'
import { ImportEmissionFactor, mapEmissionFactors } from '../import'

const mapLegifranceEmissionFactors = (
  emissionFactor: ImportEmissionFactor,
  versionId: string,
  reseau: 'froid' | 'chaud',
) => {
  const typeMatrix = {
    froid: [SubPost.ReseauxDeFroid],
    chaud: [SubPost.ReseauxDeChaleurEtDeVapeur],
  }
  const getSubPostsFunc = () => typeMatrix[reseau]
  return mapEmissionFactors(emissionFactor, Import.Legifrance, versionId, getSubPostsFunc)
}

export const getEmissionFactorsFromCSV = async (name: string, file: string, reseau: 'froid' | 'chaud') =>
  getEmissionFactors(name, file, Import.NegaOctet, (emissionFactor: ImportEmissionFactor, versionId: string) =>
    mapLegifranceEmissionFactors(emissionFactor, versionId, reseau),
  )
