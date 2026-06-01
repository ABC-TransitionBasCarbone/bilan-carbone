import { EmissionFactorBase, Import, SubPost } from '@abc-transitionbascarbone/db-common/enums'
import { getEmissionFactorsFromCSV as getEmissionFactors } from '../getEmissionFactorsFromCSV'
import { ImportEmissionFactor, mapEmissionFactors } from '../import'

const source = Import.AIB

const getSubPostsFunc = () => [SubPost.Electricite]

const mapAIBEmissionFactors = (emissionFactor: ImportEmissionFactor) => ({
  ...mapEmissionFactors(emissionFactor, source, getSubPostsFunc),
  base: EmissionFactorBase.MarketBased,
})

export const getEmissionFactorsFromCSV = async (name: string, file: string) =>
  getEmissionFactors(name, file, source, mapAIBEmissionFactors)
