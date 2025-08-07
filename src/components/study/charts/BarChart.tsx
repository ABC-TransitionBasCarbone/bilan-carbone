'use client'

import { FullStudy } from '@/db/study'
import { useChartComputations } from '@/hooks/useChartComputations'
import { Typography, useTheme } from '@mui/material'
import { BarChart as MuiBarChart } from '@mui/x-charts'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import styles from './BarChart.module.css'

import { BCPost, CutPost } from '@/services/posts'
import { isPost } from '@/utils/post'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import { Environment } from '@prisma/client'

const BAR_CHART_CONSTANTS = {
  TICK_ANGLE: -20,
  TICK_FONT_SIZE: 10,
  AXIS_HEIGHT: 80,
} as const

interface Props {
  study: FullStudy
  studySite?: string
  title?: string
  height?: number
  showTitle?: boolean
  showLegend?: boolean
  showLabelsOnBars?: boolean
  validatedOnly?: boolean
  postValues: typeof CutPost | typeof BCPost
  fixedColor?: boolean
  environment: Environment | undefined
  skipAnimation?: boolean
}

const BarChart = ({
  study,
  studySite = 'all',
  title,
  height = 400,
  showTitle = true,
  showLegend = true,
  showLabelsOnBars = true,
  validatedOnly = false,
  postValues,
  fixedColor,
  environment,
  skipAnimation = false,
}: Props) => {
  const tResults = useTranslations('study.results')
  const theme = useTheme()

  const { chartFormatter, computeResults, tUnits } = useChartComputations({
    study,
    studySite,
    validatedOnly,
    postValues,
    environment,
  })

  const barData = useMemo(
    () => ({
      labels: computeResults.map(({ label }) => label),
      values: computeResults.map(({ value }) => value / STUDY_UNIT_VALUES[study.resultsUnit]),
      colors: computeResults.map(({ post }) =>
        fixedColor
          ? theme.palette.secondary.main
          : isPost(post)
            ? theme.custom.postColors[post].light
            : theme.palette.primary.light,
      ),
    }),
    [
      computeResults,
      fixedColor,
      theme.custom.postColors,
      theme.palette.primary.light,
      theme.palette.secondary.main,
      study.resultsUnit,
    ],
  )

  const getBarLabel = (item: { value: number | null }) =>
    showLabelsOnBars && item.value && item.value > 0 ? chartFormatter(item.value) : ''

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
            valueFormatter: (value) => chartFormatter(value ?? 0, false),
            label: showLegend ? tResults('emissions') : undefined,
          },
        ]}
        grid={{ horizontal: true }}
        yAxis={[
          {
            label: tUnits(study.resultsUnit),
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
