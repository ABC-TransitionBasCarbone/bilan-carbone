'use client'

import { FullStudy } from '@/db/study'
import { useChartData, useComputedResults } from '@/hooks/useComputedResults'
import { useListPosts } from '@/hooks/useListPosts'
import { CutPost } from '@/services/posts'
import { computeResultsByPost } from '@/services/results/consolidated'
import { formatNumber } from '@/utils/number'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import { Typography, useTheme } from '@mui/material'
import { BarChart, PieChart } from '@mui/x-charts'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import styles from './StudyCharts.module.css'

interface Props {
  study: FullStudy
  studySite?: string
  type: 'bar' | 'pie'
  title?: string
  height?: number
  showTitle?: boolean
  showLegend?: boolean
  showLabelsOnBars?: boolean
  showLabelsOnPie?: boolean
  validatedOnly?: boolean
}

const StudyCharts = ({
  study,
  studySite = 'all',
  type,
  title,
  height = 400,
  showTitle = true,
  showLegend = true,
  showLabelsOnBars = true,
  showLabelsOnPie = true,
  validatedOnly = false,
}: Props) => {
  const tPost = useTranslations('emissionFactors.post')
  const tUnits = useTranslations('study.results.units')
  const tResults = useTranslations('study.results')
  const theme = useTheme()

  const resultsByPost = useMemo(
    () => computeResultsByPost(study, tPost, studySite, true, validatedOnly, CutPost),
    [study, studySite, tPost, validatedOnly],
  )

  const chartFormatter = (value: number | null, showUnit = true) => {
    const safeValue = value ?? 0
    const unit = showUnit ? tUnits(study.resultsUnit) : ''
    return `${formatNumber(safeValue / STUDY_UNIT_VALUES[study.resultsUnit], 2)} ${unit}`
  }

  const listCutPosts = useListPosts() as CutPost[]
  const computeResults = useComputedResults(resultsByPost, tPost, listCutPosts)
  const { pieData, barData } = useChartData(computeResults, theme)

  const enhancedPieData = pieData.map((item) => ({
    ...item,
    label: `${item.label} - ${chartFormatter(item.value)}`,
  }))

  if (type === 'bar') {
    return (
      <div className={styles.barChart}>
        {barData.values.length !== 0 && barData.values.some((v) => v !== 0) ? (
          <BarChart
            xAxis={[
              {
                data: barData.labels,
                height: 80,
                scaleType: 'band',
                tickLabelStyle: { angle: -20, textAnchor: 'end', fontSize: 10 },
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
                valueFormatter: (value) => chartFormatter(value, false),
                label: showLegend ? 'Émissions' : undefined,
              },
            ]}
            grid={{ horizontal: true }}
            yAxis={[{ label: tUnits(study.resultsUnit) }]}
            axisHighlight={{ x: 'none' }}
            barLabel={
              showLabelsOnBars ? (item) => (item.value && item.value > 0 ? chartFormatter(item.value) : '') : undefined
            }
            slots={showLegend ? undefined : { legend: () => null }}
            height={height}
          />
        ) : (
          <Typography align="center">{tResults('noData')}</Typography>
        )}
        {showTitle && (
          <Typography variant="h6" align="center" sx={{ fontSize: '1rem', mt: -4, mb: 4 }}>
            {title}
          </Typography>
        )}
      </div>
    )
  }

  if (type === 'pie') {
    return (
      <div className={styles.pieChart}>
        {enhancedPieData.length !== 0 ? (
          <PieChart
            series={[
              {
                data: enhancedPieData,
                arcLabel: showLabelsOnPie ? (item) => chartFormatter(item.value, false) : undefined,
                arcLabelMinAngle: 10,
                arcLabelRadius: '80%',
                innerRadius: 0,
                outerRadius: 200,
              },
            ]}
            height={height}
          />
        ) : (
          <Typography align="center">{tResults('noData')}</Typography>
        )}
        {showTitle && (
          <Typography variant="h6" align="center" className={styles.chartTitle}>
            {title}
          </Typography>
        )}
      </div>
    )
  }

  if (type === 'pie') {
    return (
      <div className={styles.pieChart}>
        {enhancedPieData.length !== 0 ? (
          <PieChart
            series={[
              {
                data: enhancedPieData,
                arcLabel: showLabelsOnPie ? (item) => chartFormatter(item.value, false) : undefined,
                arcLabelMinAngle: 10,
                arcLabelRadius: '80%',
                innerRadius: 0,
                outerRadius: 200,
              },
            ]}
            height={height}
          />
        ) : (
          <Typography align="center">{tResults('noData')}</Typography>
        )}
        {showTitle && (
          <Typography variant="h6" align="center" className={styles.chartTitle}>
            {title}
          </Typography>
        )}
      </div>
    )
  }

  return null
}

export default StudyCharts
