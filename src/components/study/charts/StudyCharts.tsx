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
import { axisClasses } from '@mui/x-charts/ChartsAxis'
import { pieArcLabelClasses } from '@mui/x-charts/PieChart'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

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
  height = 450,
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

  const listCutPosts = useListPosts() as CutPost[]
  const computeResults = useComputedResults(resultsByPost, tPost, listCutPosts)
  const { pieData, barData } = useChartData(computeResults, theme)

  const chartFormatter = (value: number | null) => {
    const safeValue = value ?? 0
    const unit = study.resultsUnit
    return `${formatNumber(safeValue / STUDY_UNIT_VALUES[unit], 2)} ${tUnits(unit)}`
  }

  const barChartSettings = {
    height,
    sx: {
      [`.${axisClasses.left} .${axisClasses.label}`]: { transform: 'translate(-1rem, 0)' },
      backgroundColor: '#fff',
      '& .MuiChartsAxis-tick': {
        stroke: '#333',
      },
      '& .MuiChartsAxis-line': {
        stroke: '#333',
      },
      '& text': {
        fill: '#333 !important',
        fontSize: '16px !important',
      },
      // Styles pour les labels des barres
      '& .MuiBarLabel-root': {
        fontSize: '16px !important',
        fontWeight: 'bold !important',
      },
    },
    borderRadius: 10,
  }

  const pieChartSettings = {
    height,
    sx: {
      backgroundColor: '#fff',
      '& text': {
        fill: '#333 !important',
        fontSize: '16px !important',
      },
      // Styles pour les labels des arcs
      [`& .${pieArcLabelClasses.root}`]: {
        fontSize: '16px !important',
        fontWeight: 'bold !important',
      },
    },
  }

  if (type === 'bar') {
    return (
      <div>
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
                valueFormatter: chartFormatter,
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
            {...barChartSettings}
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
      <div>
        {pieData.length !== 0 ? (
          <PieChart
            series={[
              {
                data: pieData,
                valueFormatter: ({ value }) => chartFormatter(value),
                arcLabel: showLabelsOnPie ? (item) => chartFormatter(item.value) : undefined,
                arcLabelMinAngle: 35,
                innerRadius: 0,
                outerRadius: 200,
              },
            ]}
            {...pieChartSettings}
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

  return null
}

export default StudyCharts
