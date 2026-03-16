import { Import, SubPost } from '@prisma/client'
import { getEmissionFactorsFromCSV as getEmissionFactors } from '../getEmissionFactorsFromCSV'
import { ImportEmissionFactor, mapEmissionFactors } from '../import'

const getSubPostsFunc = () => [SubPost.UsagesNumeriques]

const mapNegaOctetEmissionFactors = (emissionFactor: ImportEmissionFactor, versionId: string) =>
  mapEmissionFactors(emissionFactor, Import.NegaOctet, versionId, getSubPostsFunc)

export const getEmissionFactorsFromCSV = async (name: string, file: string) =>
  getEmissionFactors(name, file, Import.NegaOctet, mapNegaOctetEmissionFactors)
