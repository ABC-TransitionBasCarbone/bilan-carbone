'use client'

import { CATEGORY_COLORS, getResultsForEntity } from '@/data/sampleResults'
import { SurveyResults } from '@/types/results.types'
import { StudyResultUnit } from '@abc-transitionbascarbone/db-common/enums'
import { BasicTypeCharts } from '@abc-transitionbascarbone/utils/charts'
import { Print } from '@mui/icons-material'
import { Button, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import ChartsSection from './ChartsSection'
import EntityFilterSection from './EntityFilterSection'
import KeyStatsSection from './KeyStatsSection'
import styles from './ResultsDashboard.module.css'
import StatsSection from './StatsSection'

interface Props {
  results: SurveyResults
}

const ResultsDashboard = ({ results }: Props) => {
  const t = useTranslations('results')
  const [selectedEntity, setSelectedEntity] = useState('all')

  const filtered = getResultsForEntity(results, selectedEntity)

  const pieChartItems = filtered.categories.map(
    (c) =>
      ({
        post: c.key,
        label: t(`categories.${c.key}`),
        value: c.value,
        color: c.color,
        children: [],
      }) as BasicTypeCharts,
  )

  const barChartItems = [
    ...pieChartItems,
    {
      post: 'total-limit',
      label: t('charts.totalLimitColumn'),
      value: pieChartItems.reduce((acc, c) => acc + c.value, 0),
      color: CATEGORY_COLORS.total,
      children: [],
    } as BasicTypeCharts,
  ]

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className={`${styles.page} pt2`}>
      <section className="mb1">
        <Typography variant="h4" className="mb-2">
          {t('title')}
        </Typography>
        <Typography variant="body1" className={styles.pageSubtitle}>
          {t('subtitle')}
        </Typography>
      </section>

      <StatsSection results={filtered} resultsUnit={StudyResultUnit.T} />

      <EntityFilterSection
        entities={results.entities}
        selectedEntity={selectedEntity}
        onSelectEntity={setSelectedEntity}
      />

      <ChartsSection
        pieChartItems={pieChartItems}
        barChartItems={barChartItems}
        averageFootprint={filtered.averageFootprint}
        totalRespondents={filtered.totalRespondents}
      />

      <KeyStatsSection keyStats={filtered.keyStats} />

      <div className="flex gapped1 mt1">
        <Button variant="outlined" startIcon={<Print />} onClick={handlePrint}>
          {t('export.print')}
        </Button>
      </div>
    </div>
  )
}

export default ResultsDashboard
