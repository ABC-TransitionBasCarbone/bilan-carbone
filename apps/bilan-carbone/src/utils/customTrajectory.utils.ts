import { SBTI_START_YEAR } from '@/constants/trajectory.constants'
import type { SectorPercentages } from '@/services/serverFunctions/trajectory.command'
import type {
  BaseObjective,
  ObjectiveGroup,
  OvershootAdjustment,
  PastStudy,
  TrajectoryData,
  TrajectoryDataPoint,
  TrajectoryWithObjectives,
} from '@/types/trajectory.types'
import { SectenInfo } from '@repo/db-common'
import { TrajectoryType } from '@repo/db-common/enums'
import { calculateSBTiTrajectory, getDefaultSBTIReductionRate } from './sbti'
import { calculateCustomSNBCSectoralTrajectory, calculateSNBCTrajectory } from './snbc'
import {
  addHistoricalDataAndStudyPoint,
  getObjectivesWithOvershootCompensation,
  getTrajectoryEmissionsAtYear,
  isFailedTrajectory,
  isWithinThreshold,
} from './trajectory-shared.utils'

interface CalculateCustomTrajectoryParams {
  studyEmissions: number
  studyStartYear: number
  objectives: BaseObjective[]
  objectiveGroups?: ObjectiveGroup[]
  pastStudies?: PastStudy[]
  overshootAdjustment?: OvershootAdjustment
  trajectoryType?: TrajectoryType
  minYear?: number
  maxYear?: number
  sectenData?: SectenInfo[]
  sectorPercentages?: SectorPercentages | null
  defaultTrajectory: TrajectoryDataPoint[]
}

/**
 * Extracts effective objectives (one per breakpoint year) from pre-computed trajectory data points.
 * Computes the average reduction rate per segment so the result can be fed
 * into getObjectivesWithOvershootCompensation.
 */
const extractEffectiveObjectives = (
  studyEmissions: number,
  studyStartYear: number,
  breakpointYears: number[],
  dataPoints: TrajectoryDataPoint[],
): BaseObjective[] => {
  const getEmissionsAtYear = (year: number): number => {
    if (year === studyStartYear) {
      return studyEmissions
    }
    return dataPoints.find((p) => p.year === year)?.value ?? studyEmissions
  }

  const effectiveObjectives: BaseObjective[] = []
  let prevYear = studyStartYear

  for (const year of breakpointYears) {
    if (year <= studyStartYear) {
      continue
    }
    const prevEmissions = getEmissionsAtYear(prevYear)
    const currentEmissions = getEmissionsAtYear(year)
    const years = year - prevYear
    const rate = years > 0 && prevEmissions > 0 ? (prevEmissions - currentEmissions) / prevEmissions / years : 0
    effectiveObjectives.push({ targetYear: year, reductionRate: Math.max(0, rate) })
    prevYear = year
  }

  return effectiveObjectives
} /**
 * Build the custom trajectory without reference until study start year using past studies and the study data
 * Then pick the desired reference value at the target year
 */

const getCustomTrajectoryEmissionsForYear = (
  trajectory: TrajectoryWithObjectives,
  year: number,
  pastStudies: PastStudy[],
  studyStartYear: number,
  studyEmissions: number,
  sectenData: SectenInfo[],
  defaultTrajectory: TrajectoryDataPoint[],
): number | null => {
  const baseTrajectoryWithoutOvershoot = calculateCustomTrajectory({
    studyEmissions,
    studyStartYear,
    objectives: trajectory.objectives,
    pastStudies,
    trajectoryType: trajectory.type,
    minYear: Math.min(year, SBTI_START_YEAR),
    maxYear: undefined,
    sectenData,
    defaultTrajectory,
  })

  return getTrajectoryEmissionsAtYear(baseTrajectoryWithoutOvershoot, year)
}

/**
 * Simulates each objective group independently year-by-year, then sums them.
 * Each group has its own emissions percentage (ratio) and its own chain of objectives.
 * Within an objective segment, yearlyReduction is fixed (rate × emissions at segment start).
 * When a segment ends, the next objective recalculates yearlyReduction on remaining emissions.
 */
const calculateObjectiveGroupTrajectory = (
  studyEmissions: number,
  studyStartYear: number,
  objectiveGroups: ObjectiveGroup[],
  maxYear: number,
): TrajectoryDataPoint[] => {
  const groupStates = objectiveGroups.map((group) => {
    const sortedObjectives = [...group.objectives].sort((a, b) => a.targetYear - b.targetYear)
    // Skip prefix objectives whose targetYear is already reached before the study starts
    const firstActiveIndex = sortedObjectives.findIndex((o) => o.targetYear > studyStartYear)
    const objectiveIndex = firstActiveIndex === -1 ? sortedObjectives.length : firstActiveIndex
    const groupEmissions = studyEmissions * group.ratio
    const activeObjective = sortedObjectives[objectiveIndex]
    return {
      emissions: groupEmissions,
      objectives: sortedObjectives,
      objectiveIndex,
      yearlyReduction: activeObjective ? groupEmissions * Number(activeObjective.reductionRate) : 0,
    }
  })

  const lastYear = Math.max(maxYear ?? 0, ...objectiveGroups.flatMap((g) => g.objectives.map((o) => o.targetYear)))

  const dataPoints: TrajectoryDataPoint[] = []
  for (let year = studyStartYear + 1; year <= lastYear; year++) {
    let totalEmissions = 0
    for (const state of groupStates) {
      // Only reduce if this group still has an active objective covering this year
      if (state.objectiveIndex < state.objectives.length && year <= state.objectives[state.objectiveIndex].targetYear) {
        state.emissions = Math.max(0, state.emissions - state.yearlyReduction)

        // End of current objective segment → advance and recalculate reduction
        if (year === state.objectives[state.objectiveIndex].targetYear) {
          state.objectiveIndex++
          if (state.objectiveIndex < state.objectives.length) {
            state.yearlyReduction = state.emissions * Number(state.objectives[state.objectiveIndex].reductionRate)
          } else {
            state.yearlyReduction = 0
          }
        }
      }
      // No active objective → emissions stay flat (yearlyReduction is 0)
      totalEmissions += state.emissions
    }
    dataPoints.push({ year, value: totalEmissions })
  }

  return dataPoints
}

export const calculateCustomTrajectory = ({
  studyEmissions,
  studyStartYear,
  objectives,
  objectiveGroups,
  pastStudies = [],
  overshootAdjustment,
  trajectoryType,
  minYear,
  maxYear,
  sectenData = [],
  sectorPercentages,
  defaultTrajectory,
}: CalculateCustomTrajectoryParams): TrajectoryDataPoint[] => {
  if (objectives.length === 0) {
    return []
  }

  if (trajectoryType === TrajectoryType.SBTI_15 || trajectoryType === TrajectoryType.SBTI_WB2C) {
    const reductionRate = getDefaultSBTIReductionRate(trajectoryType)
    if (reductionRate) {
      return calculateSBTiTrajectory({
        studyEmissions,
        studyStartYear,
        reductionRate,
        pastStudies,
        minYear,
        maxYear,
        defaultTrajectory,
      })
    }
  }

  if (trajectoryType === TrajectoryType.SNBC_SECTORAL) {
    if (!sectorPercentages) {
      throw new Error('Sector percentages required for SNBC_SECTORAL trajectory')
    }

    return calculateCustomSNBCSectoralTrajectory(
      {
        studyEmissions,
        studyStartYear,
        sectenData,
        pastStudies,
        displayCurrentStudyValueOnTrajectory: true,
        overshootAdjustment,
        maxYear,
      },
      sectorPercentages,
    )
  }

  if (trajectoryType === TrajectoryType.SNBC_GENERAL) {
    return calculateSNBCTrajectory({
      studyEmissions,
      studyStartYear,
      sectenData,
      pastStudies,
      displayCurrentStudyValueOnTrajectory: true,
      overshootAdjustment,
      maxYear,
    })
  }

  const dataPoints: TrajectoryDataPoint[] = []
  let actualEmissions = studyEmissions
  let startYear = studyStartYear

  addHistoricalDataAndStudyPoint(dataPoints, pastStudies, studyEmissions, studyStartYear, minYear)

  if (objectiveGroups && objectiveGroups.length > 0) {
    const scopeDataPoints = calculateObjectiveGroupTrajectory(
      studyEmissions,
      studyStartYear,
      objectiveGroups,
      maxYear ?? 0,
    )

    if (!overshootAdjustment) {
      dataPoints.push(...scopeDataPoints)
      return dataPoints
    }

    const breakpointYears = [...new Set(objectiveGroups.flatMap((g) => g.objectives.map((o) => o.targetYear)))].sort(
      (a, b) => a - b,
    )
    const effectiveObjectives = extractEffectiveObjectives(
      studyEmissions,
      studyStartYear,
      breakpointYears,
      scopeDataPoints,
    )
    const sortedObjectives = getObjectivesWithOvershootCompensation(
      actualEmissions,
      studyStartYear,
      effectiveObjectives,
      overshootAdjustment,
      pastStudies,
    )

    for (const objective of sortedObjectives) {
      const yearlyReduction = actualEmissions * Number(objective.reductionRate)
      for (let year = startYear + 1; year <= objective.targetYear; year++) {
        actualEmissions = Math.max(0, actualEmissions - yearlyReduction)
        dataPoints.push({ year, value: actualEmissions })
      }
      startYear = objective.targetYear
    }

    return dataPoints
  }

  let sortedObjectives = [...objectives].sort((a, b) => a.targetYear - b.targetYear)

  if (overshootAdjustment) {
    sortedObjectives = getObjectivesWithOvershootCompensation(
      actualEmissions,
      studyStartYear,
      sortedObjectives,
      overshootAdjustment,
      pastStudies,
    )
  }

  for (let i = 0; i < sortedObjectives.length; i++) {
    const objective = sortedObjectives[i]
    const absoluteReductionRate = Number(objective.reductionRate)
    const yearlyReduction = actualEmissions * absoluteReductionRate

    for (let year = startYear + 1; year <= objective.targetYear; year++) {
      actualEmissions = Math.max(0, actualEmissions - yearlyReduction)
      dataPoints.push({ year, value: actualEmissions })
    }

    startYear = objective.targetYear
  }

  return dataPoints
}

const getTrajectoryCustomData = (
  customTrajectory: TrajectoryWithObjectives,
  totalCo2: number,
  studyStartYear: number,
  pastStudies: PastStudy[],
  pastStudyReference: PastStudy | null,
  minYear: number,
  maxYear: number,
  sectenData: SectenInfo[],
  defaultTrajectory: TrajectoryDataPoint[],
  objectiveGroups?: ObjectiveGroup[],
): { id: string; data: TrajectoryData } => {
  let referenceYear: number | null = null
  let referenceEmissions: number | null = null

  if (
    !pastStudyReference &&
    (customTrajectory.type === TrajectoryType.SNBC_GENERAL || customTrajectory.type === TrajectoryType.SNBC_SECTORAL)
  ) {
    // For SNBC, default reference is 1990 but we use study start year to build the expected trajectory
    referenceYear = studyStartYear
    referenceEmissions = totalCo2
  } else if (
    pastStudyReference &&
    (customTrajectory.type === TrajectoryType.SNBC_GENERAL || customTrajectory.type === TrajectoryType.SNBC_SECTORAL)
  ) {
    // For SNBC with past study, use past study as reference point for reduction, not reference year
    referenceYear = pastStudyReference.year
    referenceEmissions = pastStudyReference.totalCo2
  } else if (customTrajectory.referenceYear) {
    referenceYear = customTrajectory.referenceYear
    referenceEmissions = getCustomTrajectoryEmissionsForYear(
      customTrajectory,
      referenceYear,
      pastStudies,
      studyStartYear,
      totalCo2,
      sectenData,
      defaultTrajectory,
    )
  } else if (pastStudyReference) {
    referenceYear = pastStudyReference.year
    referenceEmissions = pastStudyReference.totalCo2
  } else if (customTrajectory.type === TrajectoryType.SBTI_15 || customTrajectory.type === TrajectoryType.SBTI_WB2C) {
    // For custom SBTi trajectories: default to 2020 as reference year if no explicit referenceYear or past studies
    referenceYear = SBTI_START_YEAR
    referenceEmissions = totalCo2
  }

  if (!referenceYear || !referenceEmissions) {
    // No reference found, build the trajectory without reference
    return {
      id: customTrajectory.id,
      data: {
        previousTrajectoryStartYear: null,
        previousTrajectory: null,
        currentTrajectory: calculateCustomTrajectory({
          studyEmissions: totalCo2,
          studyStartYear,
          objectives: customTrajectory.objectives.map((obj) => ({
            targetYear: obj.targetYear,
            reductionRate: Number(obj.reductionRate),
          })),
          objectiveGroups,
          pastStudies,
          trajectoryType: customTrajectory.type,
          minYear,
          maxYear,
          sectenData,
          sectorPercentages: customTrajectory.sectorPercentages as SectorPercentages | undefined,
          defaultTrajectory,
        }),
        withinThreshold: true,
      },
    }
  } else {
    // Reference found, build the trajectory with reference
    const referenceTrajectory = calculateCustomTrajectory({
      studyEmissions: referenceEmissions,
      studyStartYear: referenceYear,
      objectives: customTrajectory.objectives.map((obj) => ({
        targetYear: obj.targetYear,
        reductionRate: Number(obj.reductionRate),
      })),
      objectiveGroups,
      pastStudies,
      trajectoryType: customTrajectory.type,
      minYear,
      maxYear,
      sectenData,
      sectorPercentages: customTrajectory.sectorPercentages as SectorPercentages | undefined,
      defaultTrajectory,
    })

    const referenceEmissionsForStudyStartYear = getTrajectoryEmissionsAtYear(referenceTrajectory, studyStartYear)
    const withinThreshold =
      referenceEmissionsForStudyStartYear !== null && isWithinThreshold(totalCo2, referenceEmissionsForStudyStartYear)

    const currentTrajectory = calculateCustomTrajectory({
      studyEmissions: totalCo2,
      studyStartYear,
      objectives: customTrajectory.objectives.map((obj) => ({
        targetYear: obj.targetYear,
        reductionRate: Number(obj.reductionRate),
      })),
      objectiveGroups,
      pastStudies,
      overshootAdjustment: withinThreshold
        ? undefined
        : {
            referenceTrajectory,
            referenceStudyYear: referenceYear,
          },
      trajectoryType: customTrajectory.type,
      minYear,
      maxYear,
      sectenData,
      sectorPercentages: customTrajectory.sectorPercentages as SectorPercentages | undefined,
      defaultTrajectory,
    })

    const isFailed = isFailedTrajectory(maxYear, referenceYear, referenceTrajectory, currentTrajectory, withinThreshold)
    return {
      id: customTrajectory.id,
      data: {
        previousTrajectoryStartYear: referenceYear,
        previousTrajectory: referenceTrajectory,
        currentTrajectory,
        withinThreshold,
        isFailed,
      },
    }
  }
}

export const getCustomData = (
  trajectories: TrajectoryWithObjectives[],
  selectedCustomTrajectoryIds: string[],
  totalCo2: number,
  studyStartYear: number,
  pastStudies: PastStudy[],
  pastStudyReference: PastStudy | null,
  minYear: number,
  maxYear: number,
  sectenData: SectenInfo[],
  objectiveGroupsByTrajectoryId?: Map<string, ObjectiveGroup[]>,
): {
  customTrajectoriesData: Array<{ id: string; data: TrajectoryData }>
  defaultTrajectoryData: { id: string; data: TrajectoryData } | null
} => {
  const customTrajectoriesData: Array<{ id: string; data: TrajectoryData }> = []

  const defaultTrajectory = trajectories.find((t) => t.isDefault)
  const defaultTrajectoryData = defaultTrajectory
    ? getTrajectoryCustomData(
        defaultTrajectory,
        totalCo2,
        studyStartYear,
        pastStudies,
        pastStudyReference,
        minYear,
        maxYear,
        sectenData,
        [],
        objectiveGroupsByTrajectoryId?.get(defaultTrajectory.id),
      )
    : null

  const defaultTrajectoryForSBTI =
    defaultTrajectoryData?.data.currentTrajectory.filter((p) => p.year <= SBTI_START_YEAR) ?? []

  const selectedCustomTrajectories = trajectories.filter((t) => selectedCustomTrajectoryIds.includes(t.id))

  for (const customTrajectory of selectedCustomTrajectories) {
    const customTrajectoryData = getTrajectoryCustomData(
      customTrajectory,
      totalCo2,
      studyStartYear,
      pastStudies,
      pastStudyReference,
      minYear,
      maxYear,
      sectenData,
      defaultTrajectoryForSBTI, // Used for SBTI past points
      objectiveGroupsByTrajectoryId?.get(customTrajectory.id),
    )
    customTrajectoriesData.push(customTrajectoryData)
  }
  return { customTrajectoriesData, defaultTrajectoryData }
}
