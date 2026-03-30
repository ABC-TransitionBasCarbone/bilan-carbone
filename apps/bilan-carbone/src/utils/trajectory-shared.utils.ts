import { OVERSHOOT_THRESHOLD, SBTI_START_YEAR } from '@/constants/trajectory.constants'
import type { BaseObjective, OvershootAdjustment, PastStudy, TrajectoryDataPoint } from '@/types/trajectory.types'

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

export const computeValue = (
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

export const interpolateValue = (
  yearToInterpolate: number,
  startYear: number,
  endYear: number,
  startValue: number,
  endValue: number,
): number => {
  const ratio = (yearToInterpolate - startYear) / (endYear - startYear)
  return startValue + ratio * (endValue - startValue)
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

export const isFailedTrajectory = (
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
export const buildTrajectoryFromHistoricalPoints = (
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
} // Helper function to calculate integral of a linear trajectory
// For a linear trajectory going from startValue to endValue over numberOfYears
// This is the area under the trapezoid: (startValue + endValue) * years / 2

export const calculateLinearTrajectoryIntegral = (
  startValue: number,
  endValue: number,
  numberOfYears: number,
): number => {
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
export const getEarliestPastStudyYear = (pastStudies: PastStudy[]): number | null => {
  if (pastStudies.length === 0) {
    return null
  }
  return Math.min(...pastStudies.map((s) => s.year))
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
} /**
 * Adds historical data points before the study start year and the study start year point to the trajectory
 */

export const addHistoricalDataAndStudyPoint = (
  dataPoints: TrajectoryDataPoint[],
  pastStudies: PastStudy[],
  studyEmissions: number,
  studyStartYear: number,
  minYear?: number,
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
