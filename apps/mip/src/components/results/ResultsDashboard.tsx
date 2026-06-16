'use client'
import BarChart from '@/components/study/charts/BarChart'
import PieChart from '@/components/study/charts/PieChart'
import { getResultsForEntity, KeyStatGroup, SurveyResults } from '@/data/sampleResults'
import { BaseStyledChip } from '@abc-transitionbascarbone/ui'
import { Download, Print } from '@mui/icons-material'
import { Button, Card, CardContent, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useCallback, useRef, useState } from 'react'
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
            <Typography variant="body2">
              {t(`keyStats.${group.key}.${stat.key}` as Parameters<typeof t>[0])}
            </Typography>
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
  const dashboardRef = useRef<HTMLDivElement>(null)

  const filtered = getResultsForEntity(results, selectedEntity)
  const responseRate = Math.round((filtered.totalRespondents / filtered.totalInvited) * 100)

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

  const groupedComments = filtered.comments.reduce(
    (acc, comment) => {
      if (!acc[comment.category]) {
        acc[comment.category] = []
      }
      acc[comment.category].push(comment)
      return acc
    },
    {} as Record<string, typeof filtered.comments>,
  )

  const handleExportPng = useCallback(async () => {
    if (!dashboardRef.current) return
    const { toPng } = await import('html-to-image')
    const dataUrl = await toPng(dashboardRef.current, { quality: 1 })
    const link = document.createElement('a')
    link.download = 'resultats-campagne.png'
    link.href = dataUrl
    link.click()
  }, [])

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className={styles.page} ref={dashboardRef}>
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
            <Typography variant="body2">
              {t('stats.respondentsDetail', {
                count: filtered.totalRespondents,
                total: filtered.totalInvited,
                rate: responseRate,
              })}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p125">
            <Typography className={styles.statValue}>
              {responseRate}
              <span className={styles.statUnit}> %</span>
            </Typography>
            <Typography variant="body2">{t('stats.responseRate')}</Typography>
          </CardContent>
        </Card>
      </div>

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
            <CardContent className="p15">
              <Typography variant="subtitle1" className="mb1">
                {t('charts.barTitle')}
              </Typography>
              <BarChart items={[totalBarItem]} unit="tCO₂e" targetValue={2} targetLabel={t('charts.target2050')} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p15">
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

      <section className="mb2">
        <Typography variant="h6" className="mb1">
          {t('comments.title')}
        </Typography>
        {Object.keys(groupedComments).length === 0 ? (
          <Typography variant="body2">{t('comments.noComments')}</Typography>
        ) : (
          Object.entries(groupedComments).map(([category, categoryComments]) => (
            <Card key={category} className="mb1">
              <CardContent className="p15">
                <Typography variant="subtitle1" className={`bold mb1 ${styles.commentCategory}`}>
                  {category}
                </Typography>
                <div className="flex-col gapped1">
                  {categoryComments.map((comment) => (
                    <Typography key={comment.id} variant="body2" className={styles.commentText}>
                      {comment.text}
                    </Typography>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </section>

      <div className="flex gapped1">
        <Button variant="outlined" startIcon={<Download />} onClick={handleExportPng}>
          {t('export.visual')}
        </Button>
        <Button variant="outlined" startIcon={<Print />} onClick={handlePrint}>
          {t('export.print')}
        </Button>
      </div>
    </div>
  )
}
