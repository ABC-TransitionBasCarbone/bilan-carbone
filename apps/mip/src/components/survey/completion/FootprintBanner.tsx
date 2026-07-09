'use client'

import { STUDY_UNIT_VALUES } from '@abc-transitionbascarbone/utils/charts'
import { formatNumber } from '@abc-transitionbascarbone/utils/number'
import { Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import styles from '../SurveyCompletion.module.css'

interface Props {
  totalKg: number
}

const MAX_T = 12
const LIMIT_T = 2

const FootprintBanner = ({ totalKg }: Props) => {
  const t = useTranslations('survey.completion')
  const totalT = totalKg / STUDY_UNIT_VALUES['T']
  const currentPercent = Math.max(0, Math.min(100, (totalT / MAX_T) * 100))
  const limitPercent = (LIMIT_T / MAX_T) * 100

  return (
    <section className={`${styles.footprintBanner} p2 mb2`} data-testid="survey-completion-footprint-banner">
      <Typography variant="h4" className={styles.footprintBannerTitle}>
        {t('title')}
      </Typography>

      <div className={styles.rangeChartWrapper}>
        <div className={styles.rangeChartRow}>
          <div className={styles.rangeBarColumn}>
            <Typography className={styles.rangeCurrentValue} style={{ left: `${currentPercent}%` }}>
              {formatNumber(totalT, 1)}
            </Typography>

            <div className={styles.rangeBarTrack}>
              <div className={styles.rangeBarFill} style={{ width: `${currentPercent}%` }} />
              <div className={styles.rangeLimitLine} style={{ left: `${limitPercent}%` }} />
            </div>

            <div className={styles.rangeAxis}>
              <Typography className={styles.rangeAxisLabel}>{t('range.minLabel')}</Typography>
              <Typography className={styles.rangeAxisLabel}>{t('range.maxLabel')}</Typography>
            </div>
          </div>
        </div>

        <Typography className={styles.limitLabel} style={{ left: `${limitPercent}%` }}>
          {t('range.limitLabel', { limit: LIMIT_T })}
        </Typography>
      </div>
    </section>
  )
}

export default FootprintBanner
