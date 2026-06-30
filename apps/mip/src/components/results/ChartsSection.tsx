'use client'

import StudyBarChart from '@/components/study/charts/BarChart'
import { StudyResultUnit } from '@abc-transitionbascarbone/db-common/enums'
import { PieChart } from '@abc-transitionbascarbone/ui'
import { BasicTypeCharts } from '@abc-transitionbascarbone/utils/charts'
import { Card, CardContent, Typography } from '@mui/material'
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
        <Card>
          <CardContent>
            <Typography variant="subtitle1" className="mb1">
              {t('charts.barTitle')}
            </Typography>
            <StudyBarChart items={[totalBarItem]} unit="tCO₂e" targetValue={2} targetLabel={t('charts.target2050')} />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" className="mb1">
              {t('charts.pieTitle')}
            </Typography>
            <PieChart
              resultsUnit={StudyResultUnit.T}
              showTitle={true}
              title={t('charts.pieTitle')}
              showLabelsOnPie={true}
              skipAnimation={true}
              results={pieChartItems}
              type="post"
            />
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

export default ChartsSection
