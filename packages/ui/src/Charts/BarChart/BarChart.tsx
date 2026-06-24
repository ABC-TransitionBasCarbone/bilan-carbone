'use client'

import { Typography } from '@mui/material'
import { BarChart as MuiXBarChart, ChartsReferenceLine } from '@mui/x-charts'
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
  targetValue?: number
  unitLabel: string
  formatNumber: (value?: number, dec?: number) => string
}

const UiBarChart = ({
  barData,
  seriesData = [],
  title,
  height = 400,
  showTitle = true,
  showLegend = true,
  showLabelsOnBars = true,
  skipAnimation = false,
  emissionsLabel,
  targetValue,
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
      <MuiXBarChart
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
              barLabel: showLabelsOnBars ? getBarLabel : undefined,
            }))
            : [
              {
                data: barData.values,
                valueFormatter: (value: number | null) => formatNumber(value ?? 0, 0),
                label: showLegend ? emissionsLabel : undefined,
                barLabel: showLabelsOnBars ? getBarLabel : undefined,
              },
            ]
        }
        grid={{ horizontal: true }}
        yAxis={[{ label: unitLabel }]}
        axisHighlight={{ x: 'none' }}
        slots={showLegend && seriesData.length === 0 ? undefined : { legend: () => null }}
        height={height}
        borderRadius={10}
      >
        {typeof targetValue === 'number' && (
          <ChartsReferenceLine
            y={targetValue}
            lineStyle={{ stroke: '#ef4444', strokeDasharray: '6 4', strokeWidth: 2 }}
            label={`Objectif: ${formatNumber(targetValue, 0)}`}
            labelAlign="end"
          />
        )}
      </MuiXBarChart>
      {showTitle && (
        <Typography variant="h6" align="center" className={styles.chartTitle}>
          {title}
        </Typography>
      )}
    </div>
  )
}

export default UiBarChart
