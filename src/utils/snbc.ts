import { TrajectoryDataPoint } from '@/components/study/transitionPlan/TrajectoryGraph'
import { TrajectoryWithObjectives } from '@/db/transitionPlan'
import type { SectenInfo } from '@prisma/client'
import {
  OvershootAdjustment,
  PastStudy,
  computePastOrPresentValue,
  getAllHistoricalStudyPoints,
  getGraphStartYear,
  getObjectivesWithOvershootCompensation,
} from './trajectory'

// SNBC trajectory constants
const SNBC_REFERENCE_YEAR = 1990
const SNBC_MID_TARGET_YEAR = 2030
const SNBC_FINAL_TARGET_YEAR = 2050
const SNBC_2030_REDUCTION_RATE = 0.4 // 40% reduction from 1990 to 2030
const SNBC_2050_REDUCTION_RATE = 5 / 6 // ~83% reduction from 1990 to 2050 (target is 1/6th of 1990 emissions)

interface CalculateTrajectoryParams {
  studyEmissions: number
  studyStartYear: number
  sectenData: SectenInfo[]
  pastStudies?: PastStudy[]
  displayCurrentStudyValueOnTrajectory?: boolean
  overshootAdjustment?: OvershootAdjustment
  maxYear?: number
}

export const getSectenEmissionsByYear = (sectenData: SectenInfo[], year: number): number | null => {
  const info = sectenData.find((d) => d.year === year)
  return info ? info.total : null
}

const getLatestSectenYear = (sectenData: SectenInfo[]): number | null => {
  if (sectenData.length === 0) {
    return null
  }
  return Math.max(...sectenData.map((d) => d.year))
}

const getLatestSectenEmissions = (sectenData: SectenInfo[]): number | null => {
  const latestYear = getLatestSectenYear(sectenData)
  if (latestYear === null) {
    return null
  }
  return getSectenEmissionsByYear(sectenData, latestYear)
}

const calculateSectenTarget2030 = (sectenData: SectenInfo[]): number | null => {
  const emissions1990 = getSectenEmissionsByYear(sectenData, SNBC_REFERENCE_YEAR)
  if (emissions1990 === null) {
    return null
  }
  return emissions1990 * (1 - SNBC_2030_REDUCTION_RATE)
}

const calculateSectenTarget2050 = (sectenData: SectenInfo[]): number | null => {
  const emissions1990 = getSectenEmissionsByYear(sectenData, SNBC_REFERENCE_YEAR)
  if (emissions1990 === null) {
    return null
  }
  return emissions1990 * (1 - SNBC_2050_REDUCTION_RATE)
}

const getSectenYearlyReductionRates = (sectenData: SectenInfo[]): Map<number, number> => {
  const rates = new Map<number, number>()

  for (let i = 1; i < sectenData.length; i++) {
    const prevYear = sectenData[i - 1]
    const currYear = sectenData[i]

    if (prevYear.total > 0) {
      const reductionRate = (prevYear.total - currYear.total) / prevYear.total
      rates.set(currYear.year, reductionRate)
    }
  }

  return rates
}

/**
 * Interpolate all past emission values based on Secten data and reduction rates.
 */
const interpolatePastEmissions = (
  fromEmissions: number,
  fromYear: number, // Most recent year to interpolate from
  toYear: number, // Earliest year to interpolate to
  reductionRates: Map<number, number>,
  rateTo2030?: number,
): Map<number, number> => {
  const interpolatedEmissions = new Map<number, number>()

  if (toYear >= fromYear) {
    return interpolatedEmissions
  }

  const interpolationEarliestYear = Math.max(toYear, SNBC_REFERENCE_YEAR)
  let emissions = fromEmissions
  const latestSectenYear = reductionRates.size > 0 ? Math.max(...reductionRates.keys()) : null

  for (let year = fromYear - 1; year >= interpolationEarliestYear; year--) {
    let rate = reductionRates.get(year + 1)

    // Special case: Use reduction rate to 2030 for years after last available secten year
    if (rate === undefined && rateTo2030 !== undefined && latestSectenYear !== null && year >= latestSectenYear) {
      rate = rateTo2030
    }

    if (rate !== undefined && rate !== 1) {
      // From reduction formula E_n = E_n-1 * (1 - rate) => E_n-1 = E_n / (1 - rate)
      emissions = emissions / (1 - rate)
    }

    interpolatedEmissions.set(year, emissions)
  }

  return interpolatedEmissions
}

const calculateSectenAnnualRateTo2030 = (
  sectenTarget2030: number,
  fromSectenYear: number,
  fromSectenEmissions: number,
): number | null => {
  const yearsTo2030 = SNBC_MID_TARGET_YEAR - fromSectenYear

  if (yearsTo2030 <= 0 || fromSectenEmissions <= 0) {
    return null
  }

  const remainingReduction = (fromSectenEmissions - sectenTarget2030) / fromSectenEmissions
  return remainingReduction / yearsTo2030
}

const calculateAnnualRateFrom2030To2050 = (sectenTarget2030: number, sectenTarget2050: number): number | null => {
  if (sectenTarget2030 <= 0) {
    return null
  }

  const years = SNBC_FINAL_TARGET_YEAR - SNBC_MID_TARGET_YEAR
  const totalReduction = (sectenTarget2030 - sectenTarget2050) / sectenTarget2030

  return totalReduction / years
}

/**
 * Calculate SNBC reduction rates for 2030 and 2050 based on Secten data
 * Returns null if Secten data is insufficient or invalid
 */
export const calculateSNBCReductionRates = (
  sectenData: SectenInfo[],
  studyStartYear: number,
): { rateTo2030: number; rateFrom2030To2050: number } | null => {
  if (sectenData.length === 0) {
    return null
  }

  const sectenTarget2030 = calculateSectenTarget2030(sectenData)
  const sectenTarget2050 = calculateSectenTarget2050(sectenData)
  const latestSectenYear = getLatestSectenYear(sectenData)
  const latestSectenEmissions = getLatestSectenEmissions(sectenData)

  if (
    sectenTarget2030 === null ||
    sectenTarget2050 === null ||
    latestSectenYear === null ||
    latestSectenEmissions === null
  ) {
    return null
  }

  const sectenYearForRateCalculation =
    studyStartYear < SNBC_REFERENCE_YEAR ? SNBC_REFERENCE_YEAR : Math.min(studyStartYear, latestSectenYear)

  const sectenEmissionsForRateCalculation = getSectenEmissionsByYear(sectenData, sectenYearForRateCalculation)
  if (sectenEmissionsForRateCalculation === null) {
    return null
  }

  const rateTo2030 = calculateSectenAnnualRateTo2030(
    sectenTarget2030,
    sectenYearForRateCalculation,
    sectenEmissionsForRateCalculation,
  )
  if (rateTo2030 === null) {
    return null
  }

  const rateFrom2030To2050 = calculateAnnualRateFrom2030To2050(sectenTarget2030, sectenTarget2050)
  if (rateFrom2030To2050 === null) {
    return null
  }

  return { rateTo2030, rateFrom2030To2050 }
}

export const getSNBCReductionRates = (
  trajectory: TrajectoryWithObjectives,
): { rateTo2030: number; rateFrom2030To2050: number } | null => {
  const objective2030 = trajectory.objectives.find((obj) => obj.targetYear === 2030)
  const objective2050 = trajectory.objectives.find((obj) => obj.targetYear === 2050)
  if (objective2030 && objective2050) {
    return {
      rateTo2030: objective2030.reductionRate,
      rateFrom2030To2050: objective2050.reductionRate,
    }
  }

  return null
}

/**
 * Calculate the SNBC trajectory in the segments 1990-2030 and 2030-2050 with the following rules:
 * 1. Segment 1990-2030:
 *   - If the study start year is before 1990, stay flat until 1990 and then use the Secten data and objectives to calculate the trajectory
 *   - If the study start year is between 1990 and 2030:
 *     - If there are no past studies before the study start year:
 *         1. Reconstruct the emissions backward from the study start year to 1990
 *         2. Calculate the reduction rate from study start year to 2030 using the Secten data and objectives
 *         3. Build the trajectory from study start year to 2030 using this reduction rate
 *     - If there are past studies before the study start year
 *         1. Reconstruct the emissions backward from the reference past study to 1990
 *         2. Calculate the reference trajectory reduction rate from reference year to 2030 using the Secten data and objectives
 *         3. Calculate the actual trajectory from reference year to study start year with linear interpolation
 *         4. Apply overshoot compensation to get the new reduction rates from study start year to 2030
 *
 * 2. Segment 2030-2050:
 *   1. Calculate the reduction rate from 2030 to 2050 using the Secten objectives and potential overshoot compensation
 *   2. Build the trajectory from 2030 to 2050 using this reduction rate
 */
export const calculateSNBCTrajectory = ({
  studyEmissions,
  studyStartYear,
  sectenData,
  pastStudies = [],
  displayCurrentStudyValueOnTrajectory = true,
  overshootAdjustment,
  maxYear,
}: CalculateTrajectoryParams): TrajectoryDataPoint[] => {
  const dataPoints: TrajectoryDataPoint[] = []

  if (sectenData.length === 0) {
    return dataPoints
  }

  const rates = calculateSNBCReductionRates(sectenData, studyStartYear)
  if (rates === null) {
    return dataPoints
  }

  const { rateTo2030: sectenRateTo2030, rateFrom2030To2050: sectenRateFrom2030To2050 } = rates

  const latestSectenYear = getLatestSectenYear(sectenData)
  const latestSectenEmissions = getLatestSectenEmissions(sectenData)

  if (latestSectenYear === null || latestSectenEmissions === null) {
    return dataPoints
  }

  const reductionRates = getSectenYearlyReductionRates(sectenData)
  const historicalPoints = getAllHistoricalStudyPoints(pastStudies)
  const baseYear = Math.min(studyStartYear, SNBC_REFERENCE_YEAR)
  const graphStartYear = getGraphStartYear(pastStudies, baseYear)

  if (studyStartYear < SNBC_REFERENCE_YEAR) {
    for (let year = graphStartYear; year <= SNBC_REFERENCE_YEAR; year++) {
      if (year <= studyStartYear) {
        const value = computePastOrPresentValue(year, historicalPoints, studyEmissions, studyStartYear)
        if (value !== null) {
          dataPoints.push({ year, value })
        }
      } else {
        dataPoints.push({ year, value: studyEmissions })
      }
    }
  } else {
    const earliestPastStudyYear = pastStudies.length > 0 ? Math.min(...pastStudies.map((s) => s.year)) : null
    const sectenInterpolationFromYear = earliestPastStudyYear !== null ? earliestPastStudyYear : studyStartYear

    const sectenInterpolationFromEmissions =
      earliestPastStudyYear !== null
        ? pastStudies.find((s) => s.year === earliestPastStudyYear)!.totalCo2
        : studyEmissions

    const interpolatedPastEmissions = interpolatePastEmissions(
      sectenInterpolationFromEmissions,
      sectenInterpolationFromYear,
      graphStartYear,
      reductionRates,
      sectenRateTo2030,
    )

    for (let year = graphStartYear; year < studyStartYear; year++) {
      if (year < sectenInterpolationFromYear) {
        const interpolatedYearlyEmissions = interpolatedPastEmissions.get(year)
        if (interpolatedYearlyEmissions !== undefined) {
          dataPoints.push({ year, value: interpolatedYearlyEmissions })
        }
      } else {
        const value = computePastOrPresentValue(year, historicalPoints, studyEmissions, studyStartYear)
        if (value !== null) {
          dataPoints.push({ year, value })
        }
      }
    }
  }

  if (displayCurrentStudyValueOnTrajectory) {
    dataPoints.push({ year: studyStartYear, value: studyEmissions })
  }

  let objectives = [
    { targetYear: SNBC_MID_TARGET_YEAR, reductionRate: sectenRateTo2030 },
    { targetYear: SNBC_FINAL_TARGET_YEAR, reductionRate: sectenRateFrom2030To2050 },
  ]

  if (overshootAdjustment) {
    objectives = getObjectivesWithOvershootCompensation(
      studyEmissions,
      studyStartYear,
      objectives,
      overshootAdjustment,
      pastStudies,
    )
  }

  let currentEmissions = studyEmissions
  const startYearForReduction = Math.max(studyStartYear, SNBC_REFERENCE_YEAR)

  // Segment 1: From start year + 1 to 2030
  const annualReductionRateTo2030 = objectives[0].reductionRate
  const yearlyReductionTo2030 = currentEmissions * annualReductionRateTo2030
  for (let year = startYearForReduction + 1; year <= SNBC_MID_TARGET_YEAR; year++) {
    currentEmissions = Math.max(0, currentEmissions - yearlyReductionTo2030)
    dataPoints.push({ year, value: currentEmissions })
  }

  // Segment 2: From 2031 to 2050
  const annualReductionRateTo2050 = objectives[1].reductionRate
  const yearlyReductionTo2050 = currentEmissions * annualReductionRateTo2050
  for (let year = SNBC_MID_TARGET_YEAR + 1; year <= SNBC_FINAL_TARGET_YEAR; year++) {
    currentEmissions = Math.max(0, currentEmissions - yearlyReductionTo2050)
    dataPoints.push({ year, value: currentEmissions })
  }

  // Flat trajectory after 2050 funtil max year
  if (maxYear && maxYear > SNBC_FINAL_TARGET_YEAR) {
    for (let year = SNBC_FINAL_TARGET_YEAR + 1; year <= maxYear; year++) {
      dataPoints.push({ year, value: currentEmissions })
    }
  }

  return dataPoints.sort((a, b) => a.year - b.year)
}
