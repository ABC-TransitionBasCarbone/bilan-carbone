import { wasteImpact } from '@/constants/emissions'
import { wasteEmissionFactors } from '@/constants/wasteEmissionFactors'
import { EmissionFactor, Import } from '@prisma/client'

export const getEmissionFactorValue = (
  emissionFactor: Pick<EmissionFactor, 'importedFrom' | 'importedId' | 'totalCo2'>,
) => {
  if (
    emissionFactor.importedFrom === Import.BaseEmpreinte &&
    emissionFactor.importedId &&
    wasteEmissionFactors[emissionFactor.importedId]
  ) {
    return wasteImpact
  }

  return emissionFactor.totalCo2
}

export const emissionFactorDefautQualityStar = '☆'
