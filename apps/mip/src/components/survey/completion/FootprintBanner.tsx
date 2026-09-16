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
  // Use a rounded ceiling with a small headroom so the marker remains readable.
  const rangeMaxT = Math.max(10, Math.ceil((totalT * 1.2) / 10) * 10)
  const currentPercent = Math.max(0, Math.min(100, (totalT / rangeMaxT) * 100))

  return (
    <section className={`${styles.footprintBanner} p2 mb2`} data-testid="survey-completion-footprint-banner">
      <Typography variant="h4" className={styles.footprintBannerTitle}>
        {t('title')}
      </Typography>

      <div className="pt05 pb1">
        <div className={`${styles.rangeBarTrack} relative`}>
          <div className={`${styles.rangeBarSpectrum} absolute`} />

          <div
            className={`${styles.rangeBarMarker} absolute flex-col align-center`}
            style={{ left: `${currentPercent}%` }}
          >
            <div className={styles.rangeBarDot} />
            <Typography className={styles.rangeCurrentValue}>{formatNumber(totalT, 1)}</Typography>
          </div>
        </div>

        <div className={`${styles.rangeAxis} justify-between align-center`}>
          <Typography className={styles.rangeAxisLabel}>{t('range.minLabel')}</Typography>
          <Typography className={styles.rangeLimitLabel}>{t('range.limitLabel')}</Typography>
          <Typography className={styles.rangeAxisLabel}>{t('range.maxLabel')}</Typography>
        </div>
      </div>
    </section>
  )
}

export default FootprintBanner
