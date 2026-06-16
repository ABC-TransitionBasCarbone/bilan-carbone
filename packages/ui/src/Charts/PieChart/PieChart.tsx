'use client'

import { Typography, useMediaQuery, useTheme } from '@mui/material'
import { PieChart as MuiPieChart, PieChartProps } from '@mui/x-charts'
import { useMemo } from 'react'
import styles from './PieChart.module.css'
import { ProcessedChartData } from '../types'

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

interface Props extends Omit<PieChartProps, 'series'> {
  innerRingData: ProcessedChartData[]
  outerRingData?: ProcessedChartData[]
  unitLabel: string
  title?: string
  height?: number
  showTitle?: boolean
  showLabelsOnPie?: boolean
  type?: 'post' | 'tag'
  formatNumber: (value?: number, dec?: number) => string
  formatValueAndUnit: (value: number | null, unit: string, dec?: number) => string
}

const PieChart = ({
  innerRingData,
  outerRingData = [],
  unitLabel,
  title,
  height = 400,
  showTitle = true,
  showLabelsOnPie = true,
  type = 'post',
  formatNumber,
  formatValueAndUnit,
  ...pieChartProps
}: Props) => {
  const theme = useTheme()
  const noSpaceForLegend = useMediaQuery(theme.breakpoints.between('lg', 'xl')) && type === 'tag'

  const series = useMemo(() => {
    const seriesArray = []

    if (innerRingData.length > 0) {
      seriesArray.push({
        data: innerRingData,
        arcLabel: showLabelsOnPie ? (item: { value: number }) => formatNumber(item.value, 0) : undefined,
        arcLabelMinAngle: PIE_CHART_CONSTANTS.INNER_RING.ARC_LABEL_MIN_ANGLE,
        arcLabelRadius: PIE_CHART_CONSTANTS.INNER_RING.ARC_LABEL_RADIUS,
        innerRadius: PIE_CHART_CONSTANTS.INNER_RING.INNER_RADIUS,
        outerRadius: PIE_CHART_CONSTANTS.INNER_RING.OUTER_RADIUS,
        valueFormatter: (item: { value: number }) => formatValueAndUnit(item.value, unitLabel, 0),
      })
    }

    if (outerRingData.length > 0) {
      seriesArray.push({
        data: outerRingData,
        arcLabel: showLabelsOnPie ? (item: { value: number }) => formatNumber(item.value, 0) : undefined,
        arcLabelMinAngle: PIE_CHART_CONSTANTS.OUTER_RING.ARC_LABEL_MIN_ANGLE,
        arcLabelRadius: PIE_CHART_CONSTANTS.OUTER_RING.ARC_LABEL_RADIUS,
        innerRadius: PIE_CHART_CONSTANTS.OUTER_RING.INNER_RADIUS,
        outerRadius: PIE_CHART_CONSTANTS.OUTER_RING.OUTER_RADIUS,
        valueFormatter: (item: { value: number }) => formatValueAndUnit(item.value, unitLabel, 0),
      })
    }

    return seriesArray
  }, [innerRingData, outerRingData, showLabelsOnPie, formatNumber, formatValueAndUnit, unitLabel])

  const legendData = useMemo(() => {
    const maxLabelLength = type === 'tag' ? 20 : 50
    return innerRingData.map((item) => ({
      label: item.label.length > maxLabelLength ? item.label.substring(0, 20) + '...' : item.label,
      color: item.color,
    }))
  }, [innerRingData, type])

  return (
    <div className={styles.pieChart}>
      <div className="flex-cc gapped2">
        <MuiPieChart series={series} height={height} hideLegend {...pieChartProps} />
        {legendData.length > 0 && !noSpaceForLegend && (
          <div className="flex-col pr2">
            {legendData.map((item, index) => (
              <div key={index} className="align-center gapped1 py025">
                <svg viewBox="0 0 12 12" className={styles.legendColor} aria-hidden="true">
                  <circle cx="6" cy="6" r="6" fill={item.color} />
                </svg>
                <Typography variant="body2">{item.label}</Typography>
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
