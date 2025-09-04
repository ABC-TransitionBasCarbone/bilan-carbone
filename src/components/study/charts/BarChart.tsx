'use client'

import { Typography, useTheme } from '@mui/material'
import { BarChart as MuiBarChart } from '@mui/x-charts'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import styles from './BarChart.module.css'

import { BasicTypeCharts, formatValueAndUnit, getLabel, getPostColor, getSubpostColor } from '@/utils/charts'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import { StudyResultUnit, SubPost } from '@prisma/client'

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
  onlyChildren?: boolean
  showSubLevel?: boolean
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
  onlyChildren = false,
  showSubLevel = false,
}: Props<T>) => {
  const tResults = useTranslations('study.results')
  const tUnits = useTranslations('study.results.units')
  const tPost = useTranslations('emissionFactors.post')

  const theme = useTheme()

  const { barData, seriesData } = useMemo(() => {
    const filteredData = results.filter((result) => result.post !== 'total' && result.label !== 'total')

    if (onlyChildren) {
      const childrenData = filteredData.flatMap((result) => result.children)
      return {
        barData: {
          labels: childrenData.map(({ label, post }) => getLabel(label, post, tPost)),
          values: childrenData.map(({ value }) => value / STUDY_UNIT_VALUES[resultsUnit]),
          colors: childrenData.map(({ post, color }) => getPostColor(theme, post, color)),
        },
        seriesData: [],
      }
    }

    if (!showSubLevel) {
      return {
        barData: {
          labels: filteredData.map(({ label, post }) => getLabel(label, post, tPost)),
          values: filteredData.map(({ value }) => value / STUDY_UNIT_VALUES[resultsUnit]),
          colors: filteredData.map(({ post, color }) => getPostColor(theme, post, color)),
        },
        seriesData: [],
      }
    }

    // Two-level stacked bars - simple approach
    const postLabels = filteredData.map(({ label, post }) => getLabel(label, post, tPost))

    // Collect all unique subpost labels across all posts
    const allSubpostLabels = new Set<string>()
    filteredData.forEach((post) => {
      post.children.forEach((child) => {
        if (child.value > 0) {
          allSubpostLabels.add(child.label)
        }
      })
    })

    // Create one series per unique subpost label
    const series: any[] = []
    Array.from(allSubpostLabels).forEach((subpostLabel) => {
      const data: number[] = []
      let seriesColor = ''

      filteredData.forEach((post) => {
        const subpost = post.children.find((child) => child.label === subpostLabel)
        if (subpost && subpost.value > 0) {
          data.push(subpost.value / STUDY_UNIT_VALUES[resultsUnit])
          if (!seriesColor) {
            seriesColor = getSubpostColor(theme, subpost.post as SubPost)
          }
        } else {
          data.push(0)
        }
      })

      series.push({
        label: subpostLabel,
        data,
        color: seriesColor,
        stack: 'subposts',
      })
    })

    return {
      barData: { labels: postLabels, values: [], colors: [] },
      seriesData: series,
    }
  }, [results, onlyChildren, showSubLevel, tPost, resultsUnit, theme])

  const getBarLabel = (item: { value: number | null }) =>
    showLabelsOnBars && item.value && item.value > 0 ? formatValueAndUnit(item.value) : ''

  return (
    <div className={styles.barChart}>
      <MuiBarChart
        skipAnimation={skipAnimation}
        colors={seriesData.length > 0 ? seriesData.map((s) => s.color) : undefined}
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
            colorMap:
              seriesData.length === 0
                ? {
                    type: 'ordinal',
                    values: barData.labels,
                    colors: barData.colors,
                  }
                : undefined,
          },
        ]}
        series={
          seriesData.length > 0
            ? seriesData.map((series, index) => ({
                data: series.data,
                valueFormatter: (value) => (value && value > 0 ? formatValueAndUnit(value) : null),
                label: series.label,
                stack: series.stack,
                color: series.color,
                id: `series-${index}`,
              }))
            : [
                {
                  data: barData.values,
                  valueFormatter: (value) => formatValueAndUnit(value ?? 0),
                  label: showLegend ? tResults('emissions') : undefined,
                },
              ]
        }
        grid={{ horizontal: true }}
        yAxis={[
          {
            label: tUnits(resultsUnit),
          },
        ]}
        axisHighlight={{ x: 'none' }}
        barLabel={showLabelsOnBars ? getBarLabel : undefined}
        slots={showLegend && seriesData.length === 0 ? undefined : { legend: () => null }}
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
