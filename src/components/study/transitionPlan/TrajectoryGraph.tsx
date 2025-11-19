'use client'

import { getYearsToDisplay, PastStudy, TrajectoryData } from '@/utils/trajectory'
import { Typography } from '@mui/material'
import { LineChart, LineSeries } from '@mui/x-charts/LineChart'
import { useTranslations } from 'next-intl'
import { useCallback, useMemo } from 'react'
import DependenciesSwitch from '../results/DependenciesSwitch'

export interface TrajectoryDataPoint {
  year: number
  value: number
}

interface Props {
  studyName: string
  trajectory15Data: TrajectoryData | null
  trajectoryWB2CData: TrajectoryData | null
  customTrajectoriesData: Array<{
    trajectoryData: TrajectoryData | null
    label: string
    color?: string
  }>
  actionBasedTrajectoryData: TrajectoryData | null
  studyStartYear: number
  selectedSbtiTrajectories: string[]
  withDependencies: boolean
  setWithDependencies: (value: boolean) => void
  pastStudies: PastStudy[]
}

const TrajectoryGraph = ({
  studyName,
  trajectory15Data,
  trajectoryWB2CData,
  customTrajectoriesData,
  actionBasedTrajectoryData,
  studyStartYear,
  selectedSbtiTrajectories,
  withDependencies,
  setWithDependencies,
  pastStudies = [],
}: Props) => {
  const t = useTranslations('study.transitionPlan.trajectories.graph')

  const trajectory15Enabled = selectedSbtiTrajectories.includes('1,5')
  const trajectoryWB2CEnabled = selectedSbtiTrajectories.includes('WB2C')

  const yearsToDisplay = useMemo(
    () =>
      getYearsToDisplay(
        trajectory15Data,
        trajectoryWB2CData,
        customTrajectoriesData.map((values) => values.trajectoryData),
        actionBasedTrajectoryData,
        trajectory15Enabled,
        trajectoryWB2CEnabled,
      ),
    [
      trajectory15Data,
      trajectoryWB2CData,
      customTrajectoriesData,
      actionBasedTrajectoryData,
      trajectory15Enabled,
      trajectoryWB2CEnabled,
    ],
  )

  const studyStartYearIndex = yearsToDisplay.indexOf(studyStartYear)

  const mapDataToYears = useCallback(
    (dataPoints: TrajectoryDataPoint[]) => {
      const dataMap = new Map(dataPoints.map((d) => [d.year, d.value]))
      return yearsToDisplay.map((year) => dataMap.get(year) ?? null)
    },
    [yearsToDisplay],
  )

  const historicalStudyYearIndices = useMemo(() => {
    const indices = new Set<number>()
    pastStudies.forEach((study) => {
      if (study.year < studyStartYear) {
        const idx = yearsToDisplay.indexOf(study.year)
        if (idx !== -1) {
          indices.add(idx)
        }
      }
    })
    return indices
  }, [pastStudies, studyStartYear, yearsToDisplay])

  const shouldShowMark = useCallback(
    (index: number) => {
      return index === studyStartYearIndex || historicalStudyYearIndices.has(index)
    },
    [studyStartYearIndex, historicalStudyYearIndices],
  )

  const seriesCreated = useMemo(() => {
    const series: LineSeries[] = []

    if (trajectory15Enabled && trajectory15Data) {
      const { previousTrajectory, previousTrajectoryReferenceYear, currentTrajectory, withinThreshold } =
        trajectory15Data

      if (previousTrajectory) {
        if (withinThreshold) {
          series.push({
            data: mapDataToYears(previousTrajectory),
            label: t('trajectory15'),
            color: 'var(--trajectory-sbti-15)',
            curve: 'linear' as const,
            connectNulls: false,
            showMark: ({ index }: { index: number }) => historicalStudyYearIndices.has(index),
            valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
          })
        } else {
          series.push({
            data: mapDataToYears(previousTrajectory),
            label: t('trajectory15') + ` (${previousTrajectoryReferenceYear})`,
            color: 'color-mix(in srgb, var(--trajectory-sbti-15) 50%, transparent)',
            curve: 'linear' as const,
            connectNulls: false,
            showMark: ({ index }: { index: number }) => historicalStudyYearIndices.has(index),
            valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
          })
        }
      }

      const currentData = mapDataToYears(currentTrajectory)
      const showCurrentTrajectory = !previousTrajectory || !withinThreshold
      if (showCurrentTrajectory) {
        series.push({
          data: currentData,
          label: trajectory15Data.previousTrajectory ? t('trajectory15') : t('trajectory15'),
          color: 'var(--trajectory-sbti-15)',
          curve: 'linear' as const,
          connectNulls: false,
          showMark: ({ index }: { index: number }) => shouldShowMark(index),
          valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
        })
      } else {
        series.push({
          data: currentData.map((val, idx) => (idx === studyStartYearIndex ? val : null)),
          label: `${t('trajectory15')} (${studyStartYear})`,
          color: 'var(--trajectory-sbti-15)',
          curve: 'linear' as const,
          connectNulls: false,
          showMark: true,
          valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
        })
      }
    }

    if (trajectoryWB2CEnabled && trajectoryWB2CData) {
      const { previousTrajectory, previousTrajectoryReferenceYear, currentTrajectory, withinThreshold } =
        trajectoryWB2CData

      if (previousTrajectory) {
        if (withinThreshold) {
          series.push({
            data: mapDataToYears(previousTrajectory),
            label: t('trajectoryWB2C'),
            color: 'var(--trajectory-sbti-wb2c)',
            curve: 'linear' as const,
            connectNulls: false,
            showMark: ({ index }: { index: number }) => historicalStudyYearIndices.has(index),
            valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
          })
        } else {
          series.push({
            data: mapDataToYears(previousTrajectory),
            label: t('trajectoryWB2C') + ` (${previousTrajectoryReferenceYear})`,
            color: 'color-mix(in srgb, var(--trajectory-sbti-wb2c) 50%, transparent)',
            curve: 'linear' as const,
            connectNulls: false,
            showMark: ({ index }: { index: number }) => historicalStudyYearIndices.has(index),
            valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
          })
        }
      }

      const currentData = mapDataToYears(currentTrajectory)
      const showCurrentTrajectory = !previousTrajectory || !withinThreshold
      if (showCurrentTrajectory) {
        series.push({
          data: currentData,
          label: t('trajectoryWB2C'),
          color: 'var(--trajectory-sbti-wb2c)',
          curve: 'linear' as const,
          connectNulls: false,
          showMark: ({ index }: { index: number }) => shouldShowMark(index),
          valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
        })
      } else {
        series.push({
          data: currentData.map((val, idx) => (idx === studyStartYearIndex ? val : null)),
          label: t('trajectoryWB2C'),
          color: 'var(--trajectory-sbti-wb2c)',
          curve: 'linear' as const,
          connectNulls: false,
          showMark: true,
          valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
        })
      }
    }

    customTrajectoriesData.forEach((traj, index) => {
      if (traj.trajectoryData) {
        const { previousTrajectory, previousTrajectoryReferenceYear, currentTrajectory, withinThreshold } =
          traj.trajectoryData

        if (previousTrajectory) {
          if (withinThreshold) {
            series.push({
              data: mapDataToYears(previousTrajectory),
              label: traj.label,
              color: traj.color || `var(--trajectory-custom-${index % 9})`,
              curve: 'linear' as const,
              connectNulls: false,
              showMark: ({ index }: { index: number }) => historicalStudyYearIndices.has(index),
              valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
            })
          } else {
            const baseColor = traj.color || `var(--trajectory-custom-${index % 9})`
            series.push({
              data: mapDataToYears(previousTrajectory),
              label: traj.label + ` (${previousTrajectoryReferenceYear})`,
              color: `color-mix(in srgb, ${baseColor} 50%, transparent)`,
              curve: 'linear' as const,
              connectNulls: false,
              showMark: ({ index }: { index: number }) => historicalStudyYearIndices.has(index),
              valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
            })
          }
        }

        const currentData = mapDataToYears(currentTrajectory)
        const showCurrentTrajectory = !previousTrajectory || !withinThreshold
        if (showCurrentTrajectory) {
          series.push({
            data: currentData,
            label: traj.label,
            color: traj.color || `var(--trajectory-custom-${index % 9})`,
            curve: 'linear' as const,
            connectNulls: false,
            showMark: ({ index }: { index: number }) => shouldShowMark(index),
            valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
          })
        } else {
          series.push({
            data: currentData.map((val, idx) => (idx === studyStartYearIndex ? val : null)),
            label: traj.label,
            color: traj.color || `var(--trajectory-custom-${index % 9})`,
            curve: 'linear' as const,
            connectNulls: false,
            showMark: true,
            valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
          })
        }
      }
    })

    if (actionBasedTrajectoryData && actionBasedTrajectoryData.currentTrajectory.length > 0) {
      const { previousTrajectory, previousTrajectoryReferenceYear, currentTrajectory, withinThreshold } =
        actionBasedTrajectoryData

      if (previousTrajectory) {
        if (withinThreshold) {
          series.push({
            data: mapDataToYears(previousTrajectory),
            label: t('actionBasedTrajectory'),
            color: 'var(--mui-palette-primary-main)',
            curve: 'linear' as const,
            connectNulls: false,
            showMark: ({ index }: { index: number }) => historicalStudyYearIndices.has(index),
            valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
          })
        } else {
          series.push({
            data: mapDataToYears(previousTrajectory),
            label: t('actionBasedTrajectory') + ` (${previousTrajectoryReferenceYear})`,
            color: 'color-mix(in srgb, var(--mui-palette-primary-main) 50%, transparent)',
            curve: 'linear' as const,
            connectNulls: false,
            showMark: ({ index }: { index: number }) => historicalStudyYearIndices.has(index),
            valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
          })
        }
      }

      const currentData = mapDataToYears(currentTrajectory)
      const showCurrentTrajectory = !previousTrajectory || !withinThreshold
      if (showCurrentTrajectory) {
        series.push({
          data: currentData,
          label: t('actionBasedTrajectory'),
          color: 'var(--mui-palette-primary-main)',
          curve: 'linear' as const,
          connectNulls: false,
          showMark: ({ index }: { index: number }) => shouldShowMark(index),
          valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
        })
      } else {
        series.push({
          data: currentData.map((val, idx) => (idx === studyStartYearIndex ? val : null)),
          label: studyName + ` (${studyStartYear})`,
          color: 'var(--mui-palette-primary-main)',
          curve: 'linear' as const,
          connectNulls: false,
          showMark: true,
          valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
        })
      }
    }

    return series
  }, [
    trajectory15Enabled,
    trajectory15Data,
    trajectoryWB2CEnabled,
    trajectoryWB2CData,
    customTrajectoriesData,
    actionBasedTrajectoryData,
    mapDataToYears,
    t,
    historicalStudyYearIndices,
    shouldShowMark,
    studyStartYear,
    studyStartYearIndex,
    studyName,
  ])

  return (
    <div className="w100 mb2">
      <div className="flex align-center justify-between mb1">
        <Typography variant="h5" component="h2" fontWeight={600}>
          {t('title')}
        </Typography>
        <DependenciesSwitch withDependencies={withDependencies} setWithDependencies={setWithDependencies} />
      </div>
      <Typography variant="body2" color="text.secondary">
        {t('subtitle')}
      </Typography>

      <LineChart
        xAxis={[
          {
            data: yearsToDisplay,
            scaleType: 'linear',
            valueFormatter: (value) => value.toString(),
            tickInterval: [yearsToDisplay[0], ...yearsToDisplay.filter((year) => year % 5 === 0)],
          },
        ]}
        series={seriesCreated}
        height={400}
        yAxis={[
          {
            label: t('yAxisLabel'),
          },
        ]}
      />
    </div>
  )
}

export default TrajectoryGraph
