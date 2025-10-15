'use client'

import { TrajectoryDataPoint } from '@/utils/trajectory'
import { Typography } from '@mui/material'
import { LineChart } from '@mui/x-charts/LineChart'
import { useTranslations } from 'next-intl'

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

  const years = trajectory15.data.map((d) => d.year)
  const studyStartYearIndex = years.indexOf(studyStartYear)

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
            data: years,
            scaleType: 'linear',
            valueFormatter: (value) => value.toString(),
            tickMinStep: 5,
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
