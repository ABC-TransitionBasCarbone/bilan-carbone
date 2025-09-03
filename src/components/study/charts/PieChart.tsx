'use client'

import { BasicTypeCharts, formatValueAndUnit, getColor } from '@/utils/charts'
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
  onlyChildren?: boolean
}

const PieChart = <T extends BasicTypeCharts>({
  resultsUnit,
  results,
  title,
  height = 400,
  showTitle = true,
  showLabelsOnPie = true,
  onlyChildren = false,
  ...pieChartProps
}: Props<T>) => {
  const tUnits = useTranslations('study.results.units')

  const theme = useTheme()

  const getColorForPie = useCallback((post?: string, color?: string) => getColor(theme, post, color), [theme])
  const formatData = useCallback(
    ({ value, label, post, color }: Pick<T, 'value' | 'label' | 'post' | 'color'>) => {
      const convertedValue = value / STUDY_UNIT_VALUES[resultsUnit]

      return {
        label,
        value: convertedValue,
        color: getColorForPie(post, color),
      }
    },
    [getColorForPie, resultsUnit],
  )

  const pieData = useMemo(() => {
    if (onlyChildren) {
      return results
        .flatMap((result) => result.children)
        .map((result) => formatData(result))
        .filter((computeResult) => computeResult.value > 0)
    }
    return results
      .filter((result) => result.post !== 'total' && result.label !== 'total')
      .map((result) => formatData(result))
      .filter((computeResult) => computeResult.value > 0)
  }, [formatData, onlyChildren, results])

  return (
    <div className={styles.pieChart}>
      <MuiPieChart
        series={[
          {
            data: pieData,
            arcLabel: showLabelsOnPie ? (item) => formatValueAndUnit(item.value, tUnits(resultsUnit)) : undefined,
            arcLabelMinAngle: PIE_CHART_CONSTANTS.ARC_LABEL_MIN_ANGLE,
            arcLabelRadius: PIE_CHART_CONSTANTS.ARC_LABEL_RADIUS,
            innerRadius: PIE_CHART_CONSTANTS.PIE_INNER_RADIUS,
            outerRadius: PIE_CHART_CONSTANTS.PIE_OUTER_RADIUS,
            valueFormatter: (item) => formatValueAndUnit(item.value, tUnits(resultsUnit)),
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
