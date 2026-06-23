'use client'

import { Box, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import styles from './ObjectiveEncart.module.css'
import TrajectoryChart from './TrajectoryChart'

const TARGET_2030_T = 7
const TARGET_2050_T = 2
const TARGET_YEAR = 2030
const CURRENT_YEAR = new Date().getFullYear()
const YEARS_TO_TARGET = Math.max(1, TARGET_YEAR - CURRENT_YEAR)

const computeYearlyReductionKg = (currentTCO2e: number): number => {
  const reductionT = currentTCO2e - TARGET_2030_T
  if (reductionT <= 0) {
    return 0
  }
  return Math.round((reductionT * 1000) / YEARS_TO_TARGET)
}

interface Props {
  averageFootprintTCO2e: number
}

const ObjectiveEncart = ({ averageFootprintTCO2e }: Props) => {
  const t = useTranslations('results.objective')
  const yearlyReductionKg = computeYearlyReductionKg(averageFootprintTCO2e)
  const aboveTarget = averageFootprintTCO2e > TARGET_2030_T

  return (
    <Box component="section" className={styles.encart}>
      <Box className={styles.header}>
        <Typography className={styles.targetBadge}>{t('nationalTarget', { value: TARGET_2050_T })}</Typography>
        <Typography className={styles.headerDescription}>{t('nationalTargetDescription')}</Typography>
      </Box>

      <Box className={styles.body}>
        <Box className={styles.userSection}>
          <Typography className={styles.youLabel}>{t('you')}</Typography>
          <Typography className={styles.footprintValue}>
            {averageFootprintTCO2e.toFixed(1).replace('.', ',')}
            <Box component="span" className={styles.footprintUnit}>
              {' '}
              {t('unit')}
            </Box>
          </Typography>

          {aboveTarget && (
            <Typography className={styles.contextMessage}>{t('aboveTarget', { target: TARGET_2030_T })}</Typography>
          )}

          {aboveTarget && yearlyReductionKg > 0 && (
            <Box className={styles.paceBox}>
              <Typography className={styles.paceTitle}>
                {t('paceTitle', { target: TARGET_2030_T, year: TARGET_YEAR })}
              </Typography>
              <Typography className={styles.paceValue}>
                {yearlyReductionKg.toLocaleString('fr-FR')}
                <Box component="span" className={styles.paceUnit}>
                  {' '}
                  {t('paceUnit')}
                </Box>
              </Typography>
            </Box>
          )}
        </Box>

        <Box className={styles.chartSection}>
          <TrajectoryChart currentValue={averageFootprintTCO2e} />
        </Box>
      </Box>
    </Box>
  )
}

export default ObjectiveEncart
