'use client'

import {
  calculateSimpleLinearTrajectory,
  getSnbcDefaultReductionRates,
  ReductionRates,
} from '@abc-transitionbascarbone/utils/trajectory'
import { LineChart } from '@mui/x-charts/LineChart'
import { useMemo } from 'react'
import styles from './TrajectoryChart.module.css'

const CHECKPOINTS = [2030, 2040, 2050]

interface Props {
  currentValue: number
  reductionRates?: ReductionRates
}

const TrajectoryChart = ({ currentValue, reductionRates }: Props) => {
  const safeCurrentValue = Number.isFinite(currentValue) ? Math.max(0, currentValue) : 0
  const currentYear = new Date().getFullYear()

  const trajectoryPoints = useMemo(() => {
    const rates = reductionRates ?? getSnbcDefaultReductionRates(currentYear)
    return calculateSimpleLinearTrajectory(safeCurrentValue, currentYear, rates, CHECKPOINTS)
  }, [safeCurrentValue, currentYear, reductionRates])

  const xAxisData = useMemo(() => trajectoryPoints.map((p) => p.year.toString()), [trajectoryPoints])
  const seriesData = useMemo(() => trajectoryPoints.map((p) => p.value), [trajectoryPoints])

  const maxValue = useMemo(() => Math.max(1, Math.ceil(safeCurrentValue) + 1), [safeCurrentValue])

  const xAxis = useMemo(
    () => [
      {
        scaleType: 'point' as const,
        data: xAxisData,
        tickLabelStyle: { fontSize: 11 },
      },
    ],
    [xAxisData],
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
        data: seriesData,
        label: 'tCO₂e/an',
        curve: 'linear' as const,
        showMark: true,
        valueFormatter: (value: number | null) => `${(value ?? 0).toFixed(1).replace('.', ',')} t`,
      },
    ],
    [seriesData],
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
