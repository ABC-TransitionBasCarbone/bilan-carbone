'use client'

import TrajectoryChart from '@/components/results/TrajectoryChart'
import { STUDY_UNIT_VALUES } from '@abc-transitionbascarbone/utils/charts'
import { formatNumber } from '@abc-transitionbascarbone/utils/number'
import { Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import styles from '../SurveyCompletion.module.css'

interface Props {
  totalKg: number
  targetT?: number
}

const TransitionEncart = ({ totalKg, targetT = 2 }: Props) => {
  const t = useTranslations('survey.completion')
  const totalT = totalKg / STUDY_UNIT_VALUES['T']

  return (
    <section className="mb2" data-testid="survey-completion-transition-encart">
      <div className={styles.transitionEncart}>
        <div className={styles.transitionHeader}>
          <Typography className={styles.transitionTitle}>{t('transition.title', { target: targetT })}</Typography>
          <Typography className={styles.transitionDescription}>
            {t('transition.description', {
              current: formatNumber(totalT, 1),
              target: targetT,
            })}
          </Typography>
        </div>

        <div className={`${styles.transitionBody} p15`}>
          <div className="flex-col gapped075">
            <Typography className={styles.transitionMetricLabel}>{t('transition.startLabel')}</Typography>
            <Typography className={styles.transitionMetricValue}>{formatNumber(totalT, 1)} tCO2e/an</Typography>
            <Typography className={styles.transitionGoalText}>
              {t('transition.goalLabel', { target: targetT })}
            </Typography>
          </div>
          <TrajectoryChart currentValue={totalT} />
        </div>
      </div>
    </section>
  )
}

export default TransitionEncart
