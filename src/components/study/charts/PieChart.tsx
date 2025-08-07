'use client'

import { FullStudy } from '@/db/study'
import { useChartComputations } from '@/hooks/useChartComputations'
import { BCPost, CutPost, Post } from '@/services/posts'
import { isPost } from '@/utils/post'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import { Typography, useTheme } from '@mui/material'
import { PieChart as MuiPieChart } from '@mui/x-charts'
import { Environment } from '@prisma/client'
import { useMemo } from 'react'
import styles from './PieChart.module.css'

const PIE_CHART_CONSTANTS = {
  ARC_LABEL_MIN_ANGLE: 10,
  ARC_LABEL_RADIUS: '80%',
  PIE_OUTER_RADIUS: 200,
  PIE_INNER_RADIUS: 0,
} as const

interface Props {
  study: FullStudy
  studySite?: string
  title?: string
  height?: number
  showTitle?: boolean
  showLabelsOnPie?: boolean
  validatedOnly?: boolean
  postValues: typeof Post | typeof CutPost | typeof BCPost
  environment: Environment | undefined
  skipAnimation?: boolean
}

const PieChart = ({
  study,
  studySite = 'all',
  title,
  height = 400,
  showTitle = true,
  showLabelsOnPie = true,
  validatedOnly = false,
  postValues,
  environment,
  skipAnimation = false,
}: Props) => {
  const theme = useTheme()

  const { chartFormatter, computeResults } = useChartComputations({
    study,
    studySite,
    validatedOnly,
    postValues,
    environment,
  })

  const pieData = useMemo(
    () =>
      computeResults
        .map(({ label, value, post }) => {
          const convertedValue = value / STUDY_UNIT_VALUES[study.resultsUnit]
          return {
            label: `${label} - ${chartFormatter(convertedValue)}`,
            value: convertedValue,
            color: isPost(post) ? theme.custom.postColors[post].light : theme.palette.primary.light,
          }
        })
        .filter((computeResult) => computeResult.value > 0),
    [computeResults, theme, chartFormatter, study.resultsUnit],
  )

  return (
    <div className={styles.pieChart}>
      <MuiPieChart
        series={[
          {
            data: pieData,
            arcLabel: showLabelsOnPie ? (item) => chartFormatter(item.value, false) : undefined,
            arcLabelMinAngle: PIE_CHART_CONSTANTS.ARC_LABEL_MIN_ANGLE,
            arcLabelRadius: PIE_CHART_CONSTANTS.ARC_LABEL_RADIUS,
            innerRadius: PIE_CHART_CONSTANTS.PIE_INNER_RADIUS,
            outerRadius: PIE_CHART_CONSTANTS.PIE_OUTER_RADIUS,
          },
        ]}
        height={height}
        skipAnimation={skipAnimation}
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
