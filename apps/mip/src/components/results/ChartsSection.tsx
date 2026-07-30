'use client'

import { StudyResultUnit } from '@abc-transitionbascarbone/db-common/enums'
import { BarChart, PieChart } from '@abc-transitionbascarbone/ui'
import { BasicTypeCharts } from '@abc-transitionbascarbone/utils/charts'
import { formatNumber } from '@abc-transitionbascarbone/utils/number'
import { Typography } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import styles from './ChartsSection.module.css'

interface Props {
  chartItems: BasicTypeCharts[]
}

const ChartsSection = ({ chartItems }: Props) => {
  const t = useTranslations('results')

  return (
    <section className="mb2">
      <Typography variant="h6" className="mb1">
        {t('charts.title')}
      </Typography>
      <div className={classNames(styles.chartsGrid, 'gapped1')}>
        <BarChart
          results={chartItems}
          resultsUnit={StudyResultUnit.T}
          title={t('charts.barTitle')}
          showLegend={false}
          type="post"
        />
        <PieChart
          resultsUnit={StudyResultUnit.T}
          showTitle
          title={t('charts.pieTitle')}
          showLabelsOnPie
          displayAsPercentage
          skipAnimation
          results={chartItems}
          type="post"
          tooltipValueFormatter={({ percentage }) =>
            t('charts.postDetailHoverPercent', {
              percent: formatNumber(percentage, 1),
            })
          }
        />
      </div>
    </section>
  )
}

export default ChartsSection
