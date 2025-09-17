'use client'

import { Typography, useTheme } from '@mui/material'
import { BarChart as MuiBarChart } from '@mui/x-charts'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import styles from './BarChart.module.css'

import { BasicTypeCharts, formatValueAndUnit, getChildColor, getLabel, getParentColor } from '@/utils/charts'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import { StudyResultUnit } from '@prisma/client'

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
  const isTag = type === 'tag'
  const theme = useTheme()

  const { barData, seriesData } = useMemo(() => {
    const filteredData = results.filter((result) => result.post !== 'total' && result.label !== 'total')

    if (!showSubLevel) {
      // For tags, if showSubLevel is false, we only show the children tags and not the tag parents
      const data = isTag ? filteredData.flatMap((result) => result.children) : filteredData
      return {
        barData: {
          labels: data.map((item) => getLabel(type, item, tPost)),
          values: data.map(({ value }) => value / STUDY_UNIT_VALUES[resultsUnit]),
          colors: data.map((item, index) =>
            isTag ? getChildColor(type, theme, item) : getParentColor(type, theme, item, index),
          ),
        },
        seriesData: [],
      }
    }

    const parentLabels = filteredData.map((item) => getLabel(type, item, tPost))

    const seriesData = filteredData.reduce(
      (acc, parent, parentIndex) => {
        parent.children.forEach((child) => {
          if (child.value > 0) {
            const existingSeries = acc.find((series) => series.label === child.label)
            const value = child.value / STUDY_UNIT_VALUES[resultsUnit]

            if (existingSeries) {
              existingSeries.data[parentIndex] = value
            } else {
              const data = new Array(filteredData.length).fill(0)
              data[parentIndex] = value
              acc.push({
                label: child.label,
                data,
                color: getChildColor(type, theme, child),
                stack: 'sublevel',
              })
            }
          }
        })
        return acc
      },
      [] as Array<{ label: string; data: number[]; color: string; stack: string }>,
    )

    return {
      barData: { labels: parentLabels, values: [], colors: [] },
      seriesData,
    }
  }, [results, showSubLevel, isTag, type, tPost, resultsUnit, theme])

  const getBarLabel = (item: { value: number | null }) => (showLabelsOnBars ? formatValueAndUnit(item.value) : '')

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
