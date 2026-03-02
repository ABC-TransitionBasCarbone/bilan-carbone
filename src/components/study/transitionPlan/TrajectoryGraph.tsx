'use client'

import GlossaryModal from '@/components/modals/GlossaryModal'
import { TRAJECTORY_15_ID, TRAJECTORY_SNBC_GENERAL_ID, TRAJECTORY_WB2C_ID } from '@/constants/trajectories'
import { FullStudy } from '@/db/study'
import { TrajectoryWithObjectives } from '@/db/transitionPlan'
import { useLocalStorageSync } from '@/hooks/useLocalStorageSync'
import { calculateTrajectoriesWithHistory, getYearsToDisplay, PastStudy } from '@/utils/trajectory'
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined'
import { Alert, Slider, SvgIcon, Typography } from '@mui/material'
import {
  AreaPlot,
  ChartContainer,
  ChartsAxisHighlight,
  ChartsReferenceLine,
  ChartsTooltip,
  ChartsXAxis,
  ChartsYAxis,
  LinePlot,
  LineSeriesType,
  MarkPlot,
} from '@mui/x-charts'
import { Action, SectenInfo } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import DrawingAreaBox, { DrawingProps } from '../charts/DrawingArea'
import CustomTrajectoryLegend from '../trajectory/CustomTrajectoryLegend'
import styles from './TrajectoryGraph.module.css'
import { BottomLeftMultilineText } from './TrajectoryGraphDrawingArea'

export interface TrajectoryDataPoint {
  year: number
  value: number
}

export type DataType = 'previous' | 'current'

interface Props {
  study: FullStudy
  trajectories: TrajectoryWithObjectives[]
  actions: Action[]
  linkedStudies: FullStudy[]
  sectenData: SectenInfo[]
  selectedSnbcTrajectories: string[]
  selectedSbtiTrajectories: string[]
  selectedCustomTrajectories: string[]
  pastStudies: PastStudy[]
  validatedOnly: boolean
  studyEmissions: number
  showTitle?: boolean
  showActionTrajectory?: boolean
  titleAction?: ReactNode
  storageKey?: string
}

const TrajectoryGraph = ({
  study,
  trajectories,
  actions,
  linkedStudies,
  sectenData,
  selectedSnbcTrajectories,
  selectedSbtiTrajectories,
  selectedCustomTrajectories,
  pastStudies = [],
  validatedOnly,
  studyEmissions,
  showTitle = true,
  showActionTrajectory = true,
  titleAction,
  storageKey,
}: Props) => {
  const t = useTranslations('study.transitionPlan.trajectories.graph')
  const tUnit = useTranslations('study.results.units')
  const [yearRange, setYearRange] = useState<number[] | null>(null)
  const [glossary, setGlossary] = useState(false)
  const [displayedYearRange, setDisplayedYearRange] = useState<number[] | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const tSnbc = useTranslations('study.transitionPlan.trajectories.snbcCard')
  const tGlossary = useTranslations('study.transitionPlan.trajectories.graph.glossary')

  const trajectory15Enabled = selectedSbtiTrajectories.includes(TRAJECTORY_15_ID)
  const trajectoryWB2CEnabled = selectedSbtiTrajectories.includes(TRAJECTORY_WB2C_ID)

  const { name, resultsUnit, startDate, emissionSources } = study
  const studyStartYear = startDate.getFullYear()

  const unvalidatedSourcesInfo = useMemo(() => {
    let totalCount = 0
    const currentStudyUnvalidatedCount = emissionSources.filter((source) => !source.validated).length
    totalCount += currentStudyUnvalidatedCount
    const linkedStudiesWithUnvalidatedSources = linkedStudies
      .map((linkedStudy) => {
        const unvalidatedCount = linkedStudy.emissionSources.filter((source) => !source.validated).length
        totalCount += unvalidatedCount
        return unvalidatedCount > 0 ? { id: linkedStudy.id, name: linkedStudy.name, unvalidatedCount } : null
      })
      .filter((s) => s !== null) as Array<{ id: string; name: string; unvalidatedCount: number }>
    return {
      currentStudyCount: currentStudyUnvalidatedCount,
      linkedStudies: linkedStudiesWithUnvalidatedSources,
      totalCount,
    }
  }, [emissionSources, linkedStudies])

  const data = useMemo(() => {
    const trajectoryResult = calculateTrajectoriesWithHistory({
      study,
      withDependencies: true,
      validatedOnly,
      trajectories,
      actions: showActionTrajectory ? actions : [],
      pastStudies,
      selectedSnbcTrajectories,
      selectedSbtiTrajectories,
      selectedCustomTrajectoryIds: selectedCustomTrajectories,
      sectenData,
    })

    const customTrajectoriesData = trajectoryResult.customTrajectories.map((trajData) => {
      const traj = trajectories.find((t) => t.id === trajData.id)
      return {
        trajectoryData: trajData.data,
        label: traj?.name || '',
        color: undefined,
      }
    })

    return {
      trajectory15Data: trajectoryResult.sbti15,
      trajectoryWB2CData: trajectoryResult.sbtiWB2C,
      snbcData: trajectoryResult.snbc,
      customTrajectoriesData,
      actionBasedTrajectoryData: trajectoryResult.actionBased,
      studyStartYear,
    }
  }, [
    study,
    validatedOnly,
    trajectories,
    actions,
    showActionTrajectory,
    pastStudies,
    selectedSnbcTrajectories,
    selectedSbtiTrajectories,
    selectedCustomTrajectories,
    sectenData,
    studyStartYear,
  ])

  const snbcTrajectoryDataArray = Object.values(data.snbcData)

  const allYearsToDisplay = useMemo(
    () =>
      getYearsToDisplay(
        [
          data.trajectory15Data,
          data.trajectoryWB2CData,
          ...snbcTrajectoryDataArray,
          ...data.customTrajectoriesData.map((values) => values.trajectoryData),
          data.actionBasedTrajectoryData,
        ].filter((traj) => traj !== null),
      ),
    [
      data.trajectory15Data,
      data.trajectoryWB2CData,
      snbcTrajectoryDataArray,
      data.customTrajectoriesData,
      data.actionBasedTrajectoryData,
    ],
  )

  const { minYear, maxYear } = useMemo(() => {
    if (allYearsToDisplay && allYearsToDisplay.length > 1) {
      return {
        minYear: allYearsToDisplay[0],
        maxYear: allYearsToDisplay[allYearsToDisplay.length - 1],
      }
    }
    return {
      minYear: 2020,
      maxYear: 2050,
    }
  }, [allYearsToDisplay])

  useEffect(() => {
    if (minYear && maxYear) {
      const newRange = [minYear, maxYear]
      setYearRange(newRange)
      setDisplayedYearRange(newRange)
    }
  }, [minYear, maxYear])

  // Debounce the displayed year range to smooth out chart transitions
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (yearRange) {
      debounceTimerRef.current = setTimeout(() => {
        setDisplayedYearRange(yearRange)
      }, 150)
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [yearRange])

  const yearsToDisplay = useMemo(() => {
    if (!displayedYearRange) {
      return allYearsToDisplay
    }
    return allYearsToDisplay.filter((year) => year >= displayedYearRange[0] && year <= displayedYearRange[1])
  }, [allYearsToDisplay, displayedYearRange])

  const studyStartYearIndex = yearsToDisplay.indexOf(studyStartYear)

  const mapDataToYears = useCallback(
    (dataPoints: TrajectoryDataPoint[], customTrajectory = false, isFailed = false) => {
      // usefull for customTrajectory only
      let maxYear = customTrajectory
        ? Math.min((Math.max(...yearsToDisplay), Math.max(...dataPoints.map((point) => point.year))))
        : Math.max(...yearsToDisplay)

      if (isFailed && maxYear > studyStartYear) {
        maxYear = studyStartYear
      }

      const dataMap = new Map(dataPoints.map((d) => [d.year, d.value]))
      return yearsToDisplay.map((year) =>
        year <= maxYear ? (dataMap.get(year) ?? null) : isFailed ? null : (dataMap.get(maxYear) ?? null),
      )
    },
    [studyStartYear, yearsToDisplay],
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
    const series: (LineSeriesType & {
      dataType: DataType
      isFailed?: boolean
      isCustom?: boolean
      trajectoryName?: string
      withinThreshold?: boolean
    })[] = []

    if (trajectory15Enabled && data.trajectory15Data) {
      const { previousTrajectory, previousTrajectoryStartYear, currentTrajectory, withinThreshold, isFailed } =
        data.trajectory15Data

      if (previousTrajectory) {
        if (withinThreshold) {
          series.push({
            type: 'line',
            dataType: 'previous',
            isCustom: false,
            trajectoryName: t('trajectory15'),
            withinThreshold: true,
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
            type: 'line',
            dataType: 'previous',
            isCustom: false,
            trajectoryName: t('trajectory15'),
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

      const currentData = mapDataToYears(currentTrajectory, false, isFailed)
      const showCurrentTrajectory = !previousTrajectory || !withinThreshold
      if (showCurrentTrajectory) {
        series.push({
          type: 'line',
          dataType: 'current',
          isCustom: false,
          isFailed,
          trajectoryName: t('trajectory15'),
          data: currentData,
          label: data.trajectory15Data.previousTrajectory
            ? t('trajectory15') + ` (${studyStartYear})`
            : t('trajectory15'),
          color: isFailed ? 'var(--error-100)' : 'var(--trajectory-sbti-15)',
          curve: 'linear' as const,
          connectNulls: false,
          showMark: ({ index }: { index: number }) => shouldShowMark(index),
          valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
        })
      } else {
        series.push({
          type: 'line',
          dataType: 'current',
          isCustom: false,
          isFailed,
          trajectoryName: t('trajectory15'),
          data: currentData.map((val, idx) => (idx === studyStartYearIndex ? val : null)),
          label: t('trajectory15') + ` (${studyStartYear})`,
          color: isFailed ? 'var(--error-100)' : 'var(--trajectory-sbti-15)',
          curve: 'linear' as const,
          connectNulls: false,
          showMark: true,
          valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
        })
      }
    }

    if (trajectoryWB2CEnabled && data.trajectoryWB2CData) {
      const { previousTrajectory, previousTrajectoryStartYear, currentTrajectory, withinThreshold, isFailed } =
        data.trajectoryWB2CData

      if (previousTrajectory) {
        if (withinThreshold) {
          series.push({
            type: 'line',
            dataType: 'previous',
            isCustom: false,
            trajectoryName: t('trajectoryWB2C'),
            withinThreshold: true,
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
            type: 'line',
            dataType: 'previous',
            isCustom: false,
            trajectoryName: t('trajectoryWB2C'),
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

      const currentData = mapDataToYears(currentTrajectory, false, isFailed)
      const showCurrentTrajectory = !previousTrajectory || !withinThreshold
      if (showCurrentTrajectory) {
        series.push({
          type: 'line',
          dataType: 'current',
          isCustom: false,
          isFailed,
          trajectoryName: t('trajectoryWB2C'),
          data: currentData,
          label: data.trajectoryWB2CData.previousTrajectory
            ? t('trajectoryWB2C') + ` (${studyStartYear})`
            : t('trajectoryWB2C'),
          color: isFailed ? 'var(--error-100)' : 'var(--trajectory-sbti-wb2c)',
          curve: 'linear' as const,
          connectNulls: false,
          showMark: ({ index }: { index: number }) => shouldShowMark(index),
          valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
        })
      } else {
        series.push({
          type: 'line',
          dataType: 'current',
          isCustom: false,
          isFailed,
          trajectoryName: t('trajectoryWB2C'),
          data: currentData.map((val, idx) => (idx === studyStartYearIndex ? val : null)),
          label: t('trajectoryWB2C') + ` (${studyStartYear})`,
          color: isFailed ? 'var(--error-100)' : 'var(--trajectory-sbti-wb2c)',
          curve: 'linear' as const,
          connectNulls: false,
          showMark: true,
          valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
        })
      }
    }

    Object.entries(data.snbcData).forEach(([trajectoryId, trajectoryData]) => {
      if (selectedSnbcTrajectories.includes(trajectoryId) && trajectoryData) {
        const { previousTrajectory, previousTrajectoryStartYear, currentTrajectory, withinThreshold, isFailed } =
          trajectoryData

        const color = `var(--trajectory-snbc-${trajectoryId})`
        const label =
          trajectoryId === TRAJECTORY_SNBC_GENERAL_ID
            ? t('trajectorySNBC')
            : `${t('trajectorySNBC')} - ${tSnbc(trajectoryId.toLowerCase().replace('snbc_', ''))}`

        if (previousTrajectory) {
          if (withinThreshold) {
            series.push({
              type: 'line',
              dataType: 'previous',
              isCustom: false,
              trajectoryName: label,
              withinThreshold: true,
              data: mapDataToYears(previousTrajectory),
              label,
              color,
              curve: 'linear' as const,
              connectNulls: false,
              showMark: ({ index }: { index: number }) => historicalStudyYearIndices.has(index),
              valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
            })
          } else {
            series.push({
              type: 'line',
              dataType: 'previous',
              isCustom: false,
              trajectoryName: label,
              data: mapDataToYears(previousTrajectory),
              label: label + ` (${previousTrajectoryStartYear})`,
              color: `color-mix(in srgb, ${color} 50%, transparent)`,
              curve: 'linear' as const,
              connectNulls: false,
              showMark: ({ index }: { index: number }) => historicalStudyYearIndices.has(index),
              valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
            })
          }
        }

        const currentData = mapDataToYears(currentTrajectory, false, isFailed)
        const showCurrentTrajectory = !previousTrajectory || !withinThreshold
        if (showCurrentTrajectory) {
          series.push({
            type: 'line',
            dataType: 'current',
            isCustom: false,
            trajectoryName: label,
            label: trajectoryData.previousTrajectory ? label + ` (${studyStartYear})` : label,
            isFailed,
            data: currentData,
            color: isFailed ? 'var(--error-50)' : color,
            curve: 'linear' as const,
            connectNulls: false,
            showMark: ({ index }: { index: number }) => shouldShowMark(index),
            valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
          })
        } else {
          series.push({
            type: 'line',
            dataType: 'current',
            isCustom: false,
            trajectoryName: label,
            data: currentData.map((val, idx) => (idx === studyStartYearIndex ? val : null)),
            label: label + ` (${studyStartYear})`,
            isFailed,
            color: isFailed ? 'var(--error-50)' : color,
            curve: 'linear' as const,
            connectNulls: false,
            showMark: true,
            valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
          })
        }
      }
    })

    data.customTrajectoriesData.forEach((traj, index) => {
      if (traj.trajectoryData) {
        const { previousTrajectory, previousTrajectoryStartYear, currentTrajectory, withinThreshold, isFailed } =
          traj.trajectoryData

        if (previousTrajectory) {
          // Only show mark for the previous trajectory start year, not for past studies
          const previousTrajectoryStartYearIndex =
            previousTrajectoryStartYear !== null ? yearsToDisplay.indexOf(previousTrajectoryStartYear) : -1

          if (withinThreshold) {
            series.push({
              type: 'line',
              dataType: 'previous',
              isCustom: true,
              trajectoryName: traj.label,
              withinThreshold: true,
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
              type: 'line',
              dataType: 'previous',
              isCustom: true,
              trajectoryName: traj.label,
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

        const currentData = mapDataToYears(currentTrajectory, true, isFailed)
        const showCurrentTrajectory = !previousTrajectory || !withinThreshold
        if (showCurrentTrajectory) {
          series.push({
            type: 'line',
            dataType: 'current',
            isCustom: true,
            isFailed,
            trajectoryName: traj.label,
            data: currentData,
            label: previousTrajectory ? traj.label + ` (${studyStartYear})` : traj.label,
            color: isFailed ? 'var(--error-100)' : traj.color || `var(--trajectory-custom-${index % 9})`,
            curve: 'linear' as const,
            connectNulls: false,
            showMark: ({ index }: { index: number }) => shouldShowMark(index),
            valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
          })
        } else {
          series.push({
            type: 'line',
            dataType: 'current',
            isCustom: true,
            isFailed,
            trajectoryName: traj.label,
            data: currentData.map((val, idx) => (idx === studyStartYearIndex ? val : null)),
            label: traj.label + ` (${studyStartYear})`,
            color: isFailed ? 'var(--error-100)' : traj.color || `var(--trajectory-custom-${index % 9})`,
            curve: 'linear' as const,
            connectNulls: false,
            showMark: true,
            valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
          })
        }
      }
    })

    if (data.actionBasedTrajectoryData && data.actionBasedTrajectoryData.currentTrajectory.length > 0) {
      const { previousTrajectory, previousTrajectoryStartYear, currentTrajectory, withinThreshold } =
        data.actionBasedTrajectoryData

      if (previousTrajectory) {
        if (withinThreshold) {
          series.push({
            type: 'line',
            dataType: 'previous',
            isCustom: true,
            trajectoryName: t('actionBasedTrajectory'),
            withinThreshold: true,
            data: mapDataToYears(previousTrajectory),
            label: t('actionBasedTrajectory') + ` (${previousTrajectoryStartYear})`,
            color: 'var(--trajectory-action)',
            curve: 'linear' as const,
            connectNulls: false,
            showMark: ({ index }: { index: number }) => historicalStudyYearIndices.has(index),
            valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
          })
        } else {
          series.push({
            type: 'line',
            dataType: 'previous',
            isCustom: true,
            trajectoryName: t('actionBasedTrajectory'),
            data: mapDataToYears(previousTrajectory),
            label: t('actionBasedTrajectory') + ` (${previousTrajectoryStartYear})`,
            color: 'color-mix(in srgb, var(--trajectory-action) 50%, transparent)',
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
          type: 'line',
          dataType: 'current',
          isCustom: true,
          trajectoryName: t('actionBasedTrajectory'),
          data: currentData,
          label: data.actionBasedTrajectoryData.previousTrajectory
            ? t('actionBasedTrajectory') + ` (${studyStartYear})`
            : t('actionBasedTrajectory'),
          color: 'var(--trajectory-action)',
          curve: 'linear' as const,
          connectNulls: false,
          showMark: ({ index }: { index: number }) => shouldShowMark(index),
          valueFormatter: (value: number | null) => (value !== null ? Math.round(value).toString() : ''),
        })
      } else {
        series.push({
          type: 'line',
          dataType: 'current',
          isCustom: true,
          trajectoryName: t('actionBasedTrajectory'),
          data: currentData.map((val, idx) => (idx === studyStartYearIndex ? val : null)),
          label: name + ` (${studyStartYear})`,
          color: 'var(--trajectory-action)',
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
    data.trajectory15Data,
    trajectoryWB2CEnabled,
    data.trajectoryWB2CData,
    selectedSnbcTrajectories,
    data.snbcData,
    data.customTrajectoriesData,
    data.actionBasedTrajectoryData,
    mapDataToYears,
    t,
    tSnbc,
    historicalStudyYearIndices,
    shouldShowMark,
    studyStartYear,
    studyStartYearIndex,
    name,
    yearsToDisplay,
  ])

  const failedTrajectories = useMemo(() => {
    return seriesCreated.filter((serie) => serie.isFailed).map((serie) => serie.label as string)
  }, [seriesCreated])

  const oldestPastStudyYear = useMemo(() => {
    return Math.min(...pastStudies.map((study) => study.year), studyStartYear)
  }, [pastStudies, studyStartYear])

  const displayEstimatedPast = useMemo(
    () => yearRange && yearRange[0] < oldestPastStudyYear,
    [yearRange, oldestPastStudyYear],
  )

  const [hiddenTrajectoryLabels, setHiddenTrajectoryLabels] = useState<string[]>(() => {
    if (!storageKey || typeof window === 'undefined') {
      return []
    }
    const stored = localStorage.getItem(storageKey)
    return stored ? JSON.parse(stored) : []
  })

  useLocalStorageSync(storageKey ?? '', hiddenTrajectoryLabels, !!storageKey)

  const onToggleFilter = (label: string) =>
    setHiddenTrajectoryLabels((prev) => (prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]))

  const displayedSeries = useMemo(
    () => seriesCreated.filter((serie) => !hiddenTrajectoryLabels.includes(serie.label as string)),
    [hiddenTrajectoryLabels, seriesCreated],
  )

  const maxY = Math.max(...displayedSeries.flatMap((s) => s?.data?.filter((v) => v !== null) || 0))

  const backgroundForPastInfos: LineSeriesType = {
    type: 'line',
    id: 'background-area',
    data: yearsToDisplay.map((year) => (year <= oldestPastStudyYear ? maxY : null)),
    area: true,
    color: 'var(--trajectory-gray-area)',
    showMark: false,
    disableHighlight: true,
    valueFormatter: () => null,
  }

  const BottomLeftText = ({ onClick, ...props }: DrawingProps & { onClick: () => void }) => (
    <>
      <BottomLeftMultilineText {...props} className="bold text-center">
        <Typography variant="body2" fontWeight={600}>
          {t('estimatedPast')}
          <HelpOutlineOutlinedIcon color="secondary" className="ml-4 pointer" onClick={onClick} />
        </Typography>
      </BottomLeftMultilineText>
    </>
  )

  return (
    <div className="w100 flex-col gapped1">
      {showTitle && (
        <div className="flex align-center justify-between">
          <Typography variant="h5" component="h2" fontWeight={600}>
            {t('title')}
          </Typography>
          {titleAction}
        </div>
      )}
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
      {studyEmissions === 0 && <Alert severity="warning">{t('noEmissionSourcesWarning')}</Alert>}
      {!!failedTrajectories.length && (
        <Alert severity="warning" className="mb1">
          <Typography variant="body2">{t('failedTrajectories')}</Typography>
          {failedTrajectories.map((trajectory) => (
            <Typography key={trajectory} variant="body2">
              - {trajectory}
            </Typography>
          ))}
        </Alert>
      )}
      <Typography variant="body2" color="text.secondary">
        {t('subtitle')}
      </Typography>
      <div>
        <div className="flex align-center justify-between gapped1">
          <div className={classNames('flex wrap justify-center', styles.chartLegend)}>
            {displayedSeries
              .filter((s) => s.label)
              .map((s) => (
                <div key={s.label as string} className={classNames('flex align-center gapped025')}>
                  <SvgIcon className={styles.chartLegendIcon} fontSize="small">
                    <circle cx="12" cy="12" r="6" fill={s.color as string} />
                  </SvgIcon>
                  <Typography variant="body2">{s.label as string}</Typography>
                </div>
              ))}
          </div>
          <CustomTrajectoryLegend
            series={seriesCreated.map((s) => ({
              label: s.label as string,
              color: s.color as string,
              trajectoryName: s.trajectoryName,
              dataType: s.dataType,
              withinThreshold: s.withinThreshold,
            }))}
            hiddenLabels={hiddenTrajectoryLabels}
            onToggle={onToggleFilter}
            filterLabel={t('legendFilter')}
            previousLabel={(year: number) => t('previousTrajectories', { year })}
            currentLabel={(year: number) => t('currentTrajectories', { year })}
          />
        </div>
        <ChartContainer
          series={[backgroundForPastInfos, ...displayedSeries]}
          xAxis={[
            {
              data: yearsToDisplay,
              scaleType: 'linear',
              valueFormatter: (value) => value.toString(),
              tickInterval: (() => {
                const range = yearsToDisplay[yearsToDisplay.length - 1] - yearsToDisplay[0]
                const interval = range < 20 ? 1 : 5
                return [yearsToDisplay[0], ...yearsToDisplay.filter((year) => year % interval === 0)]
              })(),
            },
          ]}
          yAxis={[{ label: `${t('yAxisLabel')} (${tUnit(resultsUnit)})` }]}
          height={400}
        >
          <AreaPlot />
          <LinePlot />
          <MarkPlot />

          {displayEstimatedPast && (
            <DrawingAreaBox
              showCenterAxes={false}
              Text={(props) => <BottomLeftText {...props} onClick={() => setGlossary(true)} />}
            />
          )}

          <ChartsAxisHighlight x="line" />
          {displayEstimatedPast && <ChartsReferenceLine x={oldestPastStudyYear} labelAlign="start" />}
          <ChartsTooltip trigger="axis" />
          <ChartsXAxis />
          <ChartsYAxis />
        </ChartContainer>
      </div>

      <div className="flex justify-center w100">
        <Typography variant="body2" color="text.secondary" className={styles.rangeTitle}>
          {t('yearRangeLabel')}
        </Typography>
        {yearRange && (
          <Slider
            className={`w50 ${styles.yearRangeSlider}`}
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
            slotProps={{
              valueLabel: {
                className: styles.valueLabel,
              },
              input: {
                autoComplete: 'off',
                'aria-hidden': true,
              },
            }}
          />
        )}
      </div>

      {glossary && (
        <GlossaryModal glossary="title" label="emission-factor-post" t={tGlossary} onClose={() => setGlossary(false)}>
          {tGlossary('description')}
        </GlossaryModal>
      )}
    </div>
  )
}

export default TrajectoryGraph
