'use client'

import { formatValueAndUnit } from '@/utils/charts'
import { isPost } from '@/utils/post'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import { Typography, useTheme } from '@mui/material'
import { PieChart as MuiPieChart, PieChartProps } from '@mui/x-charts'
import { StudyResultUnit } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useCallback, useMemo } from 'react'
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

const PieChart = <T extends { value: number; label?: string; post?: string; color?: string }>({
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

  const getColor = useCallback(
    (post?: string, color?: string) => {
      if (color) {
        return color
      }
      if (post && isPost(post)) {
        return theme.custom.postColors[post].light
      }
      return theme.palette.primary.light
    },
    [theme.custom.postColors, theme.palette.primary.light],
  )

  const getLabel = useCallback(
    (convertedValue: number, label?: string, post?: string) => {
      let formattedLabel = ''
      if (label) {
        formattedLabel = label
      } else if (post && isPost(post)) {
        formattedLabel = tPost(post)
      }

      return `${formattedLabel} - ${formatValueAndUnit(convertedValue, tUnits(resultsUnit))}`
    },
    [resultsUnit, tPost, tUnits],
  )

  const pieData = useMemo(
    () =>
      results
        .map(({ value, label, post, color }) => {
          const convertedValue = value / STUDY_UNIT_VALUES[resultsUnit]

          return {
            label: getLabel(convertedValue, label, post),
            value: convertedValue,
            color: getColor(post, color),
          }
        })
        .filter((computeResult) => computeResult.value > 0),
    [getColor, getLabel, results, resultsUnit],
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
