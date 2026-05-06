import { Import, SubPost } from '@abc-transitionbascarbone/db-common/enums'
import { getEmissionFactorsFromCSV as getEmissionFactors } from '../getEmissionFactorsFromCSV'
import { ImportEmissionFactor, mapEmissionFactors } from '../import'

const getSubPostsFunc = () => [SubPost.UsagesNumeriques]

const mapCUTEmissionFactors = (emissionFactor: ImportEmissionFactor) =>
  mapEmissionFactors(emissionFactor, Import.CUT, getSubPostsFunc)

export const getEmissionFactorsFromCSV = async (name: string, file: string) =>
  getEmissionFactors(name, file, Import.CUT, mapCUTEmissionFactors)
