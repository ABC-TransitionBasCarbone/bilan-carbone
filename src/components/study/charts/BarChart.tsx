'use client'

import { Typography, useTheme } from '@mui/material'
import { BarChart as MuiBarChart } from '@mui/x-charts'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import styles from './BarChart.module.css'

import { BasicTypeCharts, processBarChartData } from '@/utils/charts'
import { formatNumber } from '@/utils/number'
import { StudyResultUnit } from '@prisma/client'

const BAR_CHART_CONSTANTS = {
  TICK_ANGLE: -20,
  TICK_FONT_SIZE: 10,
  AXIS_HEIGHT: 80,
} as const

interface Props<T> {
  results: T[]
  resultsUnit: StudyResultUnit
  title?: string
  height?: number
  showTitle?: boolean
  showLegend?: boolean
  showLabelsOnBars?: boolean
  skipAnimation?: boolean
  showSubLevel?: boolean
  type?: 'post' | 'tag'
  customOrder?: string[]
}

const BarChart = <T extends BasicTypeCharts>({
  results,
  resultsUnit,
  title,
  height = 400,
  showTitle = true,
  showLegend = true,
  showLabelsOnBars = true,
  skipAnimation = false,
  showSubLevel = false,
  type = 'post',
  customOrder = [],
}: Props<T>) => {
  const tResults = useTranslations('study.results')
  const tUnits = useTranslations('study.results.units')
  const tPost = useTranslations('emissionFactors.post')
  const theme = useTheme()

  const { barData, seriesData } = useMemo(() => {
    return processBarChartData(results, type, showSubLevel, theme, resultsUnit, tPost, customOrder)
  }, [results, type, showSubLevel, theme, resultsUnit, tPost, customOrder])

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
        colors={seriesData.length > 0 ? seriesData.map((s) => s.color) : undefined}
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
                    type: 'ordinal',
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
                valueFormatter: (value) => (value && value > 0 ? formatNumber(value, 0) : null),
                label: series.label,
                stack: series.stack,
                color: series.color,
                id: `series-${index}`,
              }))
            : [
                {
                  data: barData.values,
                  valueFormatter: (value) => formatNumber(value ?? 0, 0),
                  label: showLegend ? tResults('emissions') : undefined,
                },
              ]
        }
        grid={{ horizontal: true }}
        yAxis={[{ label: tUnits(resultsUnit) }]}
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
