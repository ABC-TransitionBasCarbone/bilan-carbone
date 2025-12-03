import { TrajectoryDataPoint } from '@/components/study/transitionPlan/TrajectoryGraph'
import { FullStudy } from '@/db/study'
import { getStudyTotalCo2Emissions } from '@/services/study'
import { Translations } from '@/types/translation'
import { Action, ActionPotentialDeduction, ExternalStudy, TrajectoryType } from '@prisma/client'
import { getYearFromDateStr } from './time'

export type SBTIType = 'SBTI_15' | 'SBTI_WB2C'
export const SBTI_REDUCTION_RATE_15 = 0.042
export const SBTI_REDUCTION_RATE_WB2C = 0.025
const SNBC_SBTI_REDUCTION_START_YEAR = 2020
export const MID_TARGET_YEAR = 2030
export const TARGET_YEAR = 2050
export const OVERSHOOT_THRESHOLD = 0.05

export interface PastStudy {
  id: string
  name: string
  type: 'linked' | 'external'
  year: number
  totalCo2: number
}

export const convertToPastStudies = (
  linkedStudies: FullStudy[],
  externalStudies: ExternalStudy[],
  withDependencies: boolean,
  validatedOnly: boolean,
): PastStudy[] => {
  const pastStudies: PastStudy[] = []

  linkedStudies.forEach((study) => {
    pastStudies.push({
      id: study.id,
      name: study.name,
      type: 'linked',
      year: study.startDate.getFullYear(),
      totalCo2: getStudyTotalCo2Emissions(study, withDependencies, validatedOnly),
    })
  })

  externalStudies.forEach((study) => {
    pastStudies.push({
      id: study.id,
      name: study.name,
      type: 'external',
      year: study.date.getFullYear(),
      totalCo2: study.totalCo2,
    })
  })

  return pastStudies.sort((a, b) => a.year - b.year)
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
  maxYear?: number
  pastStudies?: PastStudy[]
  displayCurrentStudyValueOnTrajectory?: boolean
}

interface CalculateCustomTrajectoryParams {
  studyEmissions: number
  studyStartYear: number
  objectives: Array<{ targetYear: number; reductionRate: number }>
  pastStudies?: PastStudy[]
  overshootAdjustment?: OvershootAdjustment
  trajectoryType?: TrajectoryType
}

interface CalculateActionBasedTrajectoryParams {
  studyEmissions: number
  studyStartYear: number
  actions: Action[]
  pastStudies?: PastStudy[]
  maxYear?: number
  withDependencies?: boolean
  overshootAdjustment?: OvershootAdjustment
}

export interface CalculateTrajectoriesWithHistoryParams {
  study: FullStudy
  withDependencies: boolean
  validatedOnly: boolean
  trajectories: Array<{
    id: string
    type: TrajectoryType
    name: string
    objectives: Array<{ targetYear: number; reductionRate: number }>
  }>
  actions: Action[]
  pastStudies: PastStudy[]
  selectedSbtiTrajectories: string[]
  selectedCustomTrajectoryIds: string[]
}

export interface TrajectoryData {
  previousTrajectoryReferenceYear: number | null
  previousTrajectory: TrajectoryDataPoint[] | null
  currentTrajectory: TrajectoryDataPoint[]
  withinThreshold: boolean
}

export interface TrajectoryResult {
  sbti15: TrajectoryData | null
  sbtiWB2C: TrajectoryData | null
  customTrajectories: Array<{ id: string; data: TrajectoryData }>
  actionBased: TrajectoryData | null
}

export const getMostRecentReferenceStudy = (pastStudies: PastStudy[]): PastStudy | null => {
  if (pastStudies.length === 0) {
    return null
  }
  return pastStudies.reduce((mostRecent, current) => (current.year > mostRecent.year ? current : mostRecent))
}

// Get the earliest reference study after 2020 (closest to 2020)
export const getEarliestReferenceStudyAfter2020 = (pastStudies: PastStudy[]): PastStudy | null => {
  const studiesAfter2020 = pastStudies.filter((s) => s.year > SNBC_SBTI_REDUCTION_START_YEAR)

  if (studiesAfter2020.length === 0) {
    return null
  }

  return studiesAfter2020.reduce((earliest, current) => (current.year < earliest.year ? current : earliest))
}

export const getEarliestPastStudyYear = (pastStudies: PastStudy[]): number | null => {
  if (pastStudies.length === 0) {
    return null
  }
  return Math.min(...pastStudies.map((s) => s.year))
}

export const getGraphStartYear = (
  pastStudies: PastStudy[],
  fallbackYear: number = SNBC_SBTI_REDUCTION_START_YEAR,
): number => {
  const earliestPastStudyYear = getEarliestPastStudyYear(pastStudies)
  return earliestPastStudyYear !== null ? Math.min(earliestPastStudyYear, fallbackYear) : fallbackYear
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

const getAllHistoricalStudyPoints = (pastStudies: PastStudy[]): Array<{ year: number; emissions: number }> => {
  return pastStudies.map((s) => ({ year: s.year, emissions: s.totalCo2 })).sort((a, b) => a.year - b.year)
}

const buildTrajectoryFromHistoricalPoints = (
  startYear: number,
  endYear: number,
  endYearEmissions: number,
  historicalPoints: Array<{ year: number; emissions: number }>,
): TrajectoryDataPoint[] => {
  const trajectory: TrajectoryDataPoint[] = []

  for (let year = startYear; year <= endYear; year++) {
    const value = computePastOrPresentValue(year, historicalPoints, endYearEmissions, endYear, year === endYear)
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
): void => {
  const graphStartYear = getGraphStartYear(pastStudies)
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

const computePastOrPresentValue = (
  year: number,
  historicalPoints: Array<{ year: number; emissions: number }>,
  studyEmissions: number,
  studyStartYear: number,
  displayCurrentStudyValueOnTrajectory: boolean = true,
): number | null => {
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

    const ratio = (year - pointBefore.year) / (pointAfter.year - pointBefore.year)
    return pointBefore.emissions + ratio * (pointAfter.emissions - pointBefore.emissions)
  }

  if (year === studyStartYear && displayCurrentStudyValueOnTrajectory) {
    // Add the actual study value to this trajectory unless explicitly excluded (when displayCurrentStudyValueOnTrajectory is false)
    return studyEmissions
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
  displayCurrentStudyValueOnTrajectory?: boolean,
): { year: number; value: number } | null => {
  if (year <= studyStartYear) {
    const pastOrPresentValue = computePastOrPresentValue(
      year,
      historicalPoints,
      studyEmissions,
      studyStartYear,
      displayCurrentStudyValueOnTrajectory,
    )

    if (pastOrPresentValue === null) {
      return null
    }

    return { year, value: pastOrPresentValue }
  }

  if (!reductionStartYear) {
    throw Error('trying to find future dots without reductionStartYear')
  }

  return computeFutureValue(year, studyEmissions, reductionStartYear, reductionRate)
}

const computeFutureValue = (
  year: number,
  studyEmissions: number,
  thresholdYear: number,
  absoluteReductionRate?: number,
): TrajectoryDataPoint => {
  // Case when study starts before reference (for SBTI, reference is 2020)
  if (year < thresholdYear) {
    return { year, value: studyEmissions }
  }

  if (!absoluteReductionRate) {
    throw Error('trying to find future dots without absoluteReductionRate')
  }

  const yearsFromThreshold = year - thresholdYear
  const newEmissions = studyEmissions - yearsFromThreshold * absoluteReductionRate * studyEmissions
  return { year, value: Math.max(0, newEmissions) }
}

export const calculateSBTiTrajectory = ({
  studyEmissions,
  studyStartYear,
  reductionRate,
  maxYear,
  pastStudies = [],
  displayCurrentStudyValueOnTrajectory,
}: CalculateSbtiTrajectoryParams) => {
  const dataPoints: TrajectoryDataPoint[] = []
  const historicalPoints = getAllHistoricalStudyPoints(pastStudies)

  if (studyEmissions === 0) {
    const graphStartYear =
      studyStartYear < SNBC_SBTI_REDUCTION_START_YEAR ? studyStartYear : SNBC_SBTI_REDUCTION_START_YEAR
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

  if (studyStartYear > SNBC_SBTI_REDUCTION_START_YEAR) {
    let pastOvershoot = 0
    let emissionsValue2020 = studyEmissions

    // Check if we have historical data between 2020 and studyStartYear
    const hasHistoricalDataBetween2020AndStudyYear = historicalPoints.some(
      (p) => p.year >= SNBC_SBTI_REDUCTION_START_YEAR && p.year < studyStartYear,
    )

    if (hasHistoricalDataBetween2020AndStudyYear) {
      // Use historical data to compute actual overshoot
      const computedEmissionsValue2020 = computePastOrPresentValue(
        SNBC_SBTI_REDUCTION_START_YEAR,
        historicalPoints,
        studyEmissions,
        studyStartYear,
        false,
      )

      if (computedEmissionsValue2020 !== null) {
        emissionsValue2020 = computedEmissionsValue2020
      }
    }

    // Calculate reference trajectory values
    const yearsSince2020 = studyStartYear - SNBC_SBTI_REDUCTION_START_YEAR
    const referenceYearlyReduction = emissionsValue2020 * reductionRate
    const referenceValueAtStudyYear = emissionsValue2020 - yearsSince2020 * referenceYearlyReduction

    const referenceBudgetFrom2020ToStudyYear = calculateLinearTrajectoryIntegral(
      emissionsValue2020,
      referenceValueAtStudyYear,
      yearsSince2020,
    )

    // Calculate actual overshoot based on whether we have historical data
    if (hasHistoricalDataBetween2020AndStudyYear) {
      // Use historical data to compute actual trajectory
      const actualTrajectoryFrom2020ToStudyYear = buildTrajectoryFromHistoricalPoints(
        SNBC_SBTI_REDUCTION_START_YEAR,
        studyStartYear,
        studyEmissions,
        historicalPoints,
      )

      const actualBudgetUsedFrom2020ToStudyYear = calculateTrajectoryIntegral(
        actualTrajectoryFrom2020ToStudyYear,
        SNBC_SBTI_REDUCTION_START_YEAR,
        studyStartYear,
      )

      pastOvershoot = actualBudgetUsedFrom2020ToStudyYear - referenceBudgetFrom2020ToStudyYear
    } else {
      // When there's no historical data, we assume emissions are stable between 2020 and studyStartYear
      const actualBudgetUsedFrom2020ToStudyYear = calculateLinearTrajectoryIntegral(
        studyEmissions,
        studyEmissions,
        yearsSince2020,
      )

      pastOvershoot = actualBudgetUsedFrom2020ToStudyYear - referenceBudgetFrom2020ToStudyYear
    }

    // Calculate the reference budget from study year to reaching zero emissions
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

    const graphStartYear = getGraphStartYear(pastStudies)

    for (let year = graphStartYear; year <= Math.max(newEndYear, maxYear ?? TARGET_YEAR); year++) {
      const dataPoint = computeValue(
        year,
        historicalPoints,
        studyEmissions,
        studyStartYear,
        studyStartYear,
        newReductionRate,
        displayCurrentStudyValueOnTrajectory,
      )

      if (dataPoint) {
        dataPoints.push(dataPoint)
      }
    }
  } else {
    const reductionStartYear = SNBC_SBTI_REDUCTION_START_YEAR
    const graphStartYear = getGraphStartYear(pastStudies, studyStartYear)
    const targetYear = Math.ceil(SNBC_SBTI_REDUCTION_START_YEAR + 1 / reductionRate)
    const endYear = Math.max(targetYear, maxYear ?? TARGET_YEAR)

    for (let year = graphStartYear; year <= endYear; year++) {
      const dataPoint = computeValue(
        year,
        historicalPoints,
        studyEmissions,
        studyStartYear,
        reductionStartYear,
        reductionRate,
        displayCurrentStudyValueOnTrajectory,
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
const getObjectivesWithOvershootCompensation = (
  actualEmissions: number,
  studyYear: number,
  objectives: Array<{ targetYear: number; reductionRate: number }>,
  overshootAdjustment: OvershootAdjustment,
  pastStudies: PastStudy[],
): Array<{ targetYear: number; reductionRate: number }> => {
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
  const referenceFutureBudget = calculateBudgetWithObjectivesAndMultiplier(
    referenceEmissionsAtStudyYear,
    studyYear,
    objectives,
    1.0,
  )

  // Reduce future budget to compensate for past overshoot
  const remainingTotalBudget = referenceFutureBudget - pastOvershoot

  // Newton-Raphson iteration to find k such that budget(k) = remainingTotalBudget
  const delta = 0.0001
  let k = 1.0

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
  const compensatedObjectives: Array<{ targetYear: number; reductionRate: number }> = objectives.map((obj) => ({
    targetYear: obj.targetYear,
    reductionRate: Math.max(0, obj.reductionRate * k),
  }))

  return compensatedObjectives
}

export const getReductionRatePerType = (sbtiType: TrajectoryType): number | undefined => {
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
}: CalculateCustomTrajectoryParams): TrajectoryDataPoint[] => {
  if (objectives.length === 0) {
    return []
  }

  if (trajectoryType === TrajectoryType.SBTI_15 || trajectoryType === TrajectoryType.SBTI_WB2C) {
    const reductionRate = getReductionRatePerType(trajectoryType)
    if (reductionRate) {
      return calculateSBTiTrajectory({
        studyEmissions,
        studyStartYear,
        reductionRate,
        pastStudies,
        // If there is an overshoot adjustment, we need to display the current study value which is outside of threshold
        displayCurrentStudyValueOnTrajectory: !!overshootAdjustment,
      })
    }
  }

  const dataPoints: TrajectoryDataPoint[] = []
  let actualEmissions = studyEmissions
  let startYear = studyStartYear

  addHistoricalDataAndStudyPoint(dataPoints, pastStudies, studyEmissions, studyStartYear)

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
    const isLastObjective = i === sortedObjectives.length - 1

    for (let year = startYear + 1; year <= objective.targetYear; year++) {
      actualEmissions = Math.max(0, actualEmissions - yearlyReduction)
      dataPoints.push({ year, value: actualEmissions })
    }

    if (isLastObjective && actualEmissions > 0) {
      let year = objective.targetYear + 1

      if (yearlyReduction <= 0) {
        throw new Error(
          `Invalid reduction rate: yearly reduction is ${yearlyReduction} (rate: ${absoluteReductionRate}, emissions: ${actualEmissions}). Reduction rate must be positive.`,
        )
      }

      while (actualEmissions > 0) {
        actualEmissions = Math.max(0, actualEmissions - yearlyReduction)
        dataPoints.push({ year, value: actualEmissions })
        year++
      }
    }

    startYear = objective.targetYear
  }

  return dataPoints
}

export const getDefaultObjectivesForTrajectoryType = (
  type: TrajectoryType,
): Array<{ targetYear: number; reductionRate: number }> | undefined => {
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
    case TrajectoryType.SNBC:
      return 'SNBC'
    case TrajectoryType.CUSTOM:
      return t('custom')
    default:
      return type
  }
}

export const calculateTrajectoriesWithHistory = ({
  study,
  withDependencies,
  validatedOnly,
  trajectories,
  actions,
  pastStudies,
  selectedSbtiTrajectories,
  selectedCustomTrajectoryIds,
}: CalculateTrajectoriesWithHistoryParams): TrajectoryResult => {
  const totalCo2 = getStudyTotalCo2Emissions(study, withDependencies, validatedOnly)
  const studyStartYear = study.startDate.getFullYear()
  const sbti15Enabled = selectedSbtiTrajectories.includes('1,5')
  const sbtiWB2CEnabled = selectedSbtiTrajectories.includes('WB2C')

  const referenceStudyData = getMostRecentReferenceStudy(pastStudies)

  if (!referenceStudyData) {
    // For SBTi: Even without historical studies, show what the reference trajectory
    // should have been if they started reducing from 2020 at current emissions
    const theoreticalSbti15Reference = sbti15Enabled
      ? calculateSBTiTrajectory({
          studyEmissions: totalCo2,
          studyStartYear: SNBC_SBTI_REDUCTION_START_YEAR,
          reductionRate: SBTI_REDUCTION_RATE_15,
          pastStudies,
        })
      : null

    const theoreticalSbtiWB2CReference = sbtiWB2CEnabled
      ? calculateSBTiTrajectory({
          studyEmissions: totalCo2,
          studyStartYear: SNBC_SBTI_REDUCTION_START_YEAR,
          reductionRate: SBTI_REDUCTION_RATE_WB2C,
          pastStudies,
        })
      : null

    const sbti15Data: TrajectoryData | null = sbti15Enabled
      ? {
          previousTrajectoryReferenceYear: SNBC_SBTI_REDUCTION_START_YEAR,
          previousTrajectory: theoreticalSbti15Reference,
          currentTrajectory: calculateSBTiTrajectory({
            studyEmissions: totalCo2,
            studyStartYear,
            reductionRate: SBTI_REDUCTION_RATE_15,
            pastStudies,
          }),
          withinThreshold: false,
        }
      : null

    const sbtiWB2CData: TrajectoryData | null = sbtiWB2CEnabled
      ? {
          previousTrajectoryReferenceYear: SNBC_SBTI_REDUCTION_START_YEAR,
          previousTrajectory: theoreticalSbtiWB2CReference,
          currentTrajectory: calculateSBTiTrajectory({
            studyEmissions: totalCo2,
            studyStartYear,
            reductionRate: SBTI_REDUCTION_RATE_WB2C,
            pastStudies,
          }),
          withinThreshold: false,
        }
      : null

    const customTrajectoriesData: Array<{ id: string; data: TrajectoryData }> = trajectories
      .filter((t) => selectedCustomTrajectoryIds.includes(t.id))
      .map((traj) => ({
        id: traj.id,
        data: {
          previousTrajectoryReferenceYear: null,
          previousTrajectory: null,
          currentTrajectory: calculateCustomTrajectory({
            studyEmissions: totalCo2,
            studyStartYear,
            objectives: traj.objectives.map((obj) => ({
              targetYear: obj.targetYear,
              reductionRate: Number(obj.reductionRate),
            })),
            pastStudies,
            trajectoryType: traj.type,
          }),
          withinThreshold: true,
        },
      }))

    const enabledActions = actions.filter((action) => action.enabled)

    const yearsFromTrajectories = getYearsToDisplay(
      sbti15Data,
      sbtiWB2CData,
      customTrajectoriesData.map((values) => values.data),
      null,
      sbti15Enabled,
      sbtiWB2CEnabled,
    )
    const maxYearFromTrajectories = yearsFromTrajectories[yearsFromTrajectories.length - 1]

    const actionBasedData: TrajectoryData = {
      previousTrajectoryReferenceYear: null,
      previousTrajectory: null,
      currentTrajectory: calculateActionBasedTrajectory({
        studyEmissions: totalCo2,
        studyStartYear,
        actions: enabledActions,
        pastStudies,
        withDependencies,
        maxYear: maxYearFromTrajectories > 0 ? maxYearFromTrajectories : undefined,
      }),
      withinThreshold: true,
    }

    return {
      sbti15: sbti15Data,
      sbtiWB2C: sbtiWB2CData,
      customTrajectories: customTrajectoriesData,
      actionBased: actionBasedData,
    }
  } else {
    // Case with reference study
    const referenceStudyYear = referenceStudyData.year
    const referenceEmissions = referenceStudyData.totalCo2

    let sbti15Data: TrajectoryData | null = null
    if (sbti15Enabled) {
      const referenceTrajectory = calculateSBTiTrajectory({
        studyEmissions: referenceEmissions,
        studyStartYear: referenceStudyYear,
        reductionRate: SBTI_REDUCTION_RATE_15,
        pastStudies,
      })

      const referenceEmissionsForStudyStartYear = getTrajectoryEmissionsAtYear(referenceTrajectory, studyStartYear)
      const withinThreshold =
        referenceEmissionsForStudyStartYear !== null && isWithinThreshold(totalCo2, referenceEmissionsForStudyStartYear)

      let currentTrajectory: TrajectoryDataPoint[] | null = null

      // Case where we only display the current study emissions as isolated point
      if (withinThreshold) {
        currentTrajectory = [{ year: studyStartYear, value: totalCo2 }]
      } else {
        // Case where we need overshoot compensation since we are above the threshold
        currentTrajectory = calculateSBTiTrajectory({
          studyEmissions: totalCo2,
          studyStartYear,
          reductionRate: SBTI_REDUCTION_RATE_15,
          pastStudies,
          displayCurrentStudyValueOnTrajectory: true,
        })
      }

      sbti15Data = {
        previousTrajectoryReferenceYear: referenceStudyYear,
        previousTrajectory: referenceTrajectory,
        currentTrajectory,
        withinThreshold,
      }
    }

    let sbtiWB2CData: TrajectoryData | null = null
    if (sbtiWB2CEnabled) {
      const referenceTrajectory = calculateSBTiTrajectory({
        studyEmissions: referenceEmissions,
        studyStartYear: referenceStudyYear,
        reductionRate: SBTI_REDUCTION_RATE_WB2C,
        pastStudies,
      })

      const referenceEmissionsForStudyStartYear = getTrajectoryEmissionsAtYear(referenceTrajectory, studyStartYear)
      const withinThreshold =
        referenceEmissionsForStudyStartYear !== null && isWithinThreshold(totalCo2, referenceEmissionsForStudyStartYear)

      const currentTrajectory = calculateSBTiTrajectory({
        studyEmissions: totalCo2,
        studyStartYear,
        reductionRate: SBTI_REDUCTION_RATE_WB2C,
        pastStudies,
        displayCurrentStudyValueOnTrajectory: !withinThreshold,
      })

      sbtiWB2CData = {
        previousTrajectoryReferenceYear: referenceStudyYear,
        previousTrajectory: referenceTrajectory,
        currentTrajectory,
        withinThreshold,
      }
    }

    const customTrajectoriesData: Array<{ id: string; data: TrajectoryData }> = []
    for (const traj of trajectories.filter((t) => selectedCustomTrajectoryIds.includes(t.id))) {
      const referenceTrajectory = calculateCustomTrajectory({
        studyEmissions: referenceEmissions,
        studyStartYear: referenceStudyYear,
        objectives: traj.objectives.map((obj) => ({
          targetYear: obj.targetYear,
          reductionRate: Number(obj.reductionRate),
        })),
        pastStudies,
        trajectoryType: traj.type,
      })

      const referenceEmissionsForStudyStartYear = getTrajectoryEmissionsAtYear(referenceTrajectory, studyStartYear)
      const withinThreshold =
        referenceEmissionsForStudyStartYear !== null && isWithinThreshold(totalCo2, referenceEmissionsForStudyStartYear)

      const currentTrajectory = calculateCustomTrajectory({
        studyEmissions: totalCo2,
        studyStartYear,
        objectives: traj.objectives.map((obj) => ({
          targetYear: obj.targetYear,
          reductionRate: Number(obj.reductionRate),
        })),
        pastStudies,
        overshootAdjustment: withinThreshold
          ? undefined
          : {
              referenceTrajectory,
              referenceStudyYear,
            },
        trajectoryType: traj.type,
      })

      customTrajectoriesData.push({
        id: traj.id,
        data: {
          previousTrajectoryReferenceYear: referenceStudyYear,
          previousTrajectory: referenceTrajectory,
          currentTrajectory,
          withinThreshold,
        },
      })
    }

    const enabledActions = actions.filter((action) => action.enabled)

    const yearsFromTrajectories = getYearsToDisplay(
      sbti15Data,
      sbtiWB2CData,
      customTrajectoriesData.map((values) => values.data),
      null,
      sbti15Enabled,
      sbtiWB2CEnabled,
    )
    const maxYearFromTrajectories = yearsFromTrajectories[yearsFromTrajectories.length - 1]

    const referenceActionTrajectory = calculateActionBasedTrajectory({
      studyEmissions: referenceEmissions,
      studyStartYear: referenceStudyYear,
      actions: enabledActions,
      pastStudies,
      withDependencies,
      maxYear: maxYearFromTrajectories > 0 ? maxYearFromTrajectories : undefined,
    })

    const referenceActionValue = getTrajectoryEmissionsAtYear(referenceActionTrajectory, studyStartYear)
    const actionWithinThreshold = referenceActionValue !== null && isWithinThreshold(totalCo2, referenceActionValue)

    const currentActionTrajectory = calculateActionBasedTrajectory({
      studyEmissions: totalCo2,
      studyStartYear,
      actions: enabledActions,
      pastStudies,
      withDependencies,
      maxYear: maxYearFromTrajectories > 0 ? maxYearFromTrajectories : undefined,
    })

    const actionBasedData: TrajectoryData = {
      previousTrajectoryReferenceYear: referenceStudyYear,
      previousTrajectory: referenceActionTrajectory,
      currentTrajectory: currentActionTrajectory,
      withinThreshold: actionWithinThreshold,
    }

    return {
      sbti15: sbti15Data,
      sbtiWB2C: sbtiWB2CData,
      customTrajectories: customTrajectoriesData,
      actionBased: actionBasedData,
    }
  }
}

export const calculateActionBasedTrajectory = ({
  studyEmissions,
  studyStartYear,
  actions,
  pastStudies = [],
  maxYear,
  withDependencies = true,
}: CalculateActionBasedTrajectoryParams): TrajectoryDataPoint[] => {
  const dataPoints: TrajectoryDataPoint[] = []
  addHistoricalDataAndStudyPoint(dataPoints, pastStudies, studyEmissions, studyStartYear)

  const filteredActions = actions.filter((action) => {
    if (action.dependenciesOnly && !withDependencies) {
      return false
    }
    return true
  })

  const quantitativeActions = filteredActions.filter(
    (action) =>
      action.potentialDeduction === ActionPotentialDeduction.Quantity &&
      action.reductionValue !== null &&
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
      for (let year = startYear; year <= endYear; year++) {
        const actionDuration = Math.max(1, endYear - startYear)
        const annualReduction = (action.reductionValue ?? 0) / actionDuration
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
const buildTrajectoryWithObjectivesAndMultiplier = (
  startEmissions: number,
  startYear: number,
  objectives: Array<{ targetYear: number; reductionRate: number }>,
  multiplier: number,
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
        const emissionThisYear = currentEmissions - j * yearlyReduction
        trajectory.push({ year, value: emissionThisYear })
      }

      currentEmissions = currentEmissions - yearsInSegment * yearlyReduction
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
        const emissionThisYear = Math.max(0, currentEmissions - j * lastYearlyReduction)
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
  objectives: Array<{ targetYear: number; reductionRate: number }>,
  multiplier: number,
): number => {
  const trajectory = buildTrajectoryWithObjectivesAndMultiplier(startEmissions, startYear, objectives, multiplier)
  const endYear = trajectory[trajectory.length - 1].year

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

export const getYearsToDisplay = (
  trajectory15Data: TrajectoriesForYear | null,
  trajectoryWB2CData: TrajectoriesForYear | null,
  customTrajectoriesData: (TrajectoriesForYear | null)[],
  actionBasedTrajectoryData: TrajectoriesForYear | null,
  trajectory15Enabled: boolean,
  trajectoryWB2CEnabled: boolean,
): number[] => {
  const allYears = [
    ...(trajectory15Enabled ? extractYearsFromTrajectory(trajectory15Data) : []),
    ...(trajectoryWB2CEnabled ? extractYearsFromTrajectory(trajectoryWB2CData) : []),
    ...customTrajectoriesData.flatMap((trajData) => extractYearsFromTrajectory(trajData)),
    ...extractYearsFromTrajectory(actionBasedTrajectoryData),
  ]
  return Array.from(new Set(allYears)).sort((a, b) => a - b)
}
