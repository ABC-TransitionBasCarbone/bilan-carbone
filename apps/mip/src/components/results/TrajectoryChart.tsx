'use client'

import { LineChart } from '@mui/x-charts/LineChart'
import { useMemo } from 'react'
import styles from './TrajectoryChart.module.css'

const YEARS = [new Date().getFullYear().toString(), '2030', '2040', '2050']
const TARGET_TRAJECTORY = [0, 7, 4, 2]

const TrajectoryChart = ({ currentValue }: { currentValue: number }) => {
  const safeCurrentValue = Number.isFinite(currentValue) ? Math.max(0, currentValue) : 0
  const maxValue = Math.max(9, Math.ceil(safeCurrentValue) + 1)

  const xAxis = useMemo(
    () => [
      {
        scaleType: 'point' as const,
        data: YEARS,
        tickLabelStyle: { fontSize: 11 },
      },
    ],
    [],
  )

  const yAxis = useMemo(
    () => [
      {
        min: 0,
        max: maxValue,
        tickNumber: 5,
        tickLabelStyle: { fontSize: 11 },
      },
    ],
    [maxValue],
  )

  const series = useMemo(
    () => [
      {
        data: [safeCurrentValue, ...TARGET_TRAJECTORY.slice(1)],
        label: 'tCO₂e/an',
        curve: 'linear' as const,
        showMark: true,
        valueFormatter: (value: number | null) => `${(value ?? 0).toFixed(1).replace('.', ',')} t`,
      },
    ],
    [safeCurrentValue],
  )

  return (
    <div className={styles.wrapper}>
      <LineChart
        className={styles.chart}
        xAxis={xAxis}
        yAxis={yAxis}
        series={series}
        height={240}
        margin={{ top: 20, bottom: 40, left: 40, right: 20 }}
        hideLegend
      />
    </div>
  )
}

export default TrajectoryChart
