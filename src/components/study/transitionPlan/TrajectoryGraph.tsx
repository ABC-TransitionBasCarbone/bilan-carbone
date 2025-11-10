'use client'

import { FullStudy } from '@/db/study'
import { TrajectoryData } from '@/utils/trajectory'
import { Typography } from '@mui/material'
import { LineChart, LineSeries } from '@mui/x-charts/LineChart'
import { ExternalStudy } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import DependenciesSwitch from '../results/DependenciesSwitch'

export interface TrajectoryDataPoint {
  year: number
  value: number
}

interface Props {
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
  linkedStudies?: FullStudy[]
  linkedExternalStudies?: ExternalStudy[]
}

const TrajectoryGraph = ({
  trajectory15Data,
  trajectoryWB2CData,
  customTrajectoriesData,
  actionBasedTrajectoryData,
  studyStartYear,
  selectedSbtiTrajectories,
  withDependencies,
  setWithDependencies,
  linkedStudies = [],
  linkedExternalStudies = [],
}: Props) => {
  const t = useTranslations('study.transitionPlan.trajectories.graph')

  const trajectory15Enabled = selectedSbtiTrajectories.includes('1,5')
  const trajectoryWB2CEnabled = selectedSbtiTrajectories.includes('WB2C')

  const yearsToDisplay = useMemo(() => {
    const allYears = [
      ...(trajectory15Enabled && trajectory15Data ? trajectory15Data.currentTrajectory.map((d) => d.year) : []),
      ...(trajectory15Enabled && trajectory15Data?.previousTrajectory
        ? trajectory15Data.previousTrajectory.map((d) => d.year)
        : []),
      ...(trajectoryWB2CEnabled && trajectoryWB2CData ? trajectoryWB2CData.currentTrajectory.map((d) => d.year) : []),
      ...(trajectoryWB2CEnabled && trajectoryWB2CData?.previousTrajectory
        ? trajectoryWB2CData.previousTrajectory.map((d) => d.year)
        : []),
      ...customTrajectoriesData.flatMap((traj) =>
        traj.trajectoryData
          ? [
              ...traj.trajectoryData.currentTrajectory.map((d) => d.year),
              ...(traj.trajectoryData.previousTrajectory
                ? traj.trajectoryData.previousTrajectory.map((d) => d.year)
                : []),
            ]
          : [],
      ),
      ...(actionBasedTrajectoryData ? actionBasedTrajectoryData.currentTrajectory.map((d) => d.year) : []),
      ...(actionBasedTrajectoryData?.previousTrajectory
        ? actionBasedTrajectoryData.previousTrajectory.map((d) => d.year)
        : []),
    ]
    return Array.from(new Set(allYears)).sort((a, b) => a - b)
  }, [
    trajectory15Data,
    trajectoryWB2CData,
    customTrajectoriesData,
    actionBasedTrajectoryData,
    trajectory15Enabled,
    trajectoryWB2CEnabled,
  ])

  const studyStartYearIndex = yearsToDisplay.indexOf(studyStartYear)

  const mapDataToYears = (dataPoints: TrajectoryDataPoint[]) => {
    const dataMap = new Map(dataPoints.map((d) => [d.year, d.value]))
    return yearsToDisplay.map((year) => dataMap.get(year) ?? null)
  }

  const historicalStudyYearIndices = useMemo(() => {
    const historicalYears = new Set<number>()

    linkedStudies.forEach((study) => {
      const year = study.startDate.getFullYear()
      if (year < studyStartYear) {
        historicalYears.add(year)
      }
    })

    linkedExternalStudies.forEach((externalStudy) => {
      const year = externalStudy.date.getFullYear()
      if (year < studyStartYear) {
        historicalYears.add(year)
      }
    })

    return Array.from(historicalYears)
      .sort((a, b) => a - b)
      .map((year) => yearsToDisplay.indexOf(year))
      .filter((idx) => idx !== -1)
  }, [linkedStudies, linkedExternalStudies, studyStartYear, yearsToDisplay])

  const shouldShowMark = (index: number, onlyCurrentYear: boolean = false) => {
    if (onlyCurrentYear) {
      return index === studyStartYearIndex
    }
    return index === studyStartYearIndex || historicalStudyYearIndices.includes(index)
  }

  const createSeries = () => {
    const series: LineSeries[] = []

    if (trajectory15Enabled && trajectory15Data) {
      if (trajectory15Data.previousTrajectory) {
        if (trajectory15Data.withinThreshold) {
          series.push({
            data: mapDataToYears(trajectory15Data.previousTrajectory),
            label: t('trajectory15'),
            color: 'var(--trajectory-sbti-15)',
            curve: 'linear' as const,
            connectNulls: false,
            showMark: ({ index }: { index: number }) => historicalStudyYearIndices.includes(index),
            valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
          })
        } else {
          series.push({
            data: mapDataToYears(trajectory15Data.previousTrajectory),
            label: t('trajectory15') + ' (N-1)',
            color: 'color-mix(in srgb, var(--trajectory-sbti-15) 50%, transparent)',
            curve: 'linear' as const,
            connectNulls: false,
            showMark: ({ index }: { index: number }) => historicalStudyYearIndices.includes(index),
            valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
          })
        }
      }

      const currentData = mapDataToYears(trajectory15Data.currentTrajectory)
      const showCurrentTrajectory = !trajectory15Data.previousTrajectory || !trajectory15Data.withinThreshold
      if (showCurrentTrajectory) {
        series.push({
          data: currentData,
          label: trajectory15Data.previousTrajectory ? t('trajectory15') : t('trajectory15'),
          color: 'var(--trajectory-sbti-15)',
          curve: 'linear' as const,
          connectNulls: false,
          showMark: ({ index }: { index: number }) => shouldShowMark(index, false),
          valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
        })
      } else {
        series.push({
          data: currentData.map((val, idx) => (idx === studyStartYearIndex ? val : null)),
          label: t('trajectory15') + ' (N)',
          color: 'var(--trajectory-sbti-15)',
          curve: 'linear' as const,
          connectNulls: false,
          showMark: true,
          valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
        })
      }
    }

    if (trajectoryWB2CEnabled && trajectoryWB2CData) {
      if (trajectoryWB2CData.previousTrajectory) {
        if (trajectoryWB2CData.withinThreshold) {
          series.push({
            data: mapDataToYears(trajectoryWB2CData.previousTrajectory),
            label: t('trajectoryWB2C'),
            color: 'var(--trajectory-sbti-wb2c)',
            curve: 'linear' as const,
            connectNulls: false,
            showMark: ({ index }: { index: number }) => historicalStudyYearIndices.includes(index),
            valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
          })
        } else {
          series.push({
            data: mapDataToYears(trajectoryWB2CData.previousTrajectory),
            label: t('trajectoryWB2C') + ' (N-1)',
            color: 'color-mix(in srgb, var(--trajectory-sbti-wb2c) 50%, transparent)',
            curve: 'linear' as const,
            connectNulls: false,
            showMark: ({ index }: { index: number }) => historicalStudyYearIndices.includes(index),
            valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
          })
        }
      }

      const currentData = mapDataToYears(trajectoryWB2CData.currentTrajectory)
      const showCurrentTrajectory = !trajectoryWB2CData.previousTrajectory || !trajectoryWB2CData.withinThreshold
      if (showCurrentTrajectory) {
        series.push({
          data: currentData,
          label: t('trajectoryWB2C'),
          color: 'var(--trajectory-sbti-wb2c)',
          curve: 'linear' as const,
          connectNulls: false,
          showMark: ({ index }: { index: number }) => shouldShowMark(index, false),
          valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
        })
      } else {
        series.push({
          data: currentData.map((val, idx) => (idx === studyStartYearIndex ? val : null)),
          label: t('trajectoryWB2C') + ' (N)',
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
        if (traj.trajectoryData.previousTrajectory) {
          if (traj.trajectoryData.withinThreshold) {
            series.push({
              data: mapDataToYears(traj.trajectoryData.previousTrajectory),
              label: traj.label,
              color: traj.color || `var(--trajectory-custom-${index % 9})`,
              curve: 'linear' as const,
              connectNulls: false,
              showMark: ({ index }: { index: number }) => historicalStudyYearIndices.includes(index),
              valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
            })
          } else {
            const baseColor = traj.color || `var(--trajectory-custom-${index % 9})`
            series.push({
              data: mapDataToYears(traj.trajectoryData.previousTrajectory),
              label: traj.label + ' (N-1)',
              color: `color-mix(in srgb, ${baseColor} 50%, transparent)`,
              curve: 'linear' as const,
              connectNulls: false,
              showMark: ({ index }: { index: number }) => historicalStudyYearIndices.includes(index),
              valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
            })
          }
        }

        const currentData = mapDataToYears(traj.trajectoryData.currentTrajectory)
        const showCurrentTrajectory = !traj.trajectoryData.previousTrajectory || !traj.trajectoryData.withinThreshold
        if (showCurrentTrajectory) {
          series.push({
            data: currentData,
            label: traj.label,
            color: traj.color || `var(--trajectory-custom-${index % 9})`,
            curve: 'linear' as const,
            connectNulls: false,
            showMark: ({ index }: { index: number }) => shouldShowMark(index, false),
            valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
          })
        } else {
          series.push({
            data: currentData.map((val, idx) => (idx === studyStartYearIndex ? val : null)),
            label: traj.label + ' (N)',
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
      if (actionBasedTrajectoryData.previousTrajectory) {
        if (actionBasedTrajectoryData.withinThreshold) {
          series.push({
            data: mapDataToYears(actionBasedTrajectoryData.previousTrajectory),
            label: t('actionBasedTrajectory'),
            color: 'var(--mui-palette-primary-main)',
            curve: 'linear' as const,
            connectNulls: false,
            showMark: ({ index }: { index: number }) => historicalStudyYearIndices.includes(index),
            valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
          })
        } else {
          series.push({
            data: mapDataToYears(actionBasedTrajectoryData.previousTrajectory),
            label: t('actionBasedTrajectory') + ' (N-1)',
            color: 'color-mix(in srgb, var(--mui-palette-primary-main) 50%, transparent)',
            curve: 'linear' as const,
            connectNulls: false,
            showMark: ({ index }: { index: number }) => historicalStudyYearIndices.includes(index),
            valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
          })
        }
      }

      const currentData = mapDataToYears(actionBasedTrajectoryData.currentTrajectory)
      const showCurrentTrajectory =
        !actionBasedTrajectoryData.previousTrajectory || !actionBasedTrajectoryData.withinThreshold
      if (showCurrentTrajectory) {
        series.push({
          data: currentData,
          label: t('actionBasedTrajectory'),
          color: 'var(--mui-palette-primary-main)',
          curve: 'linear' as const,
          connectNulls: false,
          showMark: ({ index }: { index: number }) => shouldShowMark(index, false),
          valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
        })
      } else {
        series.push({
          data: currentData.map((val, idx) => (idx === studyStartYearIndex ? val : null)),
          label: t('actionBasedTrajectory') + ' (N)',
          color: 'var(--mui-palette-primary-main)',
          curve: 'linear' as const,
          connectNulls: false,
          showMark: true,
          valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
        })
      }
    }

    return series
  }

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
        series={createSeries()}
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
