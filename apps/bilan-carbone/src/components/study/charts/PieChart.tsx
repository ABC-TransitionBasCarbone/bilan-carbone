'use client'

import { BasicTypeCharts, formatValueAndUnit, processPieChartData } from '@/utils/charts'
import { StudyResultUnit } from '@abc-transitionbascarbone/db-common'
import { PieChart as UiPieChart } from '@abc-transitionbascarbone/ui'
import { formatNumber } from '@abc-transitionbascarbone/utils/number'
import { useTheme } from '@mui/material'
import { PieChartProps } from '@mui/x-charts'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

interface Props<T> extends Omit<PieChartProps, 'series'> {
  resultsUnit: StudyResultUnit
  results: T[]
  title?: string
  height?: number
  showTitle?: boolean
  showLabelsOnPie?: boolean
  showSubLevel?: boolean
  type?: 'post' | 'tag'
}

const PieChart = <T extends BasicTypeCharts>({
  resultsUnit,
  results,
  title,
  height = 400,
  showTitle = true,
  showLabelsOnPie = true,
  showSubLevel = false,
  type = 'post',
  ...pieChartProps
}: Props<T>) => {
  const tUnits = useTranslations('study.results.units')
  const theme = useTheme()

  const { innerRingData, outerRingData } = useMemo(() => {
    return processPieChartData(results, type, showSubLevel, theme, resultsUnit)
  }, [type, showSubLevel, results, theme, resultsUnit])

  return (
    <UiPieChart
      innerRingData={innerRingData}
      outerRingData={outerRingData}
      unitLabel={tUnits(resultsUnit)}
      title={title}
      height={height}
      showTitle={showTitle}
      showLabelsOnPie={showLabelsOnPie}
      type={type}
      formatNumber={formatNumber}
      formatValueAndUnit={formatValueAndUnit}
      {...pieChartProps}
    />
  )
}

export default PieChart
