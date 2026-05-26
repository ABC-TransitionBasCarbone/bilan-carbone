import {
  SBTI_REDUCTION_RATE_15,
  SBTI_REDUCTION_RATE_WB2C,
  SBTI_START_YEAR,
  TARGET_YEAR,
} from '@/constants/trajectory.constants'
import type { PastStudy, TrajectoryDataPoint } from '@/types/trajectory.types'
import { TrajectoryData } from '@/types/trajectory.types'
import { TrajectoryType } from '@abc-transitionbascarbone/db-common/enums'
import {
  buildTrajectoryFromHistoricalPoints,
  calculateLinearTrajectoryIntegral,
  calculateTrajectoryIntegral,
  computePastOrPresentValue,
  computeValue,
  getAllHistoricalStudyPoints,
  getEarliestPastStudyYear,
  getGraphStartYear,
  getTrajectoryEmissionsAtYear,
  isFailedTrajectory,
  isWithinThreshold,
} from './trajectory-shared.utils'

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

/**
 * Method which calculates SBTI data for any type (1.5°C or WB2C)
 */
export const calculateSBTiData = (
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

export const getDefaultSBTIReductionRate = (sbtiType: TrajectoryType): number | undefined => {
  if (sbtiType === TrajectoryType.SBTI_15) {
    return SBTI_REDUCTION_RATE_15
  } else if (sbtiType === TrajectoryType.SBTI_WB2C) {
    return SBTI_REDUCTION_RATE_WB2C
  }
  return undefined
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

  // For the current trajectory (studyStartYear > SBTI_START_YEAR), follow the default trajectory
  // until the earliest past study year, even if it's after 2020
  const currentTrajectoryPivotYear =
    studyStartYear > SBTI_START_YEAR && earliestPastStudyYear !== null
      ? Math.min(earliestPastStudyYear, studyStartYear)
      : snbcPivotYear

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
      if (defaultTrajectory && year <= currentTrajectoryPivotYear) {
        // Follow the default trajectory until pivot year included
        const snbcPoint = defaultTrajectory.find((p: TrajectoryDataPoint) => p.year === year)
        if (snbcPoint) {
          dataPoints.push(snbcPoint)
          continue
        }
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
