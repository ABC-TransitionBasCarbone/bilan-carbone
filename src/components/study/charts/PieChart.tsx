'use client'

import { BasicTypeCharts, formatValueAndUnit, processPieChartData } from '@/utils/charts'
import { formatNumber } from '@/utils/number'
import { Typography, useMediaQuery, useTheme } from '@mui/material'
import { PieChart as MuiPieChart, PieChartProps } from '@mui/x-charts'
import { StudyResultUnit } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
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

  const { innerRingData, outerRingData } = useMemo(() => {
    return processPieChartData(results, type, showSubLevel, theme, resultsUnit)
  }, [type, showSubLevel, results, theme, resultsUnit])

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
      <div className={classNames('flex-cc', 'gapped2')}>
        <MuiPieChart series={series} height={height} hideLegend {...pieChartProps} />
        {legendData.length > 0 && !noSpaceForLegend && (
          <div className={classNames('flex-col', 'pr2')}>
            {legendData.map((item, index) => (
              <div key={index} className={classNames('align-center', 'gapped1', 'py025')}>
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
