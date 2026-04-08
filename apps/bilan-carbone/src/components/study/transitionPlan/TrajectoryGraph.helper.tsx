import type { TrajectoryData, TrajectoryDataPoint, TrajectorySeries } from '@/types/trajectory.types'
import { TrajectoryType } from '@prisma/client'

interface BuildTrajectorySeriesParams {
  trajectoryData: TrajectoryData
  label: string
  color: string
  isCustom: boolean
  mapDataToYears: (
    dataPoints: TrajectoryDataPoint[],
    customTrajectory?: boolean,
    isFailed?: boolean,
  ) => (number | null)[]
  studyStartYear: number
  studyStartYearIndex: number
  failedColor?: string
  isCustomTrajectory?: boolean
}

export const formatValue = (value: number | null) => (value !== null ? Math.round(value).toString() : '')

export const getCustomTrajectoryColor = (
  type: TrajectoryType | undefined,
  index: number,
  fallbackColor: string | undefined,
  typeShadeCounters: Partial<Record<TrajectoryType, number>>,
): string => {
  if (!type) {
    return fallbackColor || `var(--trajectory-custom-${index % 9})`
  }

  const shadeIndex = typeShadeCounters[type] ?? 0
  typeShadeCounters[type] = shadeIndex + 1

  const shadeMap: Partial<Record<TrajectoryType, string>> = {
    [TrajectoryType.SBTI_15]: `var(--trajectory-sbti-15-shade-${shadeIndex % 9})`,
    [TrajectoryType.SBTI_WB2C]: `var(--trajectory-sbti-wb2c-shade-${shadeIndex % 9})`,
    [TrajectoryType.SNBC_GENERAL]: `var(--trajectory-snbc-shade-${shadeIndex % 9})`,
    [TrajectoryType.SNBC_SECTORAL]: `var(--trajectory-snbc-shade-${shadeIndex % 9})`,
  }

  return shadeMap[type] || fallbackColor || `var(--trajectory-custom-${index % 9})`
}

export const buildTrajectorySeries = ({
  trajectoryData,
  label,
  color,
  isCustom,
  mapDataToYears,
  studyStartYear,
  studyStartYearIndex,
  failedColor = 'var(--error-100)',
  isCustomTrajectory = false,
}: BuildTrajectorySeriesParams): TrajectorySeries[] => {
  const series: TrajectorySeries[] = []
  const { previousTrajectory, previousTrajectoryStartYear, currentTrajectory, withinThreshold, isFailed } =
    trajectoryData

  if (previousTrajectory) {
    if (withinThreshold) {
      series.push({
        type: 'line',
        dataType: 'previous',
        isCustom,
        withinThreshold: true,
        data: mapDataToYears(previousTrajectory, isCustomTrajectory),
        label: withinThreshold && !isCustomTrajectory ? label : label + ` (${previousTrajectoryStartYear})`,
        color,
        curve: 'linear' as const,
        connectNulls: false,
        showMark: false,
        valueFormatter: formatValue,
      })
    } else {
      series.push({
        type: 'line',
        dataType: 'previous',
        isCustom,
        data: mapDataToYears(previousTrajectory, isCustomTrajectory),
        label: label + ` (${previousTrajectoryStartYear})`,
        color: `color-mix(in srgb, ${color} 50%, transparent)`,
        curve: 'linear' as const,
        connectNulls: false,
        showMark: false,
        valueFormatter: formatValue,
      })
    }
  }

  const currentData = mapDataToYears(currentTrajectory, isCustomTrajectory, isFailed)
  const showCurrentTrajectory = !previousTrajectory || !withinThreshold

  if (showCurrentTrajectory) {
    series.push({
      type: 'line',
      dataType: 'current',
      isCustom,
      isFailed,
      data: currentData,
      label: previousTrajectory ? label + ` (${studyStartYear})` : label,
      color: isFailed ? failedColor : color,
      curve: 'linear' as const,
      connectNulls: false,
      showMark: false,
      valueFormatter: formatValue,
    })
  } else {
    series.push({
      type: 'line',
      dataType: 'current',
      isCustom,
      isFailed,
      data: currentData.map((val, idx) => (idx === studyStartYearIndex ? val : null)),
      label: label + ` (${studyStartYear})`,
      color: isFailed ? failedColor : color,
      curve: 'linear' as const,
      connectNulls: false,
      showMark: false,
      valueFormatter: formatValue,
    })
  }

  return series
}
