'use client'
import { getResultsForEntity, SurveyResults } from '@/data/sampleResults'
import { Download, Print } from '@mui/icons-material'
import { Button, Card, CardContent, Chip, Divider, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import styles from './ResultsDashboard.module.css'

interface Props {
  results: SurveyResults
}

export default function ResultsDashboard({ results }: Props) {
  const t = useTranslations('results')
  const [selectedEntity, setSelectedEntity] = useState('all')

  const filtered = getResultsForEntity(results, selectedEntity)
  const maxCategoryValue = Math.max(...filtered.categories.map((c) => c.valueTCO2e))

  const responseRate = Math.round((filtered.totalRespondents / filtered.totalInvited) * 100)

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className={styles.container}>
      <Typography variant="h4" className={styles.title}>
        {t('title')}
      </Typography>
      <Typography variant="body1" className={styles.subtitle}>
        {t('subtitle')}
      </Typography>

      <div className={styles.statsGrid}>
        <Card>
          <CardContent className={styles.statCard}>
            <Typography className={styles.statValue}>
              {filtered.averageFootprintTCO2e.toFixed(1)}
              <span className={styles.statUnit}> tCO₂e</span>
            </Typography>
            <Typography variant="body2" className={styles.statLabel}>
              {t('stats.averageFootprint')}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent className={styles.statCard}>
            <Typography className={styles.statValue}>{filtered.totalRespondents}</Typography>
            <Typography variant="body2" className={styles.statLabel}>
              {t('stats.respondents')}
            </Typography>
            <Typography className={styles.statRespondents}>
              {t('stats.respondentsDetail', {
                count: filtered.totalRespondents,
                total: filtered.totalInvited,
                rate: responseRate,
              })}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent className={styles.statCard}>
            <Typography className={styles.statValue}>
              {responseRate}
              <span className={styles.statUnit}> %</span>
            </Typography>
            <Typography variant="body2" className={styles.statLabel}>
              {t('stats.responseRate')}
            </Typography>
          </CardContent>
        </Card>
      </div>

      <div className={styles.section}>
        <Typography variant="h6" className={styles.sectionTitle}>
          {t('filter.title')}
        </Typography>
        <div className={styles.filterRow}>
          {results.entities.map((entity) => (
            <Chip
              key={entity.id}
              label={entity.name}
              className={styles.filterChip}
              color={selectedEntity === entity.id ? 'primary' : 'default'}
              onClick={() => setSelectedEntity(entity.id)}
            />
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <Typography variant="h6" className={styles.sectionTitle}>
          {t('categories.title')}
        </Typography>
        <Card>
          <CardContent className={styles.chartCard}>
            {filtered.categories.map((category) => (
              <div key={category.key} className={styles.chartRow}>
                <Typography variant="body2" className={styles.chartLabel}>
                  {t(`categories.${category.key}`)}
                </Typography>
                <div className={styles.chartBarTrack}>
                  <div
                    className={styles.chartBar}
                    style={
                      {
                        '--bar-width': `${(category.valueTCO2e / maxCategoryValue) * 100}%`,
                        '--bar-color': category.color,
                      } as React.CSSProperties
                    }
                  />
                </div>
                <Typography variant="body2" className={styles.chartValue}>
                  {category.valueTCO2e.toFixed(1)} t
                </Typography>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className={styles.section}>
        <Typography variant="h6" className={styles.sectionTitle}>
          {t('comments.title')}
        </Typography>
        <Card>
          <CardContent className={styles.commentsCard}>
            {filtered.comments.map((comment, index) => (
              <div key={comment.id}>
                {index > 0 && <Divider />}
                <div className={styles.commentItem}>
                  <Typography className={styles.commentCategory}>{comment.category}</Typography>
                  <Typography variant="body2" className={styles.commentText}>
                    {comment.text}
                  </Typography>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className={styles.exportRow}>
        <Button variant="outlined" startIcon={<Download />} onClick={handlePrint}>
          {t('export.visual')}
        </Button>
        <Button variant="outlined" startIcon={<Print />} onClick={handlePrint}>
          {t('export.print')}
        </Button>
      </div>
    </div>
  )
}
