'use client'

import { SurveyResults } from '@/types/results.types'
import { StudyResultUnit } from '@abc-transitionbascarbone/db/enums'
import { STUDY_UNIT_VALUES } from '@abc-transitionbascarbone/shared/utils/charts'
import { formatNumber } from '@abc-transitionbascarbone/shared/utils/number'
import { Card, CardContent, Typography } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import styles from './StatsSection.module.css'

interface Props {
  results: SurveyResults
  resultsUnit: StudyResultUnit
}

const StatsSection = ({ results, resultsUnit }: Props) => {
  const t = useTranslations('results')

  return (
    <div className={classNames('mb-2rem', 'flex', 'gapped', 'wrap')}>
      <Card>
        <CardContent className="p125">
          <Typography className={styles.statValue}>
            {formatNumber(results.averageFootprint / STUDY_UNIT_VALUES[resultsUnit], 1)}
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
