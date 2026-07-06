'use client'

import { StudyResultUnit } from '@abc-transitionbascarbone/db-common'
import { Typography, useMediaQuery, useTheme } from '@mui/material'
import { PieChart as MuiPieChart, PieChartProps } from '@mui/x-charts'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { formatNumber } from '@abc-transitionbascarbone/utils/number'
import { BasicTypeCharts, formatValueAndUnit, processPieChartData } from '@abc-transitionbascarbone/utils/charts'
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
  tooltipValueFormatter?: (item: { label: string; value: number }) => string
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
  tooltipValueFormatter,
  ...pieChartProps
}: Props<T>) => {
  const tUnits = useTranslations('study.results.units')
  const theme = useTheme()
  const noSpaceForLegend = useMediaQuery(theme.breakpoints.between('lg', 'xl')) && type === 'tag'

  const { innerRingData, outerRingData } = useMemo(() => {
    return processPieChartData(results, type, showSubLevel, theme, resultsUnit)
  }, [type, showSubLevel, results, theme, resultsUnit])

  const valueFormatter = useMemo(
    () => (item: { value: number; label?: string | ((location: 'legend' | 'tooltip' | 'arc') => string) }) =>
      tooltipValueFormatter
        ? tooltipValueFormatter({ label: typeof item.label === 'string' ? item.label : '', value: item.value })
        : formatValueAndUnit(item.value, tUnits(resultsUnit), 0),
    [tooltipValueFormatter, tUnits, resultsUnit],
  )

  const arcLabel = showLabelsOnPie ? (item: { value: number }) => formatNumber(item.value, 0) : undefined

  const series = useMemo(() => {
    const rings = [
      { data: innerRingData, constants: PIE_CHART_CONSTANTS.INNER_RING },
      { data: outerRingData, constants: PIE_CHART_CONSTANTS.OUTER_RING },
    ]

    return rings
      .filter(({ data }) => data.length > 0)
      .map(({ data, constants }) => ({
        data,
        arcLabel,
        arcLabelMinAngle: constants.ARC_LABEL_MIN_ANGLE,
        arcLabelRadius: constants.ARC_LABEL_RADIUS,
        innerRadius: constants.INNER_RADIUS,
        outerRadius: constants.OUTER_RADIUS,
        valueFormatter,
      }))
  }, [innerRingData, outerRingData, arcLabel, valueFormatter])

  const legendData = useMemo(() => {
    const maxLabelLength = type === 'tag' ? 20 : 50
    return innerRingData.map((item) => ({
      label: item.label.length > maxLabelLength ? item.label.substring(0, 20) + '...' : item.label,
      color: item.color,
    }))
  }, [innerRingData, type])

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
