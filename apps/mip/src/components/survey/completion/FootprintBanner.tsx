'use client'

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
  const totalT = totalKg / 1000
  const currentPercent = Math.max(0, Math.min(100, (totalT / MAX_T) * 100))
  const limitPercent = (LIMIT_T / MAX_T) * 100

  return (
    <section className={`${styles.footprintBanner} p2 mb2`} data-testid="survey-completion-footprint-banner">
      <Typography variant="h4" className={styles.footprintBannerTitle}>
        {t('title')}
      </Typography>

      <div className={styles.rangeLegend}>
        <Typography className={styles.rangeTickLabel}>{t('range.minLabel')}</Typography>
        <Typography className={styles.rangeTickLabel}>{t('range.maxLabel')}</Typography>
      </div>

      <div className={styles.rangeTrackWrapper}>
        <div className={styles.rangeTrack}>
          <div className={styles.limitMarker} style={{ left: `${limitPercent}%` }} />
          <div className={styles.currentMarker} style={{ left: `${currentPercent}%` }} />
        </div>

        <Typography className={styles.limitLabel} style={{ left: `${limitPercent}%` }}>
          {t('range.limitLabel', { limit: LIMIT_T })}
        </Typography>

        <Typography className={styles.currentLabel} style={{ left: `${currentPercent}%` }}>
          {t('range.currentLabel', { value: formatNumber(totalT, 1) })}
        </Typography>
      </div>
    </section>
  )
}

export default FootprintBanner
