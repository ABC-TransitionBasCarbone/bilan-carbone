import { Import, SubPost } from '@prisma/client'
import { getEmissionFactorsFromCSV as getEmissionFactors } from '../getEmissionFactorsFromCSV'
import { ImportEmissionFactor, mapEmissionFactors } from '../import'

const subPostByNetworkType = {
  froid: [SubPost.ReseauxDeFroid],
  chaud: [SubPost.ReseauxDeChaleurEtDeVapeur],
}

const getSubPostsFunc = (networkType: 'froid' | 'chaud') => () => subPostByNetworkType[networkType]

const mapLegifranceEmissionFactors = (
  emissionFactor: ImportEmissionFactor,
  versionId: string,
  networkType: 'froid' | 'chaud',
) => mapEmissionFactors(emissionFactor, Import.Legifrance, versionId, getSubPostsFunc(networkType))

export const getEmissionFactorsFromCSV = async (name: string, file: string, networkType: 'froid' | 'chaud') =>
  getEmissionFactors(name, file, Import.NegaOctet, (emissionFactor: ImportEmissionFactor, versionId: string) =>
    mapLegifranceEmissionFactors(emissionFactor, versionId, networkType),
  )
