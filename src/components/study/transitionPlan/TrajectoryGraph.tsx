'use client'

import { Typography } from '@mui/material'
import { LineChart } from '@mui/x-charts/LineChart'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

export interface TrajectoryDataPoint {
  year: number
  value: number
}

interface TrajectoryData {
  data: TrajectoryDataPoint[]
  enabled: boolean
}

interface Props {
  trajectory15: TrajectoryData
  trajectoryWB2C: TrajectoryData
  studyStartYear: number
}

const TrajectoryGraph = ({ trajectory15, trajectoryWB2C, studyStartYear }: Props) => {
  const t = useTranslations('study.transitionPlan.trajectories.graph')

  const yearsToDisplay = useMemo(() => {
    const allYears = [
      ...(trajectory15.enabled ? trajectory15.data.map((d) => d.year) : []),
      ...(trajectoryWB2C.enabled ? trajectoryWB2C.data.map((d) => d.year) : []),
    ]
    return Array.from(new Set(allYears)).sort((a, b) => a - b)
  }, [trajectory15, trajectoryWB2C])

  const studyStartYearIndex = yearsToDisplay.indexOf(studyStartYear)

  return (
    <div className="w100 mb2">
      <Typography variant="h5" component="h2" fontWeight={600} gutterBottom>
        {t('title')}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {t('subtitle')}
      </Typography>

      <LineChart
        xAxis={[
          {
            data: yearsToDisplay,
            scaleType: 'linear',
            valueFormatter: (value) => value.toString(),
            // Show first year value and every 5 years cap after that
            tickInterval: [yearsToDisplay[0], ...yearsToDisplay.filter((year) => year % 5 === 0)],
          },
        ]}
        series={[
          ...(trajectory15.enabled
            ? [
                {
                  data: trajectory15.data.map((d) => d.value),
                  label: t('trajectory15'),
                  color: 'var(--trajectory-sbti-15)',
                  curve: 'linear' as const,
                  showMark: ({ index }: { index: number }) => index === studyStartYearIndex,
                  valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
                },
              ]
            : []),
          ...(trajectoryWB2C.enabled
            ? [
                {
                  data: trajectoryWB2C.data.map((d) => d.value),
                  label: t('trajectoryWB2C'),
                  color: 'var(--trajectory-sbti-wb2c)',
                  curve: 'linear' as const,
                  showMark: ({ index }: { index: number }) => index === studyStartYearIndex,
                  valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
                },
              ]
            : []),
        ]}
        height={400}
        yAxis={[
          {
            label: t('yAxisLabel'),
          },
        ]}
      />
    </div>
  )
}

export default TrajectoryGraph
