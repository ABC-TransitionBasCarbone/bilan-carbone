'use client'

import { SurveyResults } from '@/data/sampleResults'
import { formatNumber } from '@abc-transitionbascarbone/utils/number'
import { Card, CardContent, Typography } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import styles from './StatsSection.module.css'

interface Props {
  results: SurveyResults
}

const StatsSection = ({ results }: Props) => {
  const t = useTranslations('results')

  return (
    <div className={classNames('gap-1rem', 'mb-2rem', 'grid')}>
      <Card>
        <CardContent className="p125">
          <Typography className={styles.statValue}>
            {formatNumber(results.averageFootprint / 1000, 1)}
            <span className={styles.statUnit}> tCO₂e</span>
          </Typography>
          <Typography variant="body2">{t('stats.averageFootprint')}</Typography>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p125">
          <Typography className={styles.statValue}>{results.totalRespondents}</Typography>
          <Typography variant="body2">{t('stats.respondents')}</Typography>
        </CardContent>
      </Card>
    </div>
  )
}

export default StatsSection
