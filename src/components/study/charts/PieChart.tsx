'use client'

import { formatValueAndUnit } from '@/utils/charts'
import { isPost } from '@/utils/post'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import { Typography, useTheme } from '@mui/material'
import { PieChart as MuiPieChart, PieChartProps } from '@mui/x-charts'
import { StudyResultUnit } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import styles from './PieChart.module.css'

const PIE_CHART_CONSTANTS = {
  ARC_LABEL_MIN_ANGLE: 10,
  ARC_LABEL_RADIUS: '80%',
  PIE_OUTER_RADIUS: 200,
  PIE_INNER_RADIUS: 0,
} as const

interface Props<T> extends Omit<PieChartProps, 'series'> {
  resultsUnit: StudyResultUnit
  results: T[]
  title?: string
  height?: number
  showTitle?: boolean
  showLabelsOnPie?: boolean
}

const PieChart = <T extends { value: number; label: string }>({
  resultsUnit,
  results,
  title,
  height = 400,
  showTitle = true,
  showLabelsOnPie = true,
  ...pieChartProps
}: Props<T>) => {
  const tPost = useTranslations('emissionFactors.post')
  const tUnits = useTranslations('study.results.units')

  const theme = useTheme()

  const pieData = useMemo(
    () =>
      results
        .map(({ value, label }) => {
          const convertedValue = value / STUDY_UNIT_VALUES[resultsUnit]
          return {
            label: `${tPost(label)} - ${formatValueAndUnit(convertedValue, tUnits(resultsUnit))}`,
            value: convertedValue,
            color: isPost(label) ? theme.custom.postColors[label].light : theme.palette.primary.light,
          }
        })
        .filter((computeResult) => computeResult.value > 0),
    [results, resultsUnit, tPost, tUnits, theme.custom.postColors, theme.palette.primary.light],
  )

  return (
    <div className={styles.pieChart}>
      <MuiPieChart
        series={[
          {
            data: pieData,
            arcLabel: showLabelsOnPie ? (item) => formatValueAndUnit(item.value) : undefined,
            arcLabelMinAngle: PIE_CHART_CONSTANTS.ARC_LABEL_MIN_ANGLE,
            arcLabelRadius: PIE_CHART_CONSTANTS.ARC_LABEL_RADIUS,
            innerRadius: PIE_CHART_CONSTANTS.PIE_INNER_RADIUS,
            outerRadius: PIE_CHART_CONSTANTS.PIE_OUTER_RADIUS,
          },
        ]}
        height={height}
        {...pieChartProps}
      />
      {showTitle && (
        <Typography variant="h6" align="center" className={styles.chartTitle}>
          {title}
        </Typography>
      )}
    </div>
  )
}

export default PieChart
