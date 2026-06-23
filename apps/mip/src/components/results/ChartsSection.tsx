'use client'

import BarChart, { BarChartItem } from '@/components/study/charts/BarChart'
import PieChart from '@/components/study/charts/PieChart'
import { Card, CardContent, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import styles from './ChartsSection.module.css'

interface Props {
  pieChartItems: BarChartItem[]
  totalBarItem: BarChartItem
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
            <BarChart items={[totalBarItem]} unit="tCO₂e" targetValue={2} targetLabel={t('charts.target2050')} />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" className="mb1">
              {t('charts.pieTitle')}
            </Typography>
            <PieChart items={pieChartItems} />
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

export default ChartsSection
