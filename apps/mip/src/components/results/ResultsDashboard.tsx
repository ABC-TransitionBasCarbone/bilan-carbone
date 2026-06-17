'use client'
import BarChart from '@/components/study/charts/BarChart'
import ObjectiveEncart from '@/components/results/ObjectiveEncart'
import PieChart from '@/components/study/charts/PieChart'
import { getResultsForEntity, KeyStatGroup, SurveyResults } from '@/data/sampleResults'
import { BaseStyledChip } from '@abc-transitionbascarbone/ui'
import { Print } from '@mui/icons-material'
import { Button, Card, CardContent, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import styles from './ResultsDashboard.module.css'

interface Props {
  results: SurveyResults
}

function KeyStatGroupSection({ group, t }: { group: KeyStatGroup; t: ReturnType<typeof useTranslations<'results'>> }) {
  return (
    <div className="mb2">
      <Typography variant="h6" className="mb1">
        {t(`keyStats.${group.key}.title` as Parameters<typeof t>[0])}
      </Typography>
      <div className="flex-col gapped-2">
        {group.stats.map((stat) => (
          <div key={stat.key} className={`flex justify-between ${styles.statRow}`}>
            <Typography variant="body2">{t(`keyStats.${group.key}.${stat.key}` as Parameters<typeof t>[0])}</Typography>
            <Typography variant="body2" className="bold">
              {stat.unit === 'percent' ? `${stat.value} %` : stat.value}
            </Typography>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ResultsDashboard({ results }: Props) {
  const t = useTranslations('results')
  const [selectedEntity, setSelectedEntity] = useState('all')

  const filtered = getResultsForEntity(results, selectedEntity)

  const pieChartItems = filtered.categories.map((c) => ({
    key: c.key,
    label: t(`categories.${c.key}` as Parameters<typeof t>[0]),
    value: c.valueTCO2e,
    color: c.color,
  }))

  const totalBarItem = {
    key: 'total',
    label: t('charts.barTitle'),
    value: filtered.averageFootprintTCO2e,
    color: '#6366f1',
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className={styles.page}>
      <Typography variant="h4" className="mb-2">
        {t('title')}
      </Typography>
      <Typography variant="body1" className="mb2">
        {t('subtitle')}
      </Typography>

      <div className={styles.statsGrid}>
        <Card>
          <CardContent className="p125">
            <Typography className={styles.statValue}>
              {filtered.averageFootprintTCO2e.toFixed(1)}
              <span className={styles.statUnit}> tCO₂e</span>
            </Typography>
            <Typography variant="body2">{t('stats.averageFootprint')}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p125">
            <Typography className={styles.statValue}>{filtered.totalRespondents}</Typography>
            <Typography variant="body2">{t('stats.respondents')}</Typography>
          </CardContent>
        </Card>
      </div>

      <ObjectiveEncart averageFootprintTCO2e={filtered.averageFootprintTCO2e} />

      <section className="mb2">
        <Typography variant="h6" className="mb1">
          {t('filter.title')}
        </Typography>
        <div className="flex wrap gapped-2">
          {results.entities.map((entity) => (
            <BaseStyledChip
              key={entity.id}
              label={entity.name}
              color={selectedEntity === entity.id ? 'primary' : 'default'}
              onClick={() => setSelectedEntity(entity.id)}
              clickable
            />
          ))}
        </div>
      </section>

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

      <section className="mb2">
        <Typography variant="h6" className="mb1">
          {t('keyStats.title')}
        </Typography>
        <Card>
          <CardContent className="p15">
            <div className={styles.keyStatsGrid}>
              {filtered.keyStats.map((group) => (
                <KeyStatGroupSection key={group.key} group={group} t={t} />
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="flex gapped1">
        <Button variant="outlined" startIcon={<Print />} onClick={handlePrint}>
          {t('export.print')}
        </Button>
      </div>
    </div>
  )
}
