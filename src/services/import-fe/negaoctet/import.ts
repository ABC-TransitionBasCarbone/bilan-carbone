import { Import, SubPost, Unit } from '@prisma/client'
import { unitsMatrix } from '../historyUnits'
import { ImportEmissionFactor, mapEmissionFactors, requiredColums } from '../import'

export type NegaoctetEmissionFactor = ImportEmissionFactor & {
  Unité_espagnol?: string
}

export const negaoctetRequiredColumns = requiredColums.concat(['Unité_espagnol'])

const getUnit = (value?: string): Unit | null => {
  if (!value) {
    return null
  }
  if (!unitsMatrix[value]) {
    throw new Error('Unknown unit : ' + value)
  }
  return unitsMatrix[value]
}

export const mapNegaOctetEmissionFactors = (emissionFactor: NegaoctetEmissionFactor, versionId: string) => {
  const getUnitFunc = (emissionFactor: NegaoctetEmissionFactor) =>
    getUnit(emissionFactor.Unité_français || emissionFactor.Unité_anglais || emissionFactor.Unité_espagnol)
  const getSubPostsFunc = () => [SubPost.UsagesNumeriques]

  return mapEmissionFactors(emissionFactor, Import.NegaOctet, versionId, getUnitFunc, getSubPostsFunc)
}
