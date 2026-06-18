'use client'

import { ObjectiveEncart as UiObjectiveEncart } from '@abc-transitionbascarbone/ui'
import { useTranslations } from 'next-intl'
import TrajectoryChart from './TrajectoryChart'

const TARGET_2030_T = 7
const TARGET_2050_T = 2
const TARGET_YEAR = 2030
const CURRENT_YEAR = new Date().getFullYear()
const YEARS_TO_TARGET = Math.max(1, TARGET_YEAR - CURRENT_YEAR)

function computeYearlyReductionKg(currentTCO2e: number): number {
  const reductionT = currentTCO2e - TARGET_2030_T
  if (reductionT <= 0) {
    return 0
  }
  return Math.round((reductionT * 1000) / YEARS_TO_TARGET)
}

interface Props {
  averageFootprintTCO2e: number
}

export default function ObjectiveEncart({ averageFootprintTCO2e }: Props) {
  const t = useTranslations('results.objective')
  const yearlyReductionKg = computeYearlyReductionKg(averageFootprintTCO2e)
  const aboveTarget = averageFootprintTCO2e > TARGET_2030_T

  return (
    <UiObjectiveEncart
      nationalTarget={t('nationalTarget', { value: TARGET_2050_T })}
      nationalTargetDescription={t('nationalTargetDescription')}
      youLabel={t('you')}
      footprintValue={averageFootprintTCO2e.toFixed(1).replace('.', ',')}
      unit={t('unit')}
      aboveTargetMessage={aboveTarget ? t('aboveTarget', { target: TARGET_2030_T }) : undefined}
      paceTitle={
        aboveTarget && yearlyReductionKg > 0 ? t('paceTitle', { target: TARGET_2030_T, year: TARGET_YEAR }) : undefined
      }
      paceValue={aboveTarget && yearlyReductionKg > 0 ? yearlyReductionKg.toLocaleString('fr-FR') : undefined}
      paceUnit={aboveTarget && yearlyReductionKg > 0 ? t('paceUnit') : undefined}
      chart={<TrajectoryChart currentValue={averageFootprintTCO2e} />}
    />
  )
}
