import { Import, SubPost } from '@abc-transitionbascarbone/db-common/enums'
import { getEmissionFactorsFromCSV as getEmissionFactors } from '../getEmissionFactorsFromCSV'
import { ImportEmissionFactor, mapEmissionFactors } from '../import'

const getSubPostsFunc = () => [SubPost.UsagesNumeriques]

const mapNegaOctetEmissionFactors = (emissionFactor: ImportEmissionFactor) =>
  mapEmissionFactors(emissionFactor, Import.NegaOctet, getSubPostsFunc)

export const getEmissionFactorsFromCSV = async (name: string, file: string) =>
  getEmissionFactors(name, file, Import.NegaOctet, mapNegaOctetEmissionFactors)
