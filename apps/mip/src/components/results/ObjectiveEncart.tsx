'use client'
import { useTranslations } from 'next-intl'
import TrajectoryChart from './TrajectoryChart'
import styles from './ObjectiveEncart.module.css'

const TARGET_2030_T = 7
const TARGET_2050_T = 2
const TARGET_YEAR = 2030
const CURRENT_YEAR = new Date().getFullYear()
const YEARS_TO_TARGET = Math.max(1, TARGET_YEAR - CURRENT_YEAR)

function computeYearlyReductionKg(currentTCO2e: number): number {
  const reductionT = currentTCO2e - TARGET_2030_T
  if (reductionT <= 0) return 0
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
    <div className={styles.encart}>
      <div className={styles.header}>
        <span className={styles.targetBadge}>
          {t('nationalTarget', { value: TARGET_2050_T })}
        </span>
        <p className={styles.headerDescription}>{t('nationalTargetDescription')}</p>
      </div>

      <div className={styles.body}>
        <div className={styles.userSection}>
          <p className={styles.youLabel}>{t('you')}</p>
          <p className={styles.footprintValue}>
            {averageFootprintTCO2e.toFixed(1).replace('.', ',')}
            <span className={styles.footprintUnit}> {t('unit')}</span>
          </p>
          {aboveTarget && (
            <p className={styles.contextMessage}>{t('aboveTarget', { target: TARGET_2030_T })}</p>
          )}

          {aboveTarget && yearlyReductionKg > 0 && (
            <div className={styles.paceBox}>
              <p className={styles.paceTitle}>{t('paceTitle', { target: TARGET_2030_T, year: TARGET_YEAR })}</p>
              <p className={styles.paceValue}>
                {yearlyReductionKg.toLocaleString('fr-FR')}
                <span className={styles.paceUnit}> {t('paceUnit')}</span>
              </p>
            </div>
          )}
        </div>

        <div className={styles.chartSection}>
          <TrajectoryChart currentValue={averageFootprintTCO2e} />
        </div>
      </div>
    </div>
  )
}
