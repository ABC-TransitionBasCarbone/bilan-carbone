import { Unit } from '@prisma/client'
import { getManualEmissionFactors, setEmissionFactorUnitAsCustom } from '../../db/emissionFactors'
import { ManualEmissionFactorUnitList } from '../../utils/emissionFactors'
import { unitsMatrix } from '../importEmissionFactor/historyUnits'

export const fixUnits = async () => {
  const units = Object.values(Unit).filter((unit) => !ManualEmissionFactorUnitList.includes(unit))
  const emissionFactors = await getManualEmissionFactors(units)
  await Promise.all(
    emissionFactors.map((emissionFactor) => {
      const entry = Object.entries(unitsMatrix).find((entry) => entry[1] === emissionFactor.unit)
      return setEmissionFactorUnitAsCustom(emissionFactor.id, entry ? entry[0] : '')
    }),
  )
  console.log(`Fait : ${emissionFactors.length} facteurs mis à jour`)
}
