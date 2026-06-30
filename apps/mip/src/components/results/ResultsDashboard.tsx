'use client'

import { CATEGORY_COLORS, getResultsForEntity, SurveyResults } from '@/data/sampleResults'
import { RawRules } from '@/publicodes/mip-engine'
import { BasicTypeCharts } from '@abc-transitionbascarbone/utils/charts'
import { Print } from '@mui/icons-material'
import { Button, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import ChartsSection from './ChartsSection'
import CollectiveEffortEncart from './CollectiveEffortEncart'
import EntityFilterSection from './EntityFilterSection'
import KeyStatsSection from './KeyStatsSection'
import ObjectiveEncart from './ObjectiveEncart'
import styles from './ResultsDashboard.module.css'
import StatsSection from './StatsSection'

interface Props {
  results: SurveyResults
  model: RawRules
}

const ResultsDashboard = ({ results, model }: Props) => {
  const t = useTranslations('results')
  const [selectedEntity, setSelectedEntity] = useState('all')

  const filtered = getResultsForEntity(results, selectedEntity)

  const pieChartItems = filtered.categories.map(
    (c) =>
      ({
        post: c.key,
        label: t(`categories.${c.key}`),
        value: c.valueTCO2e * 1000,
        color: c.color,
      }) as BasicTypeCharts,
  )

  const totalBarItem = {
    post: 'somme',
    label: t('charts.barTitle'),
    value: filtered.averageFootprintTCO2e * 1000,
    color: CATEGORY_COLORS.total,
  } as BasicTypeCharts

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className={`${styles.page} pt2`}>
      <Typography variant="h4" className="mb-2">
        {t('title')}
      </Typography>
      <Typography variant="body1" className="mb2">
        {t('subtitle')}
      </Typography>

      <StatsSection results={filtered} />

      <EntityFilterSection
        entities={results.entities}
        selectedEntity={selectedEntity}
        onSelectEntity={setSelectedEntity}
      />

      <ObjectiveEncart averageFootprintTCO2e={filtered.averageFootprintTCO2e} />

      <ChartsSection pieChartItems={pieChartItems} totalBarItem={totalBarItem} />

      <KeyStatsSection keyStats={filtered.keyStats} model={model} />

      <CollectiveEffortEncart />

      <div className="flex gapped1">
        <Button variant="outlined" startIcon={<Print />} onClick={handlePrint}>
          {t('export.print')}
        </Button>
      </div>
    </div>
  )
}

export default ResultsDashboard
