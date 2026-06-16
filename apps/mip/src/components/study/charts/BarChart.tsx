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

const CHART_W = 400
const VALUE_W = 100
const TOTAL_W = CHART_W + VALUE_W
const PAD_TOP = 42
const BAR_H = 44
const BAR_GAP = 12
const AXIS_H = 32

function niceUpperBound(value: number): number {
  if (value <= 5) return 6
  if (value <= 10) return 12
  if (value <= 15) return 16
  if (value <= 20) return 20
  const step = 10
  return Math.ceil(value / step) * step
}

export default function BarChart({ items, unit = 'tCO₂e', targetValue = 2, targetLabel }: Props) {
  const dataMax = Math.max(...items.map((i) => i.value))
  const maxValue = niceUpperBound(Math.max(dataMax, targetValue))

  const tickStep = maxValue <= 12 ? 2 : maxValue <= 20 ? 5 : 10
  const ticks: number[] = []
  for (let v = 0; v <= maxValue; v += tickStep) ticks.push(v)

  const totalBarsH = items.length * BAR_H + Math.max(0, items.length - 1) * BAR_GAP
  const svgH = PAD_TOP + totalBarsH + AXIS_H

  const xOf = (v: number) => (v / maxValue) * CHART_W
  const targetX = xOf(targetValue)
  const axisY = PAD_TOP + totalBarsH

  return (
    <svg viewBox={`0 0 ${TOTAL_W} ${svgH}`} className={styles.chart} role="img" aria-label="Horizontal bar chart">
      {targetLabel && (
        <>
          <line x1={targetX} y1={4} x2={targetX} y2={PAD_TOP - 4} className={styles.targetLineLegend} />
          <text x={targetX + 6} y={PAD_TOP - 16} className={styles.targetLabel}>
            {targetLabel}
          </text>
        </>
      )}

      {items.map((item, i) => {
        const barY = PAD_TOP + i * (BAR_H + BAR_GAP)
        const barW = xOf(item.value)

        return (
          <g key={item.key}>
            <rect x={0} y={barY} width={CHART_W} height={BAR_H} rx={6} className={styles.track} />
            <rect x={0} y={barY} width={barW} height={BAR_H} rx={6} fill={item.color} />
            <text x={CHART_W + 10} y={barY + BAR_H / 2} dominantBaseline="middle" className={styles.valueLabel}>
              {item.value.toFixed(1)} {unit}
            </text>
          </g>
        )
      })}

      <line x1={targetX} y1={PAD_TOP} x2={targetX} y2={axisY} className={styles.targetLine} />

      <line x1={0} y1={axisY} x2={CHART_W} y2={axisY} className={styles.axisLine} />

      {ticks.map((tick) => {
        const x = xOf(tick)
        return (
          <g key={tick}>
            <line x1={x} y1={axisY} x2={x} y2={axisY + 5} className={styles.axisTick} />
            <text x={x} y={axisY + 20} textAnchor="middle" className={styles.axisLabel}>
              {tick} t
            </text>
          </g>
        )
      })}
    </svg>
  )
}
