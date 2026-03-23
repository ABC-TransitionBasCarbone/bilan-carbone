import { EmissionFactorBase, Import, SubPost } from '@repo/db-common/enums'
import { getEmissionFactorsFromCSV as getEmissionFactors } from '../getEmissionFactorsFromCSV'
import { ImportEmissionFactor, mapEmissionFactors } from '../import'

const source = Import.AIB

const getSubPostsFunc = () => [SubPost.Electricite]

const mapAIBEmissionFactors = (emissionFactor: ImportEmissionFactor, versionId: string) => ({
  ...mapEmissionFactors(emissionFactor, source, versionId, getSubPostsFunc),
  base: EmissionFactorBase.MarketBased,
})

export const getEmissionFactorsFromCSV = async (name: string, file: string) =>
  getEmissionFactors(name, file, source, mapAIBEmissionFactors)
