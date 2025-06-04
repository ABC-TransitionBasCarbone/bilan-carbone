import { Import, SubPost } from '@prisma/client'
import { getEmissionFactorsFromCSV as getEmissionFactors } from '../getEmissionFactorsFromCSV'
import { ImportEmissionFactor, mapEmissionFactors } from '../import'

const getSubPostsFunc = () => [SubPost.UsagesNumeriques]

const mapCUTEmissionFactors = (emissionFactor: ImportEmissionFactor, versionId: string) =>
  mapEmissionFactors(emissionFactor, Import.CUT, versionId, getSubPostsFunc)

export const getEmissionFactorsFromCSV = async (name: string, file: string) =>
  getEmissionFactors(name, file, Import.CUT, mapCUTEmissionFactors)
