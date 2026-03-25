import {
  SECTEN_SECTORS,
  SectenSector,
  TRAJECTORY_15_ID,
  TRAJECTORY_SNBC_GENERAL_ID,
  TRAJECTORY_WB2C_ID,
} from '@/constants/trajectories'
import { FullStudy } from '@/db/study'
import { TrajectoryWithObjectives, TrajectoryWithObjectivesAndScope } from '@/db/transitionPlan'
import { SectorPercentages } from '@/services/serverFunctions/trajectory.command'
import { getStudyTotalCo2Emissions } from '@/services/study'
import { TrajectoryDataPoint } from '@/types/trajectory.types'
import { Translations } from '@/types/translation'
import { convertValue } from '@/utils/study'
import {
  ActionPotentialDeduction,
  StudyResultUnit,
  TrajectoryType,
} from '@repo/db-common/enums'
import {
  Action,
  ExternalStudy,
  SectenInfo,
} from '@repo/db-common'
import {
  calculateCustomSNBCSectoralTrajectory,
  calculateSectoralSNBCReductionRates,
  calculateSNBCTrajectory,
} from './snbc'
import { getYearFromDateStr } from './time'

export type SBTIType = 'SBTI_15' | 'SBTI_WB2C'
export const SBTI_REDUCTION_RATE_15 = 0.042
export const SBTI_REDUCTION_RATE_WB2C = 0.025
export const SBTI_START_YEAR = 2020
export const MID_TARGET_YEAR = 2030
export const TARGET_YEAR = 2050
export const OVERSHOOT_THRESHOLD = 0.05
const SNBC_DISPLAYED_REFERENCE_YEAR = 1990

export interface PastStudy {
  id: string
  name: string
  type: 'linked' | 'external'
  year: number
  totalCo2: number
}

export interface BaseObjective {
  targetYear: number
  reductionRate: number
}

export interface OvershootAdjustment {
  referenceTrajectory: TrajectoryDataPoint[]
  referenceStudyYear: number
}

interface CalculateSbtiTrajectoryParams {
  studyEmissions: number
  studyStartYear: number
  reductionRate: number
  startYear?: number
  endYear?: number
  minYear?: number
  maxYear?: number
  pastStudies?: PastStudy[]
  defaultTrajectory: TrajectoryDataPoint[]
}

export interface CalculateTrajectoryParams {
  studyEmissions: number
  studyStartYear: number
  sectenData: SectenInfo[]
  pastStudies?: PastStudy[]
  displayCurrentStudyValueOnTrajectory?: boolean
  overshootAdjustment?: OvershootAdjustment
  maxYear?: number
}

interface CalculateCustomTrajectoryParams {
  studyEmissions: number
  studyStartYear: number
  objectives: BaseObjective[]
  pastStudies?: PastStudy[]
  overshootAdjustment?: OvershootAdjustment
  trajectoryType?: TrajectoryType
  minYear?: number
  maxYear?: number
  sectenData?: SectenInfo[]
  sectorPercentages?: SectorPercentages | null
  defaultTrajectory: TrajectoryDataPoint[]
}

interface CalculateActionBasedTrajectoryParams {
  studyEmissions: number
  studyStartYear: number
  studyUnit: StudyResultUnit
  actions: Action[]
  pastStudies?: PastStudy[]
  minYear?: number
  maxYear?: number
}

export interface CalculateTrajectoriesWithHistoryParams {
  studyId: string
  studyName: string
  studyStartDate: Date
  studyResultsUnit: StudyResultUnit
  totalCo2: number
  withDependencies: boolean
  trajectories: TrajectoryWithObjectives[]
  actions: Action[]
  pastStudies: PastStudy[]
  selectedSnbcTrajectories: string[]
  selectedSbtiTrajectories: string[]
  selectedCustomTrajectoryIds: string[]
  sectenData?: SectenInfo[]
}

export interface TrajectoryYearBounds {
  minYear: number
  maxYear: number
}

export const convertToPastStudies = (
  linkedStudies: FullStudy[],
  externalStudies: ExternalStudy[],
  validatedOnly: boolean,
  studyUnit: StudyResultUnit,
): PastStudy[] => {
  const pastStudies: PastStudy[] = []

  linkedStudies.forEach((study) => {
    const totalCo2InLinkedUnit = getStudyTotalCo2Emissions(study, true, validatedOnly)
    const totalCo2 = convertValue(totalCo2InLinkedUnit, study.resultsUnit, studyUnit)

    pastStudies.push({
      id: study.id,
      name: study.name,
      type: 'linked',
      year: study.startDate.getFullYear(),
      totalCo2,
    })
  })

  externalStudies.forEach((study) => {
    pastStudies.push({
      id: study.id,
      name: study.name,
      type: 'external',
      year: study.date.getFullYear(),
      totalCo2: convertValue(Number(study.totalCo2Kg), StudyResultUnit.K, studyUnit),
    })
  })

  return pastStudies.sort((a, b) => a.year - b.year)
}

/**
 * Calculate consistent min and max years for all trajectory graphs
 */
export const calculateTrajectoryYearBounds = (
  snbcEnabled: boolean,
  pastStudies: PastStudy[],
  trajectories: TrajectoryWithObjectives[],
  selectedCustomTrajectoryIds: string[],
  actions: Action[],
): TrajectoryYearBounds => {
  let minYear: number
  let maxYear = TARGET_YEAR

  const earliestPastStudyYear = getEarliestPastStudyYear(pastStudies)
  minYear = earliestPastStudyYear !== null ? Math.min(SBTI_START_YEAR, earliestPastStudyYear) : SBTI_START_YEAR

  if (snbcEnabled) {
    minYear = Math.min(minYear, SNBC_DISPLAYED_REFERENCE_YEAR)
  }

  const selectedCustomTrajectories = trajectories.filter((t) => selectedCustomTrajectoryIds.includes(t.id))
  if (selectedCustomTrajectories.length > 0) {
    // Get earliest reference year for min year
    const referenceYears = selectedCustomTrajectories.map((t) => t.referenceYear).filter((year) => year !== null)
    if (referenceYears.length > 0) {
      const earliestReferenceYear = Math.min(...referenceYears)
      minYear = Math.min(minYear, earliestReferenceYear)
    }

    // For custom SNBC trajectories, use SNBC_REFERENCE_YEAR (1990) as min year
    const hasCustomSNBC = selectedCustomTrajectories.some(
      (t) => t.type === TrajectoryType.SNBC_GENERAL || t.type === TrajectoryType.SNBC_SECTORAL,
    )
    if (hasCustomSNBC) {
      minYear = Math.min(minYear, SNBC_DISPLAYED_REFERENCE_YEAR)
    }

    // Get latest objective year for max year
    const latestObjectiveYear = Math.max(
      ...selectedCustomTrajectories.flatMap((t) => t.objectives.map((obj) => obj.targetYear)),
    )
    maxYear = Math.max(maxYear, latestObjectiveYear)
  }

  const enabledActions = actions.filter((action) => action.enabled)
  const quantitativeActions = enabledActions.filter(
    (action) => action.potentialDeduction === ActionPotentialDeduction.Quantity && action.reductionEndYear !== null,
  )

  if (quantitativeActions.length > 0) {
    const latestActionYear = Math.max(
      ...quantitativeActions.map((action) => getYearFromDateStr(action.reductionEndYear!)),
    )
    maxYear = Math.max(maxYear, latestActionYear)
  }

  return { minYear, maxYear }
}

export interface TrajectoryData {
  previousTrajectoryStartYear: number | null
  previousTrajectory: TrajectoryDataPoint[] | null
  currentTrajectory: TrajectoryDataPoint[]
  withinThreshold: boolean
  isFailed?: boolean
}

export interface TrajectoryResult {
  sbti15: TrajectoryData | null
  sbtiWB2C: TrajectoryData | null
  snbc: { [trajectoryId: string]: TrajectoryData | null }
  customTrajectories: Array<{ id: string; data: TrajectoryData }>
  actionBased: TrajectoryData | null
}

export const getLatestPastStudy = (pastStudies: PastStudy[]): PastStudy | null => {
  if (pastStudies.length === 0) {
    return null
  }
  return pastStudies.reduce((mostRecent, current) => (current.year > mostRecent.year ? current : mostRecent))
}

// Get the earliest reference study after 2020 (closest to 2020)
export const getEarliestReferenceStudyAfter2020 = (pastStudies: PastStudy[]): PastStudy | null => {
  const studiesAfter2020 = pastStudies.filter((s) => s.year > SBTI_START_YEAR)

  if (studiesAfter2020.length === 0) {
    return null
  }

  return studiesAfter2020.reduce((earliest, current) => (current.year < earliest.year ? current : earliest))
}

/**
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

export const getEarliestPastStudyYear = (pastStudies: PastStudy[]): number | null => {
  if (pastStudies.length === 0) {
    return null
  }
  return Math.min(...pastStudies.map((s) => s.year))
}

export const getGraphStartYear = (
  pastStudies: PastStudy[],
  minYear?: number,
  fallbackYear: number = SBTI_START_YEAR,
): number => {
  let graphStartYear = fallbackYear
  if (minYear) {
    graphStartYear = Math.min(graphStartYear, minYear)
  }

  const earliestPastStudyYear = getEarliestPastStudyYear(pastStudies)
  if (earliestPastStudyYear !== null) {
    graphStartYear = Math.min(graphStartYear, earliestPastStudyYear)
  }

  return graphStartYear
}

export const getTrajectoryEmissionsAtYear = (trajectory: TrajectoryDataPoint[], year: number): number | null => {
  const point = trajectory.find((p) => p.year === year)
  return point ? point.value : null
}

export const isWithinThreshold = (
  actualValue: number,
  referenceValue: number,
  threshold: number = OVERSHOOT_THRESHOLD,
): boolean => {
  return actualValue <= referenceValue * (1 + threshold)
}

// Helper function to calculate integral of a linear trajectory
// For a linear trajectory going from startValue to endValue over numberOfYears
// This is the area under the trapezoid: (startValue + endValue) * years / 2
const calculateLinearTrajectoryIntegral = (startValue: number, endValue: number, numberOfYears: number): number => {
  return ((startValue + endValue) * numberOfYears) / 2
}

export const calculateTrajectoryIntegral = (
  trajectory: TrajectoryDataPoint[],
  startYear: number,
  endYear: number,
): number => {
  let integral = 0
  for (let i = 0; i < trajectory.length - 1; i++) {
    const current = trajectory[i]
    const next = trajectory[i + 1]

    if (current.year >= startYear && next.year <= endYear) {
      integral += calculateLinearTrajectoryIntegral(current.value, next.value, 1)
    }
  }
  return integral
}

export const getAllHistoricalStudyPoints = (
  pastStudies: PastStudy[],
  defaultTrajectory?: TrajectoryDataPoint[],
): Array<{ year: number; emissions: number }> => {
  const historicalPoints = pastStudies
    .map((s) => ({ year: s.year, emissions: s.totalCo2 }))
    .sort((a, b) => a.year - b.year)

  if (defaultTrajectory) {
    // Add default trajectory points as historical points to use them for interpolation (SBTI only for now)
    return [...historicalPoints, ...defaultTrajectory.map((p) => ({ year: p.year, emissions: p.value }))].sort(
      (a, b) => a.year - b.year,
    )
  }
  return historicalPoints
}

const buildTrajectoryFromHistoricalPoints = (
  startYear: number,
  endYear: number,
  endYearEmissions: number,
  historicalPoints: Array<{ year: number; emissions: number }>,
): TrajectoryDataPoint[] => {
  const trajectory: TrajectoryDataPoint[] = []

  for (let year = startYear; year <= endYear; year++) {
    const value = computePastOrPresentValue(year, historicalPoints, endYearEmissions, endYear)
    if (value !== null) {
      trajectory.push({ year, value })
    }
  }

  return trajectory
}

/**
 * Adds historical data points before the study start year and the study start year point to the trajectory
 */
const addHistoricalDataAndStudyPoint = (
  dataPoints: TrajectoryDataPoint[],
  pastStudies: PastStudy[],
  studyEmissions: number,
  studyStartYear: number,
  minYear?: number, // Used if a custom reference year is set
): void => {
  const graphStartYear = getGraphStartYear(pastStudies, minYear)
  const historicalPoints = getAllHistoricalStudyPoints(pastStudies)

  // Add historical data before the study start year
  for (let year = graphStartYear; year < studyStartYear; year++) {
    const dataPoint = computeValue(year, historicalPoints, studyEmissions, studyStartYear)

    if (dataPoint) {
      dataPoints.push(dataPoint)
    }
  }

  // Add the actual study data point
  dataPoints.push({ year: studyStartYear, value: studyEmissions })
}

const interpolateValue = (
  yearToInterpolate: number,
  startYear: number,
  endYear: number,
  startValue: number,
  endValue: number,
): number => {
  const ratio = (yearToInterpolate - startYear) / (endYear - startYear)
  return startValue + ratio * (endValue - startValue)
}

export const computePastOrPresentValue = (
  year: number,
  historicalPoints: Array<{ year: number; emissions: number }>,
  studyEmissions: number,
  studyStartYear: number,
): number | null => {
  if (year === studyStartYear) {
    return studyEmissions
  }

  const foundHistoricalPoint = historicalPoints.find((p) => p.year === year)
  if (foundHistoricalPoint) {
    return foundHistoricalPoint.emissions
  }

  if (year < studyStartYear) {
    const pointBefore = historicalPoints.filter((p) => p.year < year).sort((a, b) => b.year - a.year)[0]
    let pointAfter = historicalPoints
      .filter((p) => p.year > year && p.year <= studyStartYear)
      .sort((a, b) => a.year - b.year)[0]

    if (!pointBefore) {
      // Get the closet point after
      return pointAfter?.emissions ?? studyEmissions
    }

    if (!pointAfter) {
      pointAfter = {
        year: studyStartYear,
        emissions: studyEmissions,
      }
    }

    if (pointBefore.year === pointAfter.year) {
      return pointBefore.emissions
    }

    return interpolateValue(year, pointBefore.year, pointAfter.year, pointBefore.emissions, pointAfter.emissions)
  }

  return null
}

const computeValue = (
  year: number,
  historicalPoints: Array<{ year: number; emissions: number }>,
  studyEmissions: number,
  studyStartYear: number,
  reductionStartYear?: number,
  reductionRate?: number,
): { year: number; value: number } | null => {
  if (year <= studyStartYear) {
    const pastOrPresentValue = computePastOrPresentValue(year, historicalPoints, studyEmissions, studyStartYear)

    if (pastOrPresentValue === null) {
      return null
    }

    return { year, value: pastOrPresentValue }
  }

  if (!reductionStartYear) {
    throw Error('trying to find future dots without reductionStartYear')
  }

  return computeFutureValue(year, studyEmissions, reductionStartYear, reductionRate, historicalPoints, studyStartYear)
}

const computeFutureValue = (
  year: number,
  studyEmissions: number,
  thresholdYear: number,
  absoluteReductionRate: number | undefined,
  historicalPoints: Array<{ year: number; emissions: number }>,
  studyStartYear: number,
): TrajectoryDataPoint => {
  let baseEmissions = studyEmissions

  // If there are no past studies, we assume emissions are stable until the threshold year
  if (historicalPoints.length === 0 && year <= thresholdYear) {
    return { year, value: studyEmissions }
  }

  // Interpolate the value between study start year and 2020 based on past study before 2020 and actual study included in the historical points
  if (historicalPoints.length > 0 && studyStartYear < thresholdYear) {
    const historicalPointsAfterThresholdYear = historicalPoints.filter((p) => p.year >= thresholdYear)

    if (historicalPointsAfterThresholdYear.length > 0) {
      const earliestFuturePoint = historicalPointsAfterThresholdYear.reduce((earliest, current) =>
        current.year < earliest.year ? current : earliest,
      )

      if (year <= thresholdYear && year > studyStartYear) {
        // Interpolate the value between study start year and the threshold year included
        const interpolatedValue = interpolateValue(
          year,
          studyStartYear,
          earliestFuturePoint.year,
          studyEmissions,
          earliestFuturePoint.emissions,
        )
        return { year, value: interpolatedValue }
      }

      if (year > thresholdYear) {
        // Calculate the base emissions at the threshold year as base for the reduction rate calculation
        baseEmissions = interpolateValue(
          thresholdYear,
          studyStartYear,
          earliestFuturePoint.year,
          studyEmissions,
          earliestFuturePoint.emissions,
        )
      }
    } else if (year <= thresholdYear) {
      // Studies are before threshold: emissions are stable between studyStartYear and thresholdYear
      return { year, value: studyEmissions }
    }
  }

  if (!absoluteReductionRate) {
    throw Error('trying to find future dots without absoluteReductionRate')
  }

  const yearsFromThreshold = year - thresholdYear
  const newEmissions = baseEmissions - yearsFromThreshold * absoluteReductionRate * baseEmissions
  return { year, value: Math.max(0, newEmissions) }
}

export const getSBTiCorrectedRateAndEndYear = (
  studyEmissions: number,
  studyStartYear: number,
  reductionRate: number,
  historicalPoints: Array<{ year: number; emissions: number }>,
): { correctedRate: number; endYear: number } => {
  let emissionsValue2020 = studyEmissions

  if (historicalPoints.length > 0) {
    // Use historical data to compute actual overshoot
    const computedEmissionsValue2020 = computePastOrPresentValue(
      SBTI_START_YEAR,
      historicalPoints,
      studyEmissions,
      studyStartYear,
    )

    if (computedEmissionsValue2020 !== null) {
      emissionsValue2020 = computedEmissionsValue2020
    }
  }

  const yearsSince2020 = studyStartYear - SBTI_START_YEAR
  const referenceYearlyReduction = emissionsValue2020 * reductionRate
  const referenceValueAtStudyYear = emissionsValue2020 - yearsSince2020 * referenceYearlyReduction

  const referenceBudgetFrom2020ToStudyYear = calculateLinearTrajectoryIntegral(
    emissionsValue2020,
    referenceValueAtStudyYear,
    yearsSince2020,
  )

  let pastOvershoot = 0
  // Calculate actual overshoot based on wheter we have historical data
  if (historicalPoints.length > 0) {
    const actualTrajectoryFrom2020ToStudyYear = buildTrajectoryFromHistoricalPoints(
      SBTI_START_YEAR,
      studyStartYear,
      studyEmissions,
      historicalPoints,
    )

    const actualBudgetUsedFrom2020ToStudyYear = calculateTrajectoryIntegral(
      actualTrajectoryFrom2020ToStudyYear,
      SBTI_START_YEAR,
      studyStartYear,
    )

    pastOvershoot = actualBudgetUsedFrom2020ToStudyYear - referenceBudgetFrom2020ToStudyYear
  } else {
    // When there is no historical data, we assume emissions are stable between 2020 and studyStartYear
    const actualBudgetUsedFrom2020ToStudyYear = calculateLinearTrajectoryIntegral(
      studyEmissions,
      studyEmissions,
      yearsSince2020,
    )

    pastOvershoot = actualBudgetUsedFrom2020ToStudyYear - referenceBudgetFrom2020ToStudyYear
  }

  // Calculate remaining budget from study year to zero emissions
  // This represents the total carbon budget if following the reference linear reduction trajectory
  const remainingReferenceYearsFromStudyYearToZero = referenceValueAtStudyYear / referenceYearlyReduction
  const remainingReferenceBudgetFromStudyYearToZero =
    (referenceValueAtStudyYear * remainingReferenceYearsFromStudyYearToZero) / 2

  // The total budget remaining compensates for past overshoot
  const totalRemainingBudget = remainingReferenceBudgetFromStudyYearToZero - pastOvershoot

  // Now calculate the rate needed starting from actual emissions to match this budget
  const targetYears = (2 * totalRemainingBudget) / studyEmissions
  const targetEndYear = studyStartYear + targetYears
  const newReductionRate = 1 / targetYears
  const newEndYear = Math.ceil(targetEndYear)

  return { correctedRate: newReductionRate, endYear: newEndYear }
}

export const calculateSBTiTrajectory = ({
  studyEmissions,
  studyStartYear,
  reductionRate,
  minYear,
  maxYear,
  pastStudies = [],
  defaultTrajectory,
}: CalculateSbtiTrajectoryParams): TrajectoryDataPoint[] => {
  const dataPoints: TrajectoryDataPoint[] = []
  const historicalPoints = getAllHistoricalStudyPoints(pastStudies, defaultTrajectory)
  const graphStartYear =
    defaultTrajectory?.[0]?.year ?? getGraphStartYear(pastStudies, minYear) ?? Math.min(studyStartYear, SBTI_START_YEAR)

  const earliestPastStudyYear = getEarliestPastStudyYear(pastStudies)
  const snbcPivotYear =
    earliestPastStudyYear !== null ? Math.min(earliestPastStudyYear, SBTI_START_YEAR) : SBTI_START_YEAR

  if (studyEmissions === 0) {
    const graphEndYear = maxYear ?? TARGET_YEAR

    for (let year = graphStartYear; year <= graphEndYear; year++) {
      const pastEmissions = computePastOrPresentValue(
        year,
        pastStudies.map((study) => ({ year: study.year, emissions: study.totalCo2 })),
        studyEmissions,
        studyStartYear,
      )

      if (pastEmissions !== null) {
        dataPoints.push({ year, value: pastEmissions })
      } else {
        dataPoints.push({ year, value: 0 })
      }
    }

    return dataPoints
  }

  if (studyStartYear > SBTI_START_YEAR) {
    const { correctedRate: newReductionRate, endYear: newEndYear } = getSBTiCorrectedRateAndEndYear(
      studyEmissions,
      studyStartYear,
      reductionRate,
      historicalPoints,
    )

    for (let year = graphStartYear; year <= Math.max(newEndYear, maxYear ?? TARGET_YEAR); year++) {
      if (defaultTrajectory && year <= snbcPivotYear) {
        // Follow the default trajectory until pivot year included
        const snbcPoint = defaultTrajectory.find((p: TrajectoryDataPoint) => p.year === year)
        if (snbcPoint) {
          dataPoints.push(snbcPoint)
        }
        continue
      }

      const dataPoint = computeValue(
        year,
        historicalPoints,
        studyEmissions,
        studyStartYear,
        studyStartYear,
        newReductionRate,
      )

      if (dataPoint) {
        dataPoints.push(dataPoint)
      }
    }
  } else {
    const reductionStartYear = SBTI_START_YEAR
    const targetYear = Math.ceil(SBTI_START_YEAR + 1 / reductionRate)
    const endYear = Math.max(targetYear, maxYear ?? TARGET_YEAR)

    for (let year = graphStartYear; year <= endYear; year++) {
      if (defaultTrajectory && year <= snbcPivotYear) {
        // Follow the default trajectory until pivot year included
        const snbcPoint = defaultTrajectory.find((p: TrajectoryDataPoint) => p.year === year)
        if (snbcPoint) {
          dataPoints.push(snbcPoint)
        }
        continue
      }

      const dataPoint = computeValue(
        year,
        historicalPoints,
        studyEmissions,
        studyStartYear,
        reductionStartYear,
        reductionRate,
      )

      if (dataPoint) {
        dataPoints.push(dataPoint)
      }
    }
  }

  return dataPoints
}

/**
 * Calculates adjusted objectives rates to compensate for carbon budget overshoot.
 *
 * When actual emissions exceed the reference trajectory between referenceYear and studyYear,
 * this function increases reduction rates for future years to compensate for the overshoot
 * and maintain the same total carbon budget.
 *
 * Uses Newton-Raphson iteration to find the optimal multiplier k.
 */
export const getObjectivesWithOvershootCompensation = (
  actualEmissions: number,
  studyYear: number,
  objectives: BaseObjective[],
  overshootAdjustment: OvershootAdjustment,
  pastStudies: PastStudy[],
): BaseObjective[] => {
  const { referenceTrajectory, referenceStudyYear } = overshootAdjustment
  const historicalPoints = getAllHistoricalStudyPoints(pastStudies)

  const trajectoryFromReferenceYearToStudyYear = buildTrajectoryFromHistoricalPoints(
    referenceStudyYear,
    studyYear,
    actualEmissions,
    historicalPoints,
  )

  const actualBudgetUsedFromReferenceYearToStudyYear = calculateTrajectoryIntegral(
    trajectoryFromReferenceYearToStudyYear,
    referenceStudyYear,
    studyYear,
  )

  const referenceBudgetFromReferenceYearToStudyYear = calculateTrajectoryIntegral(
    referenceTrajectory,
    referenceStudyYear,
    studyYear,
  )

  const pastOvershoot = actualBudgetUsedFromReferenceYearToStudyYear - referenceBudgetFromReferenceYearToStudyYear

  if (pastOvershoot <= 0 || objectives.length === 0) {
    return objectives
  }

  const referenceEmissionsAtStudyYear = getTrajectoryEmissionsAtYear(referenceTrajectory, studyYear)
  if (referenceEmissionsAtStudyYear === null) {
    return objectives
  }

  // Calculate future budget if we were at reference emissions
  // Use objectives directly since they represent the actual trajectory behavior
  // (for SNBC_SECTORAL, objectives are derived from the combined sectoral trajectory)
  const referenceFutureBudget = calculateBudgetWithObjectivesAndMultiplier(
    referenceEmissionsAtStudyYear,
    studyYear,
    objectives,
    1,
  )

  // Reduce future budget to compensate for past overshoot
  const remainingTotalBudget = referenceFutureBudget - pastOvershoot

  // Newton-Raphson iteration to find k such that budget(k) = remainingTotalBudget
  const delta = 0.0001
  let k = 1

  for (let i = 0; i < 10; i++) {
    const budgetAtK = calculateBudgetWithObjectivesAndMultiplier(actualEmissions, studyYear, objectives, k)
    const error = budgetAtK - remainingTotalBudget

    if (Math.abs(error / remainingTotalBudget) < 0.001) {
      break
    }

    const budgetAtKPlusDelta = calculateBudgetWithObjectivesAndMultiplier(
      actualEmissions,
      studyYear,
      objectives,
      k + delta,
    )
    const derivativeAtK = (budgetAtKPlusDelta - budgetAtK) / delta

    if (Math.abs(derivativeAtK) > 1e-10) {
      k = k - error / derivativeAtK
    }
  }

  // Apply multiplier k to all objective rates
  const correctedObjectives: BaseObjective[] = objectives.map((obj) => ({
    targetYear: obj.targetYear,
    reductionRate: Math.max(0, obj.reductionRate * k),
  }))

  return correctedObjectives
}

export const getDefaultSBTIReductionRate = (sbtiType: TrajectoryType): number | undefined => {
  if (sbtiType === TrajectoryType.SBTI_15) {
    return SBTI_REDUCTION_RATE_15
  } else if (sbtiType === TrajectoryType.SBTI_WB2C) {
    return SBTI_REDUCTION_RATE_WB2C
  }
  return undefined
}

export const calculateCustomTrajectory = ({
  studyEmissions,
  studyStartYear,
  objectives,
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

export const getDefaultObjectivesForTrajectoryType = (type: TrajectoryType): BaseObjective[] | undefined => {
  if (type === TrajectoryType.SBTI_15) {
    return [
      { targetYear: MID_TARGET_YEAR, reductionRate: SBTI_REDUCTION_RATE_15 },
      { targetYear: TARGET_YEAR, reductionRate: SBTI_REDUCTION_RATE_15 },
    ]
  }

  if (type === TrajectoryType.SBTI_WB2C) {
    return [
      { targetYear: MID_TARGET_YEAR, reductionRate: SBTI_REDUCTION_RATE_WB2C },
      { targetYear: TARGET_YEAR, reductionRate: SBTI_REDUCTION_RATE_WB2C },
    ]
  }

  return undefined
}

export const getTrajectoryTypeLabel = (type: TrajectoryType, t: Translations) => {
  switch (type) {
    case TrajectoryType.SBTI_15:
      return 'SBTi 1.5°C'
    case TrajectoryType.SBTI_WB2C:
      return 'SBTi WB2C'
    case TrajectoryType.SNBC_GENERAL:
      return t('snbcGeneral')
    case TrajectoryType.SNBC_SECTORAL:
      return t('snbcSectoral')
    case TrajectoryType.CUSTOM:
      return t('custom')
    default:
      return type
  }
}

const isSectenSector = (sectorId: string): sectorId is SectenSector => {
  return SECTEN_SECTORS.includes(sectorId as SectenSector)
}

const calculateSNBCTrajectoryByType = (sectorId: string, params: CalculateTrajectoryParams): TrajectoryDataPoint[] => {
  if (sectorId === TRAJECTORY_SNBC_GENERAL_ID) {
    return calculateSNBCTrajectory(params)
  }
  if (isSectenSector(sectorId)) {
    return calculateSNBCTrajectory(params, sectorId)
  }
  return []
}

export const getSNBCData = (
  selectedSnbcTrajectories: string[],
  sectenData: SectenInfo[],
  referenceStudyData: PastStudy | null,
  pastStudies: PastStudy[],
  studyStartYear: number,
  totalCo2: number,
  maxYear: number,
): { [sectorId: string]: TrajectoryData | null } => {
  const result: { [sectorId: string]: TrajectoryData | null } = {}

  for (const sectorId of selectedSnbcTrajectories) {
    if (!referenceStudyData) {
      result[sectorId] = {
        previousTrajectoryStartYear: null,
        previousTrajectory: null,
        currentTrajectory: calculateSNBCTrajectoryByType(sectorId, {
          studyEmissions: totalCo2,
          studyStartYear,
          sectenData,
          pastStudies,
          maxYear,
        }),
        withinThreshold: true,
      }
    } else {
      const referenceTrajectory = calculateSNBCTrajectoryByType(sectorId, {
        studyEmissions: referenceStudyData.totalCo2,
        studyStartYear: referenceStudyData.year,
        sectenData,
        pastStudies: pastStudies.filter((s) => s.year < referenceStudyData.year),
        maxYear,
      })

      const referenceEmissionsForStudyStartYear = getTrajectoryEmissionsAtYear(referenceTrajectory, studyStartYear)
      const withinThreshold =
        referenceEmissionsForStudyStartYear !== null && isWithinThreshold(totalCo2, referenceEmissionsForStudyStartYear)

      let currentTrajectory: TrajectoryDataPoint[]

      if (withinThreshold) {
        currentTrajectory = [{ year: studyStartYear, value: totalCo2 }]
      } else {
        currentTrajectory = calculateSNBCTrajectoryByType(sectorId, {
          studyEmissions: totalCo2,
          studyStartYear,
          sectenData,
          pastStudies,
          displayCurrentStudyValueOnTrajectory: true,
          overshootAdjustment: {
            referenceTrajectory,
            referenceStudyYear: referenceStudyData.year,
          },
          maxYear,
        })
      }

      const isFailed = isFailedTrajectory(
        maxYear,
        referenceStudyData.year,
        referenceTrajectory,
        currentTrajectory,
        withinThreshold,
      )

      result[sectorId] = {
        previousTrajectoryStartYear: referenceStudyData.year,
        previousTrajectory: referenceTrajectory,
        currentTrajectory,
        withinThreshold,
        isFailed,
      }
    }
  }

  return result
}

/**
 * Method which calculates SBTI data for any type (1.5°C or WB2C)
 */
const calculateSBTiData = (
  reductionRate: number,
  emissionsAt2020: number,
  totalCo2: number,
  studyStartYear: number,
  pastStudies: PastStudy[],
  minYear: number,
  maxYear: number,
  defaultTrajectory: TrajectoryDataPoint[],
): TrajectoryData => {
  const referenceTrajectory = calculateSBTiTrajectory({
    studyEmissions: emissionsAt2020,
    studyStartYear: SBTI_START_YEAR,
    reductionRate,
    pastStudies,
    minYear,
    maxYear,
    defaultTrajectory,
  })

  const referenceEmissionsForStudyStartYear = getTrajectoryEmissionsAtYear(referenceTrajectory, studyStartYear)
  const withinThreshold =
    referenceEmissionsForStudyStartYear !== null && isWithinThreshold(totalCo2, referenceEmissionsForStudyStartYear)

  const currentTrajectory: TrajectoryDataPoint[] = withinThreshold
    ? [{ year: studyStartYear, value: totalCo2 }]
    : calculateSBTiTrajectory({
        studyEmissions: totalCo2,
        studyStartYear,
        reductionRate,
        pastStudies,
        minYear,
        maxYear,
        defaultTrajectory,
      })

  return {
    previousTrajectoryStartYear: SBTI_START_YEAR,
    previousTrajectory: referenceTrajectory,
    currentTrajectory,
    withinThreshold,
    isFailed: isFailedTrajectory(maxYear, SBTI_START_YEAR, referenceTrajectory, currentTrajectory, withinThreshold),
  }
}

export const getDefaultSBTiData = (
  pastStudies: PastStudy[],
  sbti15Enabled: boolean,
  sbtiWB2CEnabled: boolean,
  totalCo2: number,
  studyStartYear: number,
  minYear: number,
  maxYear: number,
  defaultTrajectory: TrajectoryDataPoint[],
): { sbti15Data: TrajectoryData | null; sbtiWB2CData: TrajectoryData | null } => {
  if (defaultTrajectory.length === 0) {
    return { sbti15Data: null, sbtiWB2CData: null }
  }

  // SBTi reference year is always 2020
  const emissionsAt2020 = getTrajectoryEmissionsAtYear(defaultTrajectory, SBTI_START_YEAR)!

  return {
    sbti15Data: sbti15Enabled
      ? calculateSBTiData(
          SBTI_REDUCTION_RATE_15,
          emissionsAt2020,
          totalCo2,
          studyStartYear,
          pastStudies,
          minYear,
          maxYear,
          defaultTrajectory,
        )
      : null,
    sbtiWB2CData: sbtiWB2CEnabled
      ? calculateSBTiData(
          SBTI_REDUCTION_RATE_WB2C,
          emissionsAt2020,
          totalCo2,
          studyStartYear,
          pastStudies,
          minYear,
          maxYear,
          defaultTrajectory,
        )
      : null,
  }
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
    )
    customTrajectoriesData.push(customTrajectoryData)
  }
  return { customTrajectoriesData, defaultTrajectoryData }
}

export const getActionBasedData = (
  actions: Action[],
  pastStudies: PastStudy[],
  totalCo2: number,
  studyStartYear: number,
  studyUnit: StudyResultUnit,
  referenceStudyData: PastStudy | null,
  withDependencies: boolean,
  minYear: number,
  maxYear: number,
) => {
  const enabledActions = actions.filter((action) => action.enabled)

  if (!referenceStudyData) {
    return {
      previousTrajectoryStartYear: null,
      previousTrajectory: null,
      currentTrajectory: calculateActionBasedTrajectory({
        studyEmissions: totalCo2,
        studyStartYear,
        actions: enabledActions,
        pastStudies,
        minYear,
        maxYear,
        studyUnit,
      }),
      withinThreshold: true,
    }
  } else {
    const referenceYear = referenceStudyData.year
    const referenceEmissions = referenceStudyData.totalCo2

    const referenceActionTrajectory = calculateActionBasedTrajectory({
      studyEmissions: referenceEmissions,
      studyStartYear: referenceYear,
      actions: enabledActions,
      pastStudies,
      minYear,
      maxYear,
      studyUnit,
    })

    const referenceActionValue = getTrajectoryEmissionsAtYear(referenceActionTrajectory, studyStartYear)
    const actionWithinThreshold = referenceActionValue !== null && isWithinThreshold(totalCo2, referenceActionValue)

    const currentActionTrajectory = calculateActionBasedTrajectory({
      studyEmissions: totalCo2,
      studyStartYear,
      actions: enabledActions,
      pastStudies,
      minYear,
      maxYear,
      studyUnit,
    })

    return {
      previousTrajectoryStartYear: referenceYear,
      previousTrajectory: actionWithinThreshold ? null : referenceActionTrajectory,
      currentTrajectory: currentActionTrajectory,
      withinThreshold: actionWithinThreshold,
    }
  }
}

export const calculateTrajectoriesWithHistory = ({
  studyStartDate,
  studyResultsUnit,
  totalCo2,
  withDependencies,
  trajectories,
  actions,
  pastStudies,
  selectedSnbcTrajectories,
  selectedSbtiTrajectories,
  selectedCustomTrajectoryIds,
  sectenData = [],
}: CalculateTrajectoriesWithHistoryParams): TrajectoryResult => {
  const studyStartYear = studyStartDate.getFullYear()
  const sbti15Enabled = selectedSbtiTrajectories.includes(TRAJECTORY_15_ID)
  const sbtiWB2CEnabled = selectedSbtiTrajectories.includes(TRAJECTORY_WB2C_ID)
  const snbcEnabled = selectedSnbcTrajectories.length > 0

  const referenceStudyData = getLatestPastStudy(pastStudies)

  const { minYear, maxYear } = calculateTrajectoryYearBounds(
    snbcEnabled,
    pastStudies,
    trajectories,
    selectedCustomTrajectoryIds,
    actions,
  )

  const snbcData = getSNBCData(
    selectedSnbcTrajectories,
    sectenData,
    referenceStudyData,
    pastStudies,
    studyStartYear,
    totalCo2,
    maxYear,
  )

  const { customTrajectoriesData, defaultTrajectoryData } = getCustomData(
    trajectories,
    selectedCustomTrajectoryIds,
    totalCo2,
    studyStartYear,
    pastStudies,
    referenceStudyData,
    minYear,
    maxYear,
    sectenData,
  )

  const defaultTrajectoryDataPoints = defaultTrajectoryData?.data.currentTrajectory ?? []
  const defaultTrajectoryForSBTI = defaultTrajectoryDataPoints.filter((p) => p.year <= SBTI_START_YEAR)

  const { sbti15Data, sbtiWB2CData } = getDefaultSBTiData(
    pastStudies,
    sbti15Enabled,
    sbtiWB2CEnabled,
    totalCo2,
    studyStartYear,
    minYear,
    maxYear,
    defaultTrajectoryForSBTI,
  )

  const actionBasedData = getActionBasedData(
    actions,
    pastStudies,
    totalCo2,
    studyStartYear,
    studyResultsUnit,
    referenceStudyData,
    withDependencies,
    minYear,
    maxYear,
  )

  return {
    sbti15: sbti15Data,
    sbtiWB2C: sbtiWB2CData,
    snbc: snbcData,
    customTrajectories: customTrajectoriesData,
    actionBased: actionBasedData,
  }
}

export const calculateActionBasedTrajectory = ({
  studyEmissions,
  studyStartYear,
  studyUnit,
  actions,
  pastStudies = [],
  minYear,
  maxYear,
}: CalculateActionBasedTrajectoryParams): TrajectoryDataPoint[] => {
  const dataPoints: TrajectoryDataPoint[] = []
  addHistoricalDataAndStudyPoint(dataPoints, pastStudies, studyEmissions, studyStartYear, minYear)

  const quantitativeActions = actions.filter(
    (action) =>
      action.potentialDeduction === ActionPotentialDeduction.Quantity &&
      action.reductionValueKg !== null &&
      action.reductionStartYear !== null &&
      action.reductionEndYear !== null,
  )

  const maxActionsEndYear =
    quantitativeActions.length > 0
      ? Math.max(
          ...quantitativeActions.map((action) =>
            action.reductionEndYear ? getYearFromDateStr(action.reductionEndYear) : 0,
          ),
        )
      : 0

  const maxDefaultEndYear = Math.max(maxYear ?? TARGET_YEAR, TARGET_YEAR)
  const maxEndYear = Math.max(maxActionsEndYear, maxDefaultEndYear)
  const yearlyReductions: Record<number, number> = {}

  for (const action of quantitativeActions) {
    const startYear = action.reductionStartYear ? getYearFromDateStr(action.reductionStartYear) : 0
    const endYear = action.reductionEndYear ? getYearFromDateStr(action.reductionEndYear) : 0

    if (startYear <= endYear) {
      const actionDuration = Math.max(1, endYear - startYear + 1) // we count the action on the start and the end year
      const reductionValueInStudyUnit = convertValue(action.reductionValueKg ?? 0, StudyResultUnit.K, studyUnit)
      const annualReduction = reductionValueInStudyUnit / actionDuration

      for (let year = startYear; year <= endYear; year++) {
        const currentYearlyReduction = yearlyReductions[year]
        if (currentYearlyReduction) {
          yearlyReductions[year] += annualReduction
        } else {
          yearlyReductions[year] = annualReduction
        }
      }
    }
  }

  let currentEmissions = studyEmissions
  for (let year = studyStartYear + 1; year <= maxEndYear; year++) {
    const yearlyReduction = yearlyReductions[year] ?? 0
    currentEmissions = Math.max(0, currentEmissions - yearlyReduction)
    dataPoints.push({ year, value: currentEmissions })
  }

  return dataPoints
}

// Build trajectory with a given rate multiplier applied to the objectives
// This must match the trajectory building logic in calculateCustomTrajectory and calculateSNBCTrajectory
const buildTrajectoryWithObjectivesAndMultiplier = (
  startEmissions: number,
  startYear: number,
  objectives: BaseObjective[],
  multiplier: number = 1,
): TrajectoryDataPoint[] => {
  const trajectory: TrajectoryDataPoint[] = [{ year: startYear, value: startEmissions }]
  let currentEmissions = startEmissions
  let previousSegmentEnd = startYear

  for (let i = 0; i < objectives.length; i++) {
    const objective = objectives[i]

    if (objective.targetYear > startYear) {
      const effectiveStart = previousSegmentEnd + 1
      const adjustedRate = objective.reductionRate * multiplier
      const yearsInSegment = objective.targetYear - effectiveStart + 1
      const yearlyReduction = currentEmissions * adjustedRate

      for (let j = 0; j < yearsInSegment; j++) {
        const year = effectiveStart + j
        const emissionThisYear = Math.max(0, currentEmissions - (j + 1) * yearlyReduction)
        trajectory.push({ year, value: emissionThisYear })
      }

      currentEmissions = Math.max(0, currentEmissions - yearsInSegment * yearlyReduction)
      previousSegmentEnd = objective.targetYear
    }
  }

  // Add final segment to zero using last objective's rate
  if (currentEmissions > 0 && objectives.length > 0) {
    const lastRate = objectives[objectives.length - 1].reductionRate * multiplier
    const lastYearlyReduction = currentEmissions * lastRate

    if (lastYearlyReduction > 0) {
      const yearsToZero = currentEmissions / lastYearlyReduction

      for (let j = 0; j < Math.ceil(yearsToZero); j++) {
        const year = previousSegmentEnd + 1 + j
        // We need + 1 because we are counting the start year
        const emissionThisYear = Math.max(0, currentEmissions - (j + 1) * lastYearlyReduction)
        trajectory.push({ year, value: emissionThisYear })
      }
    }
  }

  return trajectory
}

// Calculate budget with a given rate multiplier applied to the objectives
const calculateBudgetWithObjectivesAndMultiplier = (
  startEmissions: number,
  startYear: number,
  objectives: BaseObjective[],
  multiplier: number,
): number => {
  const trajectory = buildTrajectoryWithObjectivesAndMultiplier(startEmissions, startYear, objectives, multiplier)
  /**
   * changes made during the ticket https://github.com/ABC-TransitionBasCarbone/bilan-carbone/issues/2078
   * before : const endYear = trajectory[trajectory.length - 1].year
   *
   * We made this change because tests failed "getObjectivesWithOvershootCompensation - budget equality test"
   * The new calcul method was wrong because for custom trajectories, the correction was calculated on all years (until 2050) instead of years until the 2nd objective
   *
   * Do not use on SBTi trajectories
   */
  const endYear = objectives[objectives.length - 1].targetYear

  return calculateTrajectoryIntegral(trajectory, startYear, endYear)
}

type TrajectoriesForYear = {
  currentTrajectory: { year: number }[]
  previousTrajectory: { year: number }[] | null
}

const extractYearsFromTrajectory = (data: TrajectoriesForYear | null): number[] => {
  if (!data) {
    return []
  }
  // We need both current and past points in case the current trajectory is only a single point due to being bellow threshold
  return [...data.currentTrajectory.map((d) => d.year), ...(data.previousTrajectory?.map((d) => d.year) ?? [])]
}

export const getYearsToDisplay = (trajectories: TrajectoryData[]): number[] => {
  const allYears = trajectories.flatMap((traj) => extractYearsFromTrajectory(traj))
  return Array.from(new Set(allYears)).sort((a, b) => a - b)
}

export const getMaxYearFromTrajectories = (maxYear: number, trajectories: (TrajectoryData | null)[]): number => {
  const years = trajectories.flatMap((trajectory) => extractYearsFromTrajectory(trajectory))
  return Math.max(maxYear, Math.max(...years))
}

export const getDisplayedReferenceYearForTrajectoryType = (type: TrajectoryType, studyYear: number): number => {
  if (type === TrajectoryType.SBTI_15 || type === TrajectoryType.SBTI_WB2C) {
    return SBTI_START_YEAR
  } else if (type === TrajectoryType.SNBC_GENERAL || type === TrajectoryType.SNBC_SECTORAL) {
    return SNBC_DISPLAYED_REFERENCE_YEAR
  }

  // For custom trajectories, use the study year as reference year
  return studyYear
}

const isFailedTrajectory = (
  maxYear: number,
  referenceTrajectoryStartYear: number,
  referenceTrajectory: TrajectoryDataPoint[] | null,
  currentTrajectory: TrajectoryDataPoint[],
  isWithinThreshold?: boolean,
): boolean => {
  if (!referenceTrajectory || isWithinThreshold) {
    return false
  }
  // Use the furthest year across both trajectories so the corrected trajectory's
  // tail (which may extend beyond maxYear) is included in the budget comparison
  const actualEndYear = Math.max(
    currentTrajectory[currentTrajectory.length - 1]?.year ?? maxYear,
    referenceTrajectory[referenceTrajectory.length - 1]?.year ?? maxYear,
  )
  const referenceBudget = calculateTrajectoryIntegral(referenceTrajectory, referenceTrajectoryStartYear, actualEndYear)
  const currentBudget = calculateTrajectoryIntegral(currentTrajectory, referenceTrajectoryStartYear, actualEndYear)
  return currentBudget > referenceBudget * (1 + OVERSHOOT_THRESHOLD)
}

/**
 * Method to calculate the corrected objectives for a given trajectory type.
 * It is based on the reference year and default objectives.
 */
export const getCorrectedObjectives = (
  studyYear: number,
  studyEmissions: number,
  objectives: { targetYear?: string | null; reductionRate?: number | null }[],
  trajectoryType: TrajectoryType,
  pastStudies: PastStudy[],
  referenceYear: number | null,
  isSBTI: boolean,
  isSNBC: boolean,
  isCustom: boolean,
  sectenData: SectenInfo[],
  sectorPercentages?: SectorPercentages | null,
): BaseObjective[] | null => {
  const nonEmptyObjectives = objectives
    .filter((obj) => obj.targetYear && obj.reductionRate !== null && obj.reductionRate !== undefined)
    .map((obj) => ({
      targetYear: getYearFromDateStr(obj.targetYear!),
      reductionRate: Number((obj.reductionRate! / 100).toFixed(4)),
    }))

  if (nonEmptyObjectives.length === 0) {
    return null
  }

  let overshootAdjustment: OvershootAdjustment | undefined
  const historicalPoints = getAllHistoricalStudyPoints(pastStudies)

  if (isSBTI) {
    const baseRate = getDefaultSBTIReductionRate(trajectoryType)
    if (!baseRate) {
      return null
    }

    const { correctedRate } = getSBTiCorrectedRateAndEndYear(studyEmissions, studyYear, baseRate, historicalPoints)
    return nonEmptyObjectives.map((obj) => ({
      targetYear: obj.targetYear,
      reductionRate: correctedRate,
    }))
  } else if (isSNBC) {
    // There is a compensation only when there is a past study
    const latestPastStudy = getLatestPastStudy(pastStudies)
    if (!latestPastStudy) {
      return null
    }

    let referenceTrajectory: TrajectoryDataPoint[]

    if (trajectoryType === TrajectoryType.SNBC_SECTORAL) {
      if (!sectorPercentages) {
        return null
      }

      referenceTrajectory = calculateCustomSNBCSectoralTrajectory(
        {
          studyEmissions: latestPastStudy.totalCo2,
          studyStartYear: latestPastStudy.year,
          sectenData,
          pastStudies: pastStudies.filter((s) => s.year < latestPastStudy.year),
          displayCurrentStudyValueOnTrajectory: true,
          overshootAdjustment: undefined,
          maxYear: 2050,
        },
        sectorPercentages,
      )

      const referenceEmissionsAtStudyYear = getTrajectoryEmissionsAtYear(referenceTrajectory, studyYear)
      if (referenceEmissionsAtStudyYear !== null && isWithinThreshold(studyEmissions, referenceEmissionsAtStudyYear)) {
        return null
      }

      const correctedRates = calculateSectoralSNBCReductionRates(
        {
          studyEmissions,
          studyStartYear: studyYear,
          sectenData,
          pastStudies,
          displayCurrentStudyValueOnTrajectory: true,
          overshootAdjustment: {
            referenceTrajectory,
            referenceStudyYear: latestPastStudy.year,
          },
          maxYear: 2050,
        },
        sectorPercentages,
      )

      if (correctedRates) {
        const correctedObjectives: BaseObjective[] = []
        if (correctedRates.rateTo2015 !== undefined) {
          correctedObjectives.push({ targetYear: 2015, reductionRate: correctedRates.rateTo2015 })
        }
        correctedObjectives.push({ targetYear: 2030, reductionRate: correctedRates.rateTo2030 })
        correctedObjectives.push({ targetYear: 2050, reductionRate: correctedRates.rateTo2050 })
        return correctedObjectives
      }

      return null
    } else {
      referenceTrajectory = calculateSNBCTrajectory({
        studyEmissions: latestPastStudy.totalCo2,
        studyStartYear: latestPastStudy.year,
        sectenData,
        pastStudies,
        displayCurrentStudyValueOnTrajectory: true,
        overshootAdjustment: undefined,
        maxYear: studyYear,
      })
    }

    const referenceEmissionsAtStudyYear = getTrajectoryEmissionsAtYear(referenceTrajectory, studyYear)
    if (referenceEmissionsAtStudyYear !== null && isWithinThreshold(studyEmissions, referenceEmissionsAtStudyYear)) {
      return null
    }

    overshootAdjustment = {
      referenceStudyYear: latestPastStudy.year,
      referenceTrajectory,
    }
  } else if (isCustom) {
    if (!referenceYear) {
      return null
    }

    const referenceEmissions = computePastOrPresentValue(referenceYear, historicalPoints, studyEmissions, studyYear)

    if (referenceEmissions === null) {
      return null
    }

    const referenceTrajectory = calculateCustomTrajectory({
      studyEmissions: referenceEmissions,
      studyStartYear: referenceYear,
      objectives: nonEmptyObjectives,
      pastStudies,
      trajectoryType: trajectoryType,
      minYear: referenceYear,
      maxYear: studyYear,
      sectenData,
      sectorPercentages,
      defaultTrajectory: [], // We don't need the default trajectory here because we only check from reference year
    })

    const referenceEmissionsAtStudyYear = getTrajectoryEmissionsAtYear(referenceTrajectory, studyYear)
    if (referenceEmissionsAtStudyYear !== null && isWithinThreshold(studyEmissions, referenceEmissionsAtStudyYear)) {
      return null
    }

    overshootAdjustment = {
      referenceStudyYear: referenceYear,
      referenceTrajectory,
    }
  }

  if (overshootAdjustment) {
    return getObjectivesWithOvershootCompensation(
      studyEmissions,
      studyYear,
      nonEmptyObjectives,
      overshootAdjustment,
      pastStudies,
    )
  }

  return null
}

export const getDefaultSnbcSectoralTrajectory = (
  trajectories: { type: TrajectoryType; isDefault: boolean }[],
): TrajectoryWithObjectivesAndScope | null => {
  const trajectory = trajectories.find((t) => t.type === TrajectoryType.SNBC_SECTORAL && t.isDefault)
  return (trajectory as TrajectoryWithObjectivesAndScope) ?? null
}

export const getDefaultSnbcSectoralPercentages = (
  trajectories: { type: TrajectoryType; sectorPercentages: unknown; isDefault: boolean }[],
): SectorPercentages | null => {
  return (getDefaultSnbcSectoralTrajectory(trajectories)?.sectorPercentages as SectorPercentages) ?? null
}
