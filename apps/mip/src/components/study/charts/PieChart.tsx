import { Typography } from '@mui/material'
import styles from './PieChart.module.css'

export type PieChartItem = {
  key: string
  label: string
  value: number
  color: string
}

interface Props {
  items: PieChartItem[]
  unit?: string
}

const RADIUS = 90
const STROKE_WIDTH = 40
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function PieChart({ items, unit = 'tCO₂e' }: Props) {
  const total = items.reduce((sum, item) => sum + item.value, 0)
  let cumulativeLength = 0

  return (
    <div className={styles.wrapper}>
      <div className={styles.chartContainer}>
        <svg viewBox="0 0 240 240" className={styles.chart} aria-label="Donut chart">
          <g transform="translate(120 120) rotate(-90)">
            {items.map((item) => {
              const segmentLength = total > 0 ? (item.value / total) * CIRCUMFERENCE : 0
              const strokeDashoffset = -cumulativeLength
              cumulativeLength += segmentLength

              return (
                <circle
                  key={item.key}
                  cx="0"
                  cy="0"
                  r={RADIUS}
                  fill="none"
                  stroke={item.color}
                  strokeWidth={STROKE_WIDTH}
                  strokeDasharray={`${segmentLength} ${CIRCUMFERENCE}`}
                  strokeDashoffset={strokeDashoffset}
                />
              )
            })}
          </g>
          <text x="120" y="112" textAnchor="middle" className={styles.totalValue}>
            {total.toFixed(1)}
          </text>
          <text x="120" y="136" textAnchor="middle" className={styles.totalUnit}>
            {unit}
          </text>
        </svg>
      </div>
      <div className={styles.legend}>
        {items.map((item) => (
          <div key={item.key} className={styles.legendItem}>
            <svg viewBox="0 0 12 12" className={styles.legendColor} aria-hidden="true">
              <circle cx="6" cy="6" r="6" fill={item.color} />
            </svg>
            <Typography variant="body2" className={styles.legendLabel}>
              {item.label}
            </Typography>
            <Typography variant="body2" className={styles.legendValue}>
              {item.value.toFixed(1)} {unit}
            </Typography>
          </div>
        ))}
      </div>
    </div>
  )
}
