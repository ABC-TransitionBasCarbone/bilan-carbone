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

const PieChart = ({ items, unit = 'tCO₂e' }: Props) => {
  const total = items.reduce((sum, item) => sum + item.value, 0)

  const segments = items.reduce<Array<{ key: string; color: string; segmentLength: number; strokeDashoffset: number }>>(
    (acc, item) => {
      const segmentLength = total > 0 ? (item.value / total) * CIRCUMFERENCE : 0
      const previous = acc[acc.length - 1]
      const strokeDashoffset = previous ? previous.strokeDashoffset - previous.segmentLength : 0

      acc.push({ key: item.key, color: item.color, segmentLength, strokeDashoffset })
      return acc
    },
    [],
  )

  return (
    <div className={styles.wrapper}>
      <div className={styles.chartContainer}>
        <svg viewBox="0 0 240 240" className={styles.chart} aria-label="Donut chart">
          <g transform="translate(120 120) rotate(-90)">
            {segments.map((segment) => (
              <circle
                key={segment.key}
                cx="0"
                cy="0"
                r={RADIUS}
                fill="none"
                stroke={segment.color}
                strokeWidth={STROKE_WIDTH}
                strokeDasharray={`${segment.segmentLength} ${CIRCUMFERENCE}`}
                strokeDashoffset={segment.strokeDashoffset}
              />
            ))}
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

export default PieChart
