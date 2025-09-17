'use client'

import { BasicTypeCharts, formatValueAndUnit, getChildColor, getParentColor } from '@/utils/charts'
import { formatNumber } from '@/utils/number'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import { Typography, useMediaQuery, useTheme } from '@mui/material'
import { PieChart as MuiPieChart, PieChartProps } from '@mui/x-charts'
import { StudyResultUnit } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useCallback, useMemo } from 'react'
import styles from './PieChart.module.css'

const PIE_CHART_CONSTANTS = {
  INNER_RING: {
    INNER_RADIUS: 0,
    OUTER_RADIUS: 120,
    ARC_LABEL_RADIUS: 60,
    ARC_LABEL_MIN_ANGLE: 35,
  },
  OUTER_RING: {
    INNER_RADIUS: 140,
    OUTER_RADIUS: 170,
    ARC_LABEL_RADIUS: 195,
    ARC_LABEL_MIN_ANGLE: 10,
  },
} as const

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
  const noSpaceForLegend = useMediaQuery(theme.breakpoints.between('lg', 'xl')) && type === 'tag'

  const formatParentData = useCallback(
    (item: T, index?: number) => {
      const convertedValue = item.value / STUDY_UNIT_VALUES[resultsUnit]

      return {
        label: item.label,
        value: convertedValue,
        color: getParentColor(type, theme, item, index),
      }
    },
    [theme, resultsUnit, type],
  )

  const formatChildData = useCallback(
    (child: Omit<BasicTypeCharts, 'children'>) => {
      const convertedValue = child.value / STUDY_UNIT_VALUES[resultsUnit]

      return {
        label: child.label,
        value: convertedValue,
        color: getChildColor(type, theme, child),
      }
    },
    [theme, resultsUnit, type],
  )

  const { innerRingData, outerRingData } = useMemo(() => {
    if (type === 'tag' && !showSubLevel) {
      const childrenData = results
        .flatMap((result) => result.children)
        .map((child) => formatChildData(child))
        .filter((computeResult) => computeResult.value > 0)
      return { innerRingData: childrenData, outerRingData: [] }
    }

    const filteredResults = results.filter((result) => result.post !== 'total' && result.label !== 'total')
    const innerData = filteredResults
      .map((result, index) => formatParentData(result, index))
      .filter((computeResult) => computeResult.value > 0)

    if (!showSubLevel) {
      return { innerRingData: innerData, outerRingData: [] }
    }

    const outerData: Array<{ label: string; value: number; color: string }> = []

    filteredResults.forEach((result) => {
      if (result.children && result.children.length > 0) {
        result.children.forEach((child) => {
          const formattedChild = formatChildData(child)
          if (formattedChild.value > 0) {
            outerData.push(formattedChild)
          }
        })
      }
    })

    return { innerRingData: innerData, outerRingData: outerData }
  }, [type, showSubLevel, results, formatChildData, formatParentData])

  const series = useMemo(() => {
    const seriesArray = []

    if (innerRingData.length > 0) {
      seriesArray.push({
        data: innerRingData,
        arcLabel: showLabelsOnPie ? (item: { value: number }) => formatNumber(item.value, 2) : undefined,
        arcLabelMinAngle: PIE_CHART_CONSTANTS.INNER_RING.ARC_LABEL_MIN_ANGLE,
        arcLabelRadius: PIE_CHART_CONSTANTS.INNER_RING.ARC_LABEL_RADIUS,
        innerRadius: PIE_CHART_CONSTANTS.INNER_RING.INNER_RADIUS,
        outerRadius: PIE_CHART_CONSTANTS.INNER_RING.OUTER_RADIUS,
        valueFormatter: (item: { value: number }) => formatValueAndUnit(item.value, tUnits(resultsUnit)),
      })
    }

    if (outerRingData.length > 0) {
      seriesArray.push({
        data: outerRingData,
        arcLabel: showLabelsOnPie ? (item: { value: number }) => formatNumber(item.value, 2) : undefined,
        arcLabelMinAngle: PIE_CHART_CONSTANTS.OUTER_RING.ARC_LABEL_MIN_ANGLE,
        arcLabelRadius: PIE_CHART_CONSTANTS.OUTER_RING.ARC_LABEL_RADIUS,
        innerRadius: PIE_CHART_CONSTANTS.OUTER_RING.INNER_RADIUS,
        outerRadius: PIE_CHART_CONSTANTS.OUTER_RING.OUTER_RADIUS,
        valueFormatter: (item: { value: number }) => formatValueAndUnit(item.value, tUnits(resultsUnit)),
      })
    }

    return seriesArray
  }, [innerRingData, outerRingData, showLabelsOnPie, tUnits, resultsUnit])

  const legendData = useMemo(() => {
    return innerRingData.map((item) => ({
      label: item.label,
      color: item.color,
    }))
  }, [innerRingData])

  return (
    <div className={styles.pieChart}>
      <div className={styles.chartContainer}>
        <MuiPieChart series={series} height={height} hideLegend {...pieChartProps} />
        {legendData.length > 0 && !noSpaceForLegend && (
          <div className={styles.legend}>
            {legendData.map((item, index) => (
              <div key={index} className={styles.legendItem}>
                <div className={styles.legendColor} style={{ backgroundColor: item.color }} />
                <Typography variant="body2" className={styles.legendLabel}>
                  {item.label}
                </Typography>
              </div>
            ))}
          </div>
        )}
      </div>
      {showTitle && (
        <Typography variant="h6" align="center" className={styles.chartTitle}>
          {title}
        </Typography>
      )}
    </div>
  )
}

export default PieChart
