'use client'

import {
  TRAJECTORY_15_ID,
  TRAJECTORY_SNBC_GENERAL_ID,
  TRAJECTORY_WB2C_ID,
} from '@/components/pages/TrajectoryReductionPage'
import { getGraphRange, PastStudy, TrajectoryData } from '@/utils/trajectory'
import { Alert, Slider, Typography } from '@mui/material'
import { LineChart, LineSeries } from '@mui/x-charts/LineChart'
import type { StudyResultUnit } from '@prisma/client'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import DependenciesSwitch from '../results/DependenciesSwitch'

export interface TrajectoryDataPoint {
  year: number
  value: number
}

interface Props {
  studyName: string
  studyUnit: StudyResultUnit
  trajectory15Data: TrajectoryData | null
  trajectoryWB2CData: TrajectoryData | null
  snbcData: TrajectoryData | null
  customTrajectoriesData: Array<{
    trajectoryData: TrajectoryData | null
    label: string
    color?: string
  }>
  actionBasedTrajectoryData: TrajectoryData | null
  studyStartYear: number
  selectedSnbcTrajectories: string[]
  selectedSbtiTrajectories: string[]
  withDependencies: boolean
  setWithDependencies: (value: boolean) => void
  pastStudies: PastStudy[]
  validatedOnly: boolean
  unvalidatedSourcesInfo: {
    currentStudyCount: number
    linkedStudies: Array<{ id: string; name: string; unvalidatedCount: number }>
    totalCount: number
  }
}

const TrajectoryGraph = ({
  studyName,
  studyUnit,
  trajectory15Data,
  trajectoryWB2CData,
  snbcData,
  customTrajectoriesData,
  actionBasedTrajectoryData,
  studyStartYear,
  selectedSnbcTrajectories,
  selectedSbtiTrajectories,
  withDependencies,
  setWithDependencies,
  pastStudies = [],
  validatedOnly,
  unvalidatedSourcesInfo,
}: Props) => {
  const t = useTranslations('study.transitionPlan.trajectories.graph')
  const tUnit = useTranslations('study.results.units')

  const trajectory15Enabled = selectedSbtiTrajectories.includes(TRAJECTORY_15_ID)
  const trajectoryWB2CEnabled = selectedSbtiTrajectories.includes(TRAJECTORY_WB2C_ID)
  const trajectorySnbcEnabled = selectedSnbcTrajectories.includes(TRAJECTORY_SNBC_GENERAL_ID)

  const { years: allYearsToDisplay, maxEmissions } = useMemo(
    () =>
      getGraphRange(
        [
          trajectory15Data,
          trajectoryWB2CData,
          snbcData,
          ...customTrajectoriesData.map((values) => values.trajectoryData),
          actionBasedTrajectoryData,
        ].filter((traj) => traj !== null),
      ),
    [trajectory15Data, trajectoryWB2CData, snbcData, customTrajectoriesData, actionBasedTrajectoryData],
  )

  const minYear = allYearsToDisplay[0] ?? 2020
  const maxYear = allYearsToDisplay[allYearsToDisplay.length - 1] ?? 2050

  const [yearRange, setYearRange] = useState<number[]>([1990, 2100])
  const [emissionRange, setEmissionRange] = useState<number[]>([0, maxEmissions])

  // Calculate min/max y values from series data filtered by zoom range
  const yAxisMinMax = useMemo(() => {
    const allValues: number[] = []

    const collectValues = (data: TrajectoryDataPoint[]) => {
      data.forEach((point) => {
        // Only include values for years within the zoom range
        if (
          point.year >= yearRange[0] &&
          point.year <= yearRange[1] &&
          point.value !== null &&
          point.value !== undefined &&
          !isNaN(point.value)
        ) {
          allValues.push(point.value)
        }
      })
    }

    if (trajectory15Enabled && trajectory15Data) {
      if (trajectory15Data.previousTrajectory) {
        collectValues(trajectory15Data.previousTrajectory)
      }
      collectValues(trajectory15Data.currentTrajectory)
    }
    if (trajectoryWB2CEnabled && trajectoryWB2CData) {
      if (trajectoryWB2CData.previousTrajectory) {
        collectValues(trajectoryWB2CData.previousTrajectory)
      }
      collectValues(trajectoryWB2CData.currentTrajectory)
    }
    if (trajectorySnbcEnabled && snbcData) {
      if (snbcData.previousTrajectory) {
        collectValues(snbcData.previousTrajectory)
      }
      collectValues(snbcData.currentTrajectory)
    }
    customTrajectoriesData.forEach((traj) => {
      if (traj.trajectoryData) {
        if (traj.trajectoryData.previousTrajectory) {
          collectValues(traj.trajectoryData.previousTrajectory)
        }
        collectValues(traj.trajectoryData.currentTrajectory)
      }
    })
    if (actionBasedTrajectoryData) {
      if (actionBasedTrajectoryData.previousTrajectory) {
        collectValues(actionBasedTrajectoryData.previousTrajectory)
      }
      collectValues(actionBasedTrajectoryData.currentTrajectory)
    }

    if (allValues.length === 0) {
      return { min: 0, max: 100 }
    }

    const min = Math.min(...allValues)
    const max = Math.max(...allValues)
    const padding = (max - min) * 0.1 // 10% padding

    return {
      min: Math.max(0, min - padding),
      max: max + padding,
    }
  }, [
    yearRange,
    trajectory15Enabled,
    trajectory15Data,
    trajectoryWB2CEnabled,
    trajectoryWB2CData,
    trajectorySnbcEnabled,
    snbcData,
    customTrajectoriesData,
    actionBasedTrajectoryData,
  ])

  // Update zoom range when available years change
  useEffect(() => {
    if (minYear && maxYear && minYear <= maxYear) {
      setYearRange([minYear, maxYear])
    }
  }, [minYear, maxYear])

  // Update y-axis zoom range when y-axis min/max changes
  useEffect(() => {
    if (yAxisMinMax.min !== undefined && yAxisMinMax.max !== undefined) {
      setEmissionRange([yAxisMinMax.min, yAxisMinMax.max])
    }
  }, [yAxisMinMax])

  const yearsToDisplay = useMemo(() => {
    return allYearsToDisplay.filter((year) => year >= yearRange[0] && year <= yearRange[1])
  }, [allYearsToDisplay, yearRange])

  const studyStartYearIndex = yearsToDisplay.indexOf(studyStartYear)

  const mapDataToYears = useCallback(
    (dataPoints: TrajectoryDataPoint[], customTrajectory = false) => {
      // usefull for customTrajectory only
      const maxYear = customTrajectory
        ? Math.min((Math.max(...yearsToDisplay), Math.max(...dataPoints.map((point) => point.year))))
        : Math.max(...yearsToDisplay)

      const dataMap = new Map(dataPoints.map((d) => [d.year, d.value]))
      return yearsToDisplay.map((year) =>
        year <= maxYear ? (dataMap.get(year) ?? null) : (dataMap.get(maxYear) ?? null),
      )
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
      const { previousTrajectory, previousTrajectoryStartYear, currentTrajectory, withinThreshold } = trajectory15Data

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
            label: t('trajectory15') + ` (${previousTrajectoryStartYear})`,
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
          label: trajectory15Data.previousTrajectory ? t('trajectory15') + ` (${studyStartYear})` : t('trajectory15'),
          color: 'var(--trajectory-sbti-15)',
          curve: 'linear' as const,
          connectNulls: false,
          showMark: ({ index }: { index: number }) => shouldShowMark(index),
          valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
        })
      } else {
        series.push({
          data: currentData.map((val, idx) => (idx === studyStartYearIndex ? val : null)),
          label: t('trajectory15') + ` (${studyStartYear})`,
          color: 'var(--trajectory-sbti-15)',
          curve: 'linear' as const,
          connectNulls: false,
          showMark: true,
          valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
        })
      }
    }

    if (trajectoryWB2CEnabled && trajectoryWB2CData) {
      const { previousTrajectory, previousTrajectoryStartYear, currentTrajectory, withinThreshold } = trajectoryWB2CData

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
            label: t('trajectoryWB2C') + ` (${previousTrajectoryStartYear})`,
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
          label: trajectoryWB2CData.previousTrajectory
            ? t('trajectoryWB2C') + ` (${studyStartYear})`
            : t('trajectoryWB2C'),
          color: 'var(--trajectory-sbti-wb2c)',
          curve: 'linear' as const,
          connectNulls: false,
          showMark: ({ index }: { index: number }) => shouldShowMark(index),
          valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
        })
      } else {
        series.push({
          data: currentData.map((val, idx) => (idx === studyStartYearIndex ? val : null)),
          label: t('trajectoryWB2C') + ` (${studyStartYear})`,
          color: 'var(--trajectory-sbti-wb2c)',
          curve: 'linear' as const,
          connectNulls: false,
          showMark: true,
          valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
        })
      }
    }

    if (trajectorySnbcEnabled && snbcData) {
      const { previousTrajectory, previousTrajectoryStartYear, currentTrajectory, withinThreshold } = snbcData

      if (previousTrajectory) {
        if (withinThreshold) {
          series.push({
            data: mapDataToYears(previousTrajectory),
            label: t('trajectorySNBC'),
            color: 'var(--trajectory-snbc)',
            curve: 'linear' as const,
            connectNulls: false,
            showMark: ({ index }: { index: number }) => historicalStudyYearIndices.has(index),
            valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
          })
        } else {
          series.push({
            data: mapDataToYears(previousTrajectory),
            label: t('trajectorySNBC') + ` (${previousTrajectoryStartYear})`,
            color: 'color-mix(in srgb, var(--trajectory-snbc) 50%, transparent)',
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
          label: snbcData.previousTrajectory ? t('trajectorySNBC') + ` (${studyStartYear})` : t('trajectorySNBC'),
          color: 'var(--trajectory-snbc)',
          curve: 'linear' as const,
          connectNulls: false,
          showMark: ({ index }: { index: number }) => shouldShowMark(index),
          valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
        })
      } else {
        series.push({
          data: currentData.map((val, idx) => (idx === studyStartYearIndex ? val : null)),
          label: t('trajectorySNBC') + ` (${studyStartYear})`,
          color: 'var(--trajectory-snbc)',
          curve: 'linear' as const,
          connectNulls: false,
          showMark: true,
          valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
        })
      }
    }

    customTrajectoriesData.forEach((traj, index) => {
      if (traj.trajectoryData) {
        const { previousTrajectory, previousTrajectoryStartYear, currentTrajectory, withinThreshold } =
          traj.trajectoryData

        if (previousTrajectory) {
          // Only show mark for the previous trajectory start year, not for past studies
          const previousTrajectoryStartYearIndex =
            previousTrajectoryStartYear !== null ? yearsToDisplay.indexOf(previousTrajectoryStartYear) : -1

          if (withinThreshold) {
            series.push({
              data: mapDataToYears(previousTrajectory, true),
              label: traj.label + ` (${previousTrajectoryStartYear})`,
              color: traj.color || `var(--trajectory-custom-${index % 9})`,
              curve: 'linear' as const,
              connectNulls: false,
              showMark: ({ index }: { index: number }) => index === previousTrajectoryStartYearIndex,
              valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
            })
          } else {
            const baseColor = traj.color || `var(--trajectory-custom-${index % 9})`
            series.push({
              data: mapDataToYears(previousTrajectory, true),
              label: traj.label + ` (${previousTrajectoryStartYear})`,
              color: `color-mix(in srgb, ${baseColor} 50%, transparent)`,
              curve: 'linear' as const,
              connectNulls: false,
              showMark: ({ index }: { index: number }) => index === previousTrajectoryStartYearIndex,
              valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
            })
          }
        }

        const currentData = mapDataToYears(currentTrajectory, true)
        const showCurrentTrajectory = !previousTrajectory || !withinThreshold
        if (showCurrentTrajectory) {
          series.push({
            data: currentData,
            label: previousTrajectory ? traj.label + ` (${studyStartYear})` : traj.label,
            color: traj.color || `var(--trajectory-custom-${index % 9})`,
            curve: 'linear' as const,
            connectNulls: false,
            showMark: ({ index }: { index: number }) => shouldShowMark(index),
            valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
          })
        } else {
          series.push({
            data: currentData.map((val, idx) => (idx === studyStartYearIndex ? val : null)),
            label: traj.label + ` (${studyStartYear})`,
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
      const { previousTrajectory, previousTrajectoryStartYear, currentTrajectory, withinThreshold } =
        actionBasedTrajectoryData

      if (previousTrajectory) {
        if (withinThreshold) {
          series.push({
            data: mapDataToYears(previousTrajectory),
            label: t('actionBasedTrajectory') + ` (${previousTrajectoryStartYear})`,
            color: 'var(--mui-palette-primary-main)',
            curve: 'linear' as const,
            connectNulls: false,
            showMark: ({ index }: { index: number }) => historicalStudyYearIndices.has(index),
            valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
          })
        } else {
          series.push({
            data: mapDataToYears(previousTrajectory),
            label: t('actionBasedTrajectory') + ` (${previousTrajectoryStartYear})`,
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
          label: actionBasedTrajectoryData.previousTrajectory
            ? t('actionBasedTrajectory') + ` (${studyStartYear})`
            : t('actionBasedTrajectory'),
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
    trajectorySnbcEnabled,
    snbcData,
    customTrajectoriesData,
    actionBasedTrajectoryData,
    mapDataToYears,
    t,
    historicalStudyYearIndices,
    shouldShowMark,
    studyStartYear,
    studyStartYearIndex,
    studyName,
    yearsToDisplay,
  ])

  return (
    <div className="w100 flex-col gapped1 mb2">
      <div className="flex align-center justify-between">
        <Typography variant="h5" component="h2" fontWeight={600}>
          {t('title')}
        </Typography>
        <DependenciesSwitch withDependencies={withDependencies} setWithDependencies={setWithDependencies} />
      </div>
      {validatedOnly && unvalidatedSourcesInfo.totalCount > 0 && (
        <Alert severity="warning">
          {unvalidatedSourcesInfo.currentStudyCount > 0 && (
            <div>{t('unvalidatedSourcesWarning', { count: unvalidatedSourcesInfo.currentStudyCount })}</div>
          )}
          {unvalidatedSourcesInfo.linkedStudies.length > 0 && (
            <div className="mt1">
              {t('unvalidatedSourcesLinkedStudiesWarning', {
                count: unvalidatedSourcesInfo.linkedStudies.reduce((sum, s) => sum + s.unvalidatedCount, 0),
              })}{' '}
              {unvalidatedSourcesInfo.linkedStudies.map((study, index) => (
                <span key={study.id}>
                  <Link href={`/etudes/${study.id}`}>{study.name}</Link>
                  {t('unvalidatedSourcesLinkedStudyCount', { count: study.unvalidatedCount })}
                  {index < unvalidatedSourcesInfo.linkedStudies.length - 1 && ', '}
                </span>
              ))}
              .
            </div>
          )}
        </Alert>
      )}
      <Typography variant="body2" color="text.secondary">
        {t('subtitle')}
      </Typography>

      {/* <Slider
          className="h100"
          orientation="vertical"
          getAriaLabel={() => 'Emissions range'}
          getAriaValueText={(value) => Math.round(value).toString()}
          value={emissionRange}
          onChange={(_, newValue) => {
            if (Array.isArray(newValue) && newValue.length === 2) {
              setEmissionRange(newValue as number[])
            }
          }}
          min={yAxisMinMax.min}
          max={yAxisMinMax.max}
          valueLabelDisplay="on"
          valueLabelFormat={(value) => Math.round(value).toString()}
        /> */}

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
            label: `${t('yAxisLabel')} (${tUnit(studyUnit)})`,
            min: emissionRange[0] || undefined,
            max: emissionRange[1] || undefined,
          },
        ]}
      />
      <div className="flex justify-center w100">
        <Slider
          className="w50"
          getAriaLabel={() => 'Year range'}
          getAriaValueText={(value) => value.toString()}
          value={yearRange}
          onChange={(_, newValue) => {
            if (Array.isArray(newValue) && newValue.length === 2) {
              setYearRange(newValue as number[])
            }
          }}
          min={minYear}
          max={maxYear}
          valueLabelDisplay="on"
          valueLabelFormat={(value) => value.toString()}
        />
      </div>
    </div>
  )
}

export default TrajectoryGraph
