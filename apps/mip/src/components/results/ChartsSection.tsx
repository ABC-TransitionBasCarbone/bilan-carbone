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
  pieChartItems: BasicTypeCharts[]
  barChartItems: BasicTypeCharts[]
  averageFootprint: number
  totalRespondents: number
}

const ChartsSection = ({ pieChartItems, barChartItems, averageFootprint, totalRespondents }: Props) => {
  const t = useTranslations('results')

  return (
    <section className="mb2">
      <Typography variant="h6" className="mb1">
        {t('charts.title')}
      </Typography>
      <div className={classNames(styles.chartsGrid, 'gapped1')}>
        <BarChart
          results={barChartItems}
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
          results={pieChartItems}
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
