'use client'

import TrajectoryChart from '@/components/results/TrajectoryChart'
import { STUDY_UNIT_VALUES } from '@abc-transitionbascarbone/utils/charts'
import { formatNumber } from '@abc-transitionbascarbone/utils/number'
import {
  calculateSimpleLinearTrajectory,
  getSnbcDefaultReductionRates,
  ReductionRates,
} from '@abc-transitionbascarbone/utils/trajectory'
import { Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import styles from '../SurveyCompletion.module.css'

interface Props {
  totalKg: number
  /** Optional company-provided yearly reduction rates. Defaults to SNBC-inspired rates (~88% by 2050). */
  reductionRates?: ReductionRates
}

const TransitionEncart = ({ totalKg, reductionRates }: Props) => {
  const t = useTranslations('survey.completion')
  const totalT = totalKg / STUDY_UNIT_VALUES['T']
  const currentYear = new Date().getFullYear()
  const endYear = 2050
  const rates = reductionRates ?? getSnbcDefaultReductionRates(currentYear)
  const trajectory = calculateSimpleLinearTrajectory(totalT, currentYear, rates, [2030, 2040, endYear])
  const endT = trajectory.find((point) => point.year === endYear)?.value ?? totalT

  return (
    <section className="mb2" data-testid="survey-completion-transition-encart">
      <div className={styles.transitionEncart}>
        <div className={styles.transitionHeader}>
          <Typography className={styles.transitionTitle}>{t('transition.title')}</Typography>
          <Typography className={styles.transitionDescription}>{t('transition.context')}</Typography>
        </div>

        <div className={`${styles.transitionBody} p15`}>
          <div className="flex-col gapped075">
            <Typography className={styles.transitionMetricLabel}>
              {t('transition.startLabel', { year: currentYear })}
            </Typography>
            <Typography className={styles.transitionMetricValue}>{formatNumber(totalT, 1)} tCO₂e/an</Typography>

            <Typography className={styles.transitionMetricLabel}>
              {t('transition.endLabel', { year: endYear })}
            </Typography>
            <Typography className={styles.transitionMetricValue}>{formatNumber(endT, 1)} tCO₂e/an</Typography>
          </div>
          <TrajectoryChart currentValue={totalT} reductionRates={reductionRates} />
        </div>
      </div>
    </section>
  )
}

export default TransitionEncart
