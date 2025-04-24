import { wasteImpact } from '@/constants/emissions'
import { wasteEmissionFactors } from '@/constants/wasteEmissionFactors'
import { EmissionFactor, Import, Unit } from '@prisma/client'

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

export const ManualEmissionFactorUnitList: Unit[] = [
  Unit.PERCENT,
  Unit.GJ_PCI,
  Unit.GJ_PCS,
  Unit.GO,
  Unit.GWH,
  Unit.HA,
  Unit.HA_YEAR,
  Unit.HOUR,
  Unit.DAY,
  Unit.KG,
  Unit.KM,
  Unit.KWH,
  Unit.KWH_PCI,
  Unit.KWH_PCS,
  Unit.LITER,
  Unit.METER,
  Unit.M2,
  Unit.M3,
  Unit.PASSENGER_KM,
  Unit.TEP_PCI,
  Unit.TEP_PCS,
  Unit.TON,
  Unit.UNIT,
  Unit.VEHICLE_KM,
  Unit.EURO,
  Unit.DOLLAR,
  Unit.JPY,
  Unit.CNY,
  Unit.YEAR,
  Unit.CUSTOM,
]
