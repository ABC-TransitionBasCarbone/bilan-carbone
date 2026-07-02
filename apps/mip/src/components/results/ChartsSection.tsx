'use client'

import { StudyResultUnit } from '@abc-transitionbascarbone/db-common/enums'
import { BarChart, PieChart } from '@abc-transitionbascarbone/ui'
import { BasicTypeCharts } from '@abc-transitionbascarbone/utils/charts'
import { Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import styles from './ChartsSection.module.css'

interface Props {
  pieChartItems: BasicTypeCharts[]
  totalBarItem: BasicTypeCharts
}

const ChartsSection = ({ pieChartItems, totalBarItem }: Props) => {
  const t = useTranslations('results')

  return (
    <section className="mb2">
      <Typography variant="h6" className="mb1">
        {t('charts.title')}
      </Typography>
      <div className={styles.chartsGrid}>
        <BarChart results={[totalBarItem]} resultsUnit={StudyResultUnit.T} showLegend={false} type="post" />
        <PieChart
          resultsUnit={StudyResultUnit.T}
          showTitle
          title={t('charts.pieTitle')}
          showLabelsOnPie
          skipAnimation
          results={pieChartItems}
          type="post"
        />
      </div>
    </section>
  )
}

export default ChartsSection
