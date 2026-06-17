import styles from './TrajectoryChart.module.css'

type TrajectoryPoint = {
  year: string
  value: number
  label: string
  isFirst?: boolean
  isLast?: boolean
}

const POINTS: TrajectoryPoint[] = [
  { year: '', value: 8.2, label: 'Vous aujourd\'hui', isFirst: true },
  { year: '2030', value: 7, label: '7 t' },
  { year: '2040', value: 4, label: '4 t' },
  { year: '2050', value: 2, label: '2 tonnes CO₂e / an', isLast: true },
]

const W = 500
const H = 240
const PAD_LEFT = 10
const PAD_RIGHT = 20
const PAD_TOP = 60
const PAD_BOTTOM = 30
const CHART_W = W - PAD_LEFT - PAD_RIGHT
const CHART_H = H - PAD_TOP - PAD_BOTTOM

const MAX_VAL = 9
const MIN_VAL = 1.5

function toX(index: number) {
  return PAD_LEFT + (index / (POINTS.length - 1)) * CHART_W
}

function toY(value: number) {
  return PAD_TOP + ((MAX_VAL - value) / (MAX_VAL - MIN_VAL)) * CHART_H
}

export default function TrajectoryChart({ currentValue }: { currentValue: number }) {
  const points = POINTS.map((p, i) => ({
    ...p,
    value: i === 0 ? currentValue : p.value,
    x: toX(i),
    y: i === 0 ? toY(currentValue) : toY(p.value),
  }))

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  const lastPoint = points[points.length - 1]
  const secondToLast = points[points.length - 2]
  const arrowAngle = Math.atan2(lastPoint.y - secondToLast.y, lastPoint.x - secondToLast.x)
  const arrowSize = 10
  const arrowX1 = lastPoint.x - arrowSize * Math.cos(arrowAngle - 0.35)
  const arrowY1 = lastPoint.y - arrowSize * Math.sin(arrowAngle - 0.35)
  const arrowX2 = lastPoint.x - arrowSize * Math.cos(arrowAngle + 0.35)
  const arrowY2 = lastPoint.y - arrowSize * Math.sin(arrowAngle + 0.35)

  return (
    <div className={styles.wrapper}>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} aria-hidden="true">
        <path d={pathD} className={styles.line} fill="none" />

        <polyline
          points={`${arrowX1},${arrowY1} ${lastPoint.x},${lastPoint.y} ${arrowX2},${arrowY2}`}
          className={styles.arrow}
          fill="none"
        />

        {points.map((p, i) => {
          const isLast = i === points.length - 1
          const labelBelow = i > 0
          const yearY = p.y - 14
          const labelY = labelBelow ? p.y + 22 : p.y - 22

          return (
            <g key={i}>
              {!isLast && <circle cx={p.x} cy={p.y} r={7} className={styles.dot} />}

              {p.year ? (
                <text x={p.x + 8} y={yearY} className={styles.yearLabel}>
                  {p.year}
                </text>
              ) : null}

              {i === 0 ? (
                <text x={p.x + 8} y={p.y - 24} className={styles.firstLabel}>
                  {p.label}
                </text>
              ) : isLast ? (
                <>
                  <text x={p.x + 8} y={p.y - 4} className={styles.lastYearLabel}>
                    Objectif 2050
                  </text>
                  <text x={p.x + 8} y={p.y + 18} className={styles.lastValueLabel}>
                    {p.label}
                  </text>
                </>
              ) : (
                <text x={p.x + 8} y={labelY} className={styles.valueLabel}>
                  {p.label}
                </text>
              )}

              {i === 0 && (
                <text x={p.x + 8} y={p.y - 6} className={styles.currentValue}>
                  {currentValue.toFixed(1).replace('.', ',')} t
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
