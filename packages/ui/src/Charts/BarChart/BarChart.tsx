'use client'

import { Typography } from '@mui/material'
import { BarChart as MuiBarChart } from '@mui/x-charts'
import styles from './BarChart.module.css'
import { BarChartData, BarChartSeriesData } from '../types'

const BAR_CHART_CONSTANTS = {
  TICK_ANGLE: -20,
  TICK_FONT_SIZE: 10,
  AXIS_HEIGHT: 80,
} as const

interface Props {
  barData: BarChartData
  seriesData?: BarChartSeriesData[]
  title?: string
  height?: number
  showTitle?: boolean
  showLegend?: boolean
  showLabelsOnBars?: boolean
  skipAnimation?: boolean
  emissionsLabel?: string
  unitLabel: string
  formatNumber: (value?: number, dec?: number) => string
}

const BarChart = ({
  barData,
  seriesData = [],
  title,
  height = 400,
  showTitle = true,
  showLegend = true,
  showLabelsOnBars = true,
  skipAnimation = false,
  emissionsLabel,
  unitLabel,
  formatNumber,
}: Props) => {
  const getBarLabel = (item: { value: number | null }) => {
    if (!showLabelsOnBars || !item.value) {
      return ''
    }
    return formatNumber(item.value)
  }

  return (
    <div className={styles.barChart}>
      <MuiBarChart
        skipAnimation={skipAnimation}
        colors={seriesData.length > 0 ? seriesData.map((series) => series.color) : undefined}
        xAxis={[
          {
            data: barData.labels,
            height: BAR_CHART_CONSTANTS.AXIS_HEIGHT,
            scaleType: 'band',
            tickLabelStyle: {
              angle: BAR_CHART_CONSTANTS.TICK_ANGLE,
              textAnchor: 'end',
              fontSize: BAR_CHART_CONSTANTS.TICK_FONT_SIZE,
            },
            tickPlacement: 'extremities',
            tickLabelPlacement: 'middle',
            colorMap:
              seriesData.length === 0
                ? {
                    type: 'ordinal' as const,
                    values: barData.labels,
                    colors: barData.colors,
                  }
                : undefined,
          },
        ]}
        series={
          seriesData.length > 0
            ? seriesData.map((series, index) => ({
                data: series.data,
                valueFormatter: (value: number | null) => (value && value > 0 ? formatNumber(value, 0) : null),
                label: series.label,
                stack: series.stack,
                color: series.color,
                id: `series-${index}`,
              }))
            : [
                {
                  data: barData.values,
                  valueFormatter: (value: number | null) => formatNumber(value ?? 0, 0),
                  label: showLegend ? emissionsLabel : undefined,
                },
              ]
        }
        grid={{ horizontal: true }}
        yAxis={[{ label: unitLabel }]}
        axisHighlight={{ x: 'none' }}
        barLabel={showLabelsOnBars ? getBarLabel : undefined}
        slots={showLegend && seriesData.length === 0 ? undefined : { legend: () => null }}
        height={height}
        borderRadius={10}
      />
      {showTitle && (
        <Typography variant="h6" align="center" className={styles.chartTitle}>
          {title}
        </Typography>
      )}
    </div>
  )
}

export default BarChart
