'use client'

import { BarChart as UiBarChart } from '@abc-transitionbascarbone/ui'
import { useTheme } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

import { BasicTypeCharts, processBarChartData } from '@/utils/charts'
import { StudyResultUnit } from '@abc-transitionbascarbone/db-common'
import { formatNumber } from '@abc-transitionbascarbone/utils/number'

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
}: Props<T>) => {
  const tResults = useTranslations('study.results')
  const tUnits = useTranslations('study.results.units')
  const tPost = useTranslations('emissionFactors.post')
  const theme = useTheme()

  const { barData, seriesData } = useMemo(() => {
    return processBarChartData(results, type, showSubLevel, theme, resultsUnit, tPost)
  }, [results, type, showSubLevel, theme, resultsUnit, tPost])

  return (
    <UiBarChart
      barData={barData}
      seriesData={seriesData}
      title={title}
      height={height}
      showTitle={showTitle}
      showLegend={showLegend}
      showLabelsOnBars={showLabelsOnBars}
      skipAnimation={skipAnimation}
      emissionsLabel={tResults('emissions')}
      unitLabel={tUnits(resultsUnit)}
      formatNumber={formatNumber}
    />
  )
}

export default BarChart
