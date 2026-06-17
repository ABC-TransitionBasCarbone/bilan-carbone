'use client'

import { LineChart } from '@mui/x-charts/LineChart'
import styles from './TrajectoryChart.module.css'

const YEARS = [new Date().getFullYear().toString(), '2030', '2040', '2050']
const TARGET_TRAJECTORY = [0, 7, 4, 2]

export default function TrajectoryChart({ currentValue }: { currentValue: number }) {
  const data = [currentValue, ...TARGET_TRAJECTORY.slice(1)]

  return (
    <div className={styles.wrapper}>
      <LineChart
        className={styles.chart}
        xAxis={[
          {
            scaleType: 'point',
            data: YEARS,
            tickLabelStyle: { fontSize: 11 },
          },
        ]}
        yAxis={[
          {
            min: 0,
            max: Math.max(9, Math.ceil(currentValue) + 1),
            tickNumber: 5,
            tickLabelStyle: { fontSize: 11 },
          },
        ]}
        series={[
          {
            data,
            label: 'tCO₂e/an',
            color: '#d6006c',
            curve: 'linear',
            showMark: true,
            valueFormatter: (value) => `${(value ?? 0).toFixed(1).replace('.', ',')} t`,
          },
        ]}
        height={240}
        margin={{ top: 20, bottom: 40, left: 40, right: 20 }}
        slotProps={{ legend: { hidden: true } }}
        grid={{ horizontal: true }}
      />
    </div>
  )
}
