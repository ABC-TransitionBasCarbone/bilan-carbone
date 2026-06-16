import { Typography } from '@mui/material'
import styles from './BarChart.module.css'

export type BarChartItem = {
  key: string
  label: string
  value: number
  color: string
}

interface Props {
  items: BarChartItem[]
  unit?: string
  targetValue?: number
  targetLabel?: string
}

export default function BarChart({ items, unit = 't', targetValue = 2, targetLabel }: Props) {
  const maxValue = Math.max(...items.map((i) => i.value), targetValue, 1)
  const targetPosition = (targetValue / maxValue) * 100

  return (
    <div className={styles.chart}>
      <div className={styles.targetLegend}>
        <span className={styles.targetLegendMarker} aria-hidden="true" />
        <Typography variant="body2" className={styles.targetLegendText}>
          {targetLabel}
        </Typography>
      </div>
      {items.map((item) => (
        <div key={item.key} className={styles.row}>
          <Typography variant="body2" className={styles.label}>
            {item.label}
          </Typography>
          <svg viewBox="0 0 100 24" preserveAspectRatio="none" className={styles.barSvg} aria-hidden="true">
            <rect x="0" y="0" width="100" height="24" rx="4" className={styles.barTrack} />
            <rect x="0" y="0" width={(item.value / maxValue) * 100} height="24" rx="4" fill={item.color} />
            <line x1={targetPosition} y1="0" x2={targetPosition} y2="24" className={styles.targetLine} />
          </svg>
          <Typography variant="body2" className={styles.value}>
            {item.value.toFixed(1)} {unit}
          </Typography>
        </div>
      ))}
    </div>
  )
}
