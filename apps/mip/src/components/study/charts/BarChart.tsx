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
}

export default function BarChart({ items, unit = 't' }: Props) {
  const maxValue = Math.max(...items.map((i) => i.value), 1)

  return (
    <div className={styles.chart}>
      {items.map((item) => (
        <div key={item.key} className={styles.row}>
          <Typography variant="body2" className={styles.label}>
            {item.label}
          </Typography>
          <div className={styles.barTrack}>
            <div
              className={styles.bar}
              style={
                {
                  '--bar-width': `${(item.value / maxValue) * 100}%`,
                  '--bar-color': item.color,
                } as React.CSSProperties
              }
            />
          </div>
          <Typography variant="body2" className={styles.value}>
            {item.value.toFixed(1)} {unit}
          </Typography>
        </div>
      ))}
    </div>
  )
}
