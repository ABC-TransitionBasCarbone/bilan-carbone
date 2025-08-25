'use client'

import { Typography, useTheme } from '@mui/material'
import { BarChart as MuiBarChart } from '@mui/x-charts'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import styles from './BarChart.module.css'

import { BasicTypeCharts, formatValueAndUnit, getColor, getLabel } from '@/utils/charts'
import { STUDY_UNIT_VALUES } from '@/utils/study'
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
}: Props<T>) => {
  const tResults = useTranslations('study.results')
  const tUnits = useTranslations('study.results.units')
  const tPost = useTranslations('emissionFactors.post')

  const theme = useTheme()

  const barData = useMemo(() => {
    const filteredData = results.filter((result) => result.post !== 'total' && result.label !== 'total')
    return {
      labels: filteredData.map(({ label, post }) => getLabel(label, post, tPost)),
      values: filteredData.map(({ value }) => value / STUDY_UNIT_VALUES[resultsUnit]),
      colors: filteredData.map(({ post, color }) => getColor(theme, post, color)),
    }
  }, [results, tPost, resultsUnit, theme])

  console.log('BarData:', barData)
  const getBarLabel = (item: { value: number | null }) =>
    showLabelsOnBars && item.value && item.value > 0 ? formatValueAndUnit(item.value) : ''

  return (
    <div className={styles.barChart}>
      <MuiBarChart
        skipAnimation={skipAnimation}
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
            colorMap: {
              type: 'ordinal',
              values: barData.labels,
              colors: barData.colors,
            },
          },
        ]}
        series={[
          {
            data: barData.values,
            valueFormatter: (value) => formatValueAndUnit(value ?? 0),
            label: showLegend ? tResults('emissions') : undefined,
          },
        ]}
        grid={{ horizontal: true }}
        yAxis={[
          {
            label: tUnits(resultsUnit),
          },
        ]}
        axisHighlight={{ x: 'none' }}
        barLabel={showLabelsOnBars ? getBarLabel : undefined}
        slots={showLegend ? undefined : { legend: () => null }}
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
