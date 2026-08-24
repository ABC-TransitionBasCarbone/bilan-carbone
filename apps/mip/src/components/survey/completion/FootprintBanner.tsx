'use client'

import { STUDY_UNIT_VALUES } from '@abc-transitionbascarbone/utils/charts'
import { formatNumber } from '@abc-transitionbascarbone/utils/number'
import { Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import styles from '../SurveyCompletion.module.css'

interface Props {
  totalKg: number
}

const FootprintBanner = ({ totalKg }: Props) => {
  const t = useTranslations('survey.completion')
  const totalT = totalKg / STUDY_UNIT_VALUES['T']
  // Dynamic scale to avoid fixed thresholds in the banner.
  const rangeMaxT = Math.max(1, totalT * 1.2)
  const currentPercent = Math.max(0, Math.min(100, (totalT / rangeMaxT) * 100))

  return (
    <section className={`${styles.footprintBanner} p2 mb2`} data-testid="survey-completion-footprint-banner">
      <Typography variant="h4" className={styles.footprintBannerTitle}>
        {t('title')}
      </Typography>

      <div className="relative pt1 pb2">
        <div className="flex align-end gapped075">
          <div className="relative grow">
            <Typography className={styles.rangeCurrentValue} style={{ left: `${currentPercent}%` }}>
              {formatNumber(totalT, 1)}
            </Typography>

            <div className={styles.rangeBarTrack}>
              <div className={styles.rangeBarFill} style={{ width: `${currentPercent}%` }} />
            </div>

            <div className="justify-start pt025">
              <Typography className={styles.rangeAxisLabel}>{t('range.minLabel')}</Typography>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FootprintBanner
