'use client'

import GlossaryModal from '@/components/modals/GlossaryModal'
import { TRAJECTORY_15_ID, TRAJECTORY_SNBC_GENERAL_ID, TRAJECTORY_WB2C_ID } from '@/constants/trajectories'
import type { FullStudy } from '@/db/study'
import { useLocalStorageSync } from '@/hooks/useLocalStorageSync'
import { customRich } from '@/i18n/customRich'
import type {
  ObjectiveGroup,
  PastStudy,
  TrajectoryDataPoint,
  TrajectorySeries,
  TrajectoryWithObjectives,
} from '@/types/trajectory.types'
import { calculateTrajectoriesWithHistory, getYearsToDisplay } from '@/utils/trajectory'
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
import { Action, SectenInfo, TrajectoryType } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import DrawingAreaBox, { DrawingProps } from '../charts/DrawingArea'
import CustomTrajectoryLegend from '../trajectory/CustomTrajectoryLegend'
import { buildTrajectorySeries, formatValue, getCustomTrajectoryColor } from './TrajectoryGraph.helper'
import styles from './TrajectoryGraph.module.css'
import { BottomLeftMultilineText } from './TrajectoryGraphDrawingArea'

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
  storageKey: string
  isTrajectoryPage?: boolean
  objectiveGroupsByTrajectoryId?: Map<string, ObjectiveGroup[]>
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
  objectiveGroupsByTrajectoryId,
}: Props) => {
  const t = useTranslations('study.transitionPlan.trajectories.graph')
  const tUnit = useTranslations('study.results.units')
  const [yearRange, setYearRange] = useState<number[] | null>(null)
  const [glossary, setGlossary] = useState(false)
  const [displayedYearRange, setDisplayedYearRange] = useState<number[] | null>(null)
  const [hiddenTrajectoryLabels, setHiddenTrajectoryLabels] = useState<string[]>([])
  const [hiddenLabelsLoaded, setHiddenLabelsLoaded] = useState(false)
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
      studyId: study.id,
      studyName: study.name,
      studyStartDate: study.startDate,
      studyResultsUnit: study.resultsUnit,
      totalCo2: studyEmissions,
      withDependencies: true,
      trajectories,
      actions: showActionTrajectory ? actions : [],
      pastStudies,
      selectedSnbcTrajectories,
      selectedSbtiTrajectories,
      selectedCustomTrajectoryIds: selectedCustomTrajectories,
      sectenData,
      objectiveGroupsByTrajectoryId,
    })

    const customTrajectoriesData = trajectoryResult.customTrajectories.map((trajData) => {
      const traj = trajectories.find((t) => t.id === trajData.id)
      return {
        trajectoryData: trajData.data,
        label: traj?.name || '',
        color: undefined,
        type: traj?.type,
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
    study.id,
    study.name,
    study.startDate,
    study.resultsUnit,
    studyEmissions,
    trajectories,
    actions,
    showActionTrajectory,
    pastStudies,
    selectedSnbcTrajectories,
    selectedSbtiTrajectories,
    selectedCustomTrajectories,
    sectenData,
    studyStartYear,
    objectiveGroupsByTrajectoryId,
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

  // Local storage related settings
  const yearRangeStorageKey = `${storageKey}-yearRange`
  useEffect(() => {
    if (minYear && maxYear) {
      let newRange = [minYear, maxYear]
      const stored = localStorage.getItem(yearRangeStorageKey)
      if (stored) {
        const parsed = JSON.parse(stored) as number[]
        if (parsed.length === 2 && parsed[0] >= minYear && parsed[1] <= maxYear) {
          newRange = parsed
        }
      }
      setYearRange(newRange)
      setDisplayedYearRange(newRange)
    }
  }, [minYear, maxYear, yearRangeStorageKey])

  useLocalStorageSync(yearRangeStorageKey, yearRange ?? [], yearRange !== null)

  useEffect(() => {
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      setHiddenTrajectoryLabels(JSON.parse(stored))
    }
    setHiddenLabelsLoaded(true)
  }, [storageKey])
  useLocalStorageSync(storageKey, hiddenTrajectoryLabels, hiddenLabelsLoaded)

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

  const studyPointsSeries: LineSeriesType[] = useMemo(() => {
    const studyPoints: { year: number; value: number; label: string }[] = pastStudies.map((s) => ({
      year: s.year,
      value: s.totalCo2,
      label: s.name,
    }))
    studyPoints.push({ year: studyStartYear, value: studyEmissions, label: name })

    return studyPoints.map(({ year, value, label }) => ({
      type: 'line' as const,
      id: `study-point-${year}`,
      data: yearsToDisplay.map((y) => (y === year ? value : null)),
      color: 'var(--mui-palette-primary-main)',
      showMark: true,
      disableHighlight: true,
      connectNulls: false,
      curve: 'linear' as const,
      label,
      valueFormatter: formatValue,
    }))
  }, [pastStudies, studyStartYear, studyEmissions, yearsToDisplay, name])

  const seriesCreated = useMemo(() => {
    const series: TrajectorySeries[] = []
    const commonParams = { mapDataToYears, studyStartYear, studyStartYearIndex }

    if (trajectory15Enabled && data.trajectory15Data) {
      series.push(
        ...buildTrajectorySeries({
          ...commonParams,
          trajectoryData: data.trajectory15Data,
          label: t('trajectory15'),
          color: 'var(--trajectory-sbti-15)',
          isCustom: false,
        }),
      )
    }

    if (trajectoryWB2CEnabled && data.trajectoryWB2CData) {
      series.push(
        ...buildTrajectorySeries({
          ...commonParams,
          trajectoryData: data.trajectoryWB2CData,
          label: t('trajectoryWB2C'),
          color: 'var(--trajectory-sbti-wb2c)',
          isCustom: false,
        }),
      )
    }

    Object.entries(data.snbcData).forEach(([trajectoryId, trajectoryData]) => {
      if (selectedSnbcTrajectories.includes(trajectoryId) && trajectoryData) {
        const label =
          trajectoryId === TRAJECTORY_SNBC_GENERAL_ID
            ? t('trajectorySNBC')
            : `${t('trajectorySNBC')} - ${tSnbc(trajectoryId.toLowerCase().replace('snbc_', ''))}`

        series.push(
          ...buildTrajectorySeries({
            ...commonParams,
            trajectoryData,
            label,
            color: `var(--trajectory-snbc-${trajectoryId})`,
            isCustom: false,
            failedColor: 'var(--error-50)',
          }),
        )
      }
    })

    const typeShadeCounters: Partial<Record<TrajectoryType, number>> = {}

    data.customTrajectoriesData.forEach((traj, index) => {
      if (traj.trajectoryData) {
        const baseColor = getCustomTrajectoryColor(traj.type, index, traj.color, typeShadeCounters)

        series.push(
          ...buildTrajectorySeries({
            ...commonParams,
            trajectoryData: traj.trajectoryData,
            label: traj.label,
            color: baseColor,
            isCustom: true,
            isCustomTrajectory: true,
          }),
        )
      }
    })

    if (
      showActionTrajectory &&
      data.actionBasedTrajectoryData &&
      data.actionBasedTrajectoryData.currentTrajectory.length > 0
    ) {
      series.push(
        ...buildTrajectorySeries({
          ...commonParams,
          trajectoryData: data.actionBasedTrajectoryData,
          label: t('actionBasedTrajectory'),
          color: 'var(--trajectory-action)',
          isCustom: true,
        }),
      )
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
    showActionTrajectory,
    mapDataToYears,
    t,
    tSnbc,
    studyStartYear,
    studyStartYearIndex,
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
      <BottomLeftMultilineText {...props} className="bold">
        <div className={classNames('flex', styles.estimatedPastLabel)}>
          <Typography variant="body2" fontWeight={600}>
            {t('estimatedPast')}
          </Typography>
          <HelpOutlineOutlinedIcon color="secondary" className="ml-4 pointer" onClick={onClick} />
        </div>
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
            <div>{customRich(t, 'unvalidatedSourcesWarning', { count: unvalidatedSourcesInfo.currentStudyCount })}</div>
          )}
          {unvalidatedSourcesInfo.linkedStudies.length > 0 && (
            <div className="mt1">
              {customRich(t, 'unvalidatedSourcesLinkedStudiesWarning', {
                count: unvalidatedSourcesInfo.linkedStudies.reduce((sum, s) => sum + s.unvalidatedCount, 0),
              })}{' '}
              {unvalidatedSourcesInfo.linkedStudies.map((study, index) => (
                <span key={study.id}>
                  <Link href={`/etudes/${study.id}`}>{study.name}</Link>
                  {customRich(t, 'unvalidatedSourcesLinkedStudyCount', { count: study.unvalidatedCount })}
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
          <Typography variant="body2">{customRich(t, 'failedTrajectories')}</Typography>
          {failedTrajectories.map((trajectory) => (
            <Typography key={trajectory} variant="body2">
              - {trajectory}
            </Typography>
          ))}
        </Alert>
      )}
      <Typography variant="body2" color="text.secondary">
        {customRich(t, 'subtitle')}
      </Typography>
      <div>
        <div className="flex align-center justify-between gapped1">
          <div className={classNames('flex wrap justify-center', styles.chartLegend)}>
            {displayedSeries
              .filter((s) => s.label)
              .map((s, index) => (
                <div key={`${s.label as string}-${index}`} className={classNames('flex align-center gapped025')}>
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
              dataType: s.dataType,
              withinThreshold: s.withinThreshold,
            }))}
            hiddenLabels={hiddenTrajectoryLabels}
            onToggle={onToggleFilter}
            previousLabel={(year: number) => t('previousTrajectories', { year })}
            currentLabel={(year: number) => t('currentTrajectories', { year })}
          />
        </div>
        <ChartContainer
          series={[
            ...(displayedSeries.length > 0 ? [backgroundForPastInfos] : []),
            ...studyPointsSeries,
            ...displayedSeries,
          ]}
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
