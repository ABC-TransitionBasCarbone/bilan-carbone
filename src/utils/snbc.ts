import { TrajectoryDataPoint } from '@/components/study/transitionPlan/TrajectoryGraph'
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
  rateCalculationStartYear?: number
  rateCalculationStartEmissions?: number
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

const reconstructEmissionsBackward = (
  studyEmissions: number,
  studyYear: number,
  targetYear: number,
  reductionRates: Map<number, number>,
  rateTo2030?: number,
): number => {
  if (targetYear >= studyYear) {
    return studyEmissions
  }

  let emissions = studyEmissions
  const latestSectenYear = reductionRates.size > 0 ? Math.max(...reductionRates.keys()) : null

  for (let year = studyYear; year > targetYear; year--) {
    let rate = reductionRates.get(year)

    // Use reduction rate to 2030 for years after last available secten year
    if (rate === undefined && rateTo2030 !== undefined && latestSectenYear !== null && year > latestSectenYear) {
      rate = rateTo2030
    }

    // Avoid division by zero for 100% reduction rate
    if (rate !== undefined && rate !== 1) {
      emissions = emissions / (1 - rate)
    }
  }

  return emissions
}

/**
 * Calculate the annual reduction rate needed to reach sectenTarget2030 from the given year and emissions
 */
const calculateAnnualRateTo2030 = (sectenTarget2030: number, fromYear: number, fromEmissions: number): number => {
  const yearsTo2030 = SNBC_MID_TARGET_YEAR - fromYear
  if (yearsTo2030 <= 0) {
    return 0
  }

  const remainingReduction = 1 - sectenTarget2030 / fromEmissions
  return remainingReduction / yearsTo2030
}

/**
 * Interpolate the 2030 target and 2050 target to get the annual reduction rate in the segment 2030-2050
 */
const calculateAnnualRateFrom2030To2050 = (sectenTarget2030: number, sectenTarget2050: number): number | null => {
  if (sectenTarget2030 <= 0) {
    return null
  }

  const totalReduction = (sectenTarget2030 - sectenTarget2050) / sectenTarget2030
  const years = SNBC_FINAL_TARGET_YEAR - SNBC_MID_TARGET_YEAR

  return totalReduction / years
}

interface GetObjectivesParams {
  sectenTarget2030: number
  rateTo2030: number
  rateFrom2030To2050: number
  fromYear?: number
  fromEmissions?: number
}

/**
 * Calculate SNBC objectives (reduction rates for 2030 and 2050 targets)
 * fromYear and fromEmissions are provided when the trajectory is not based on a reference study
 * Otherwise, the overshoot compensation is applied to the base reduction rate
 */
const getObjectives = ({
  sectenTarget2030,
  rateTo2030,
  rateFrom2030To2050,
  fromYear,
  fromEmissions,
}: GetObjectivesParams): Array<{ targetYear: number; reductionRate: number }> => {
  let rate2030: number = rateTo2030

  if (fromYear !== undefined && fromEmissions !== undefined) {
    rate2030 = calculateAnnualRateTo2030(sectenTarget2030, fromYear, fromEmissions)
  }

  return [
    { targetYear: SNBC_MID_TARGET_YEAR, reductionRate: rate2030 },
    { targetYear: SNBC_FINAL_TARGET_YEAR, reductionRate: rateFrom2030To2050 },
  ]
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
  rateCalculationStartYear,
  rateCalculationStartEmissions,
}: CalculateTrajectoryParams): TrajectoryDataPoint[] => {
  const dataPoints: TrajectoryDataPoint[] = []

  if (sectenData.length === 0) {
    return dataPoints
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
    return dataPoints
  }

  const sectenRateTo2030 = calculateAnnualRateTo2030(sectenTarget2030, latestSectenYear, latestSectenEmissions)
  const sectenRateFrom2030To2050 = calculateAnnualRateFrom2030To2050(sectenTarget2030, sectenTarget2050)
  if (sectenRateTo2030 === null || sectenRateFrom2030To2050 === null) {
    return dataPoints
  }

  const reductionRates = getSectenYearlyReductionRates(sectenData)
  const historicalPoints = getAllHistoricalStudyPoints(pastStudies)
  const baseYear = studyStartYear < SNBC_REFERENCE_YEAR ? studyStartYear : SNBC_REFERENCE_YEAR
  const graphStartYear = getGraphStartYear(pastStudies, baseYear)

  if (studyStartYear < SNBC_REFERENCE_YEAR) {
    for (let year = graphStartYear; year < SNBC_REFERENCE_YEAR; year++) {
      if (year <= studyStartYear) {
        const value = computePastOrPresentValue(year, historicalPoints, studyEmissions, studyStartYear, true)
        if (value !== null) {
          dataPoints.push({ year, value })
        }
      } else {
        dataPoints.push({ year, value: studyEmissions })
      }
    }
  }

  if (studyStartYear > SNBC_REFERENCE_YEAR) {
    const earliestPastStudyYear = pastStudies.length > 0 ? Math.min(...pastStudies.map((s) => s.year)) : null
    const reconstructionEndYear = earliestPastStudyYear !== null ? earliestPastStudyYear : studyStartYear

    for (let year = graphStartYear; year < studyStartYear; year++) {
      if (year < reconstructionEndYear) {
        const pastStudyAtYear = pastStudies.find((s) => s.year === year)
        if (pastStudyAtYear) {
          dataPoints.push({ year, value: pastStudyAtYear.totalCo2 })
        } else {
          // Reconstruct emissions backward from the earliest past study or study start
          const emissionsForBackwardReconstruction =
            earliestPastStudyYear !== null
              ? pastStudies.find((s) => s.year === earliestPastStudyYear)!.totalCo2
              : studyEmissions
          const reconstructed = reconstructEmissionsBackward(
            emissionsForBackwardReconstruction,
            reconstructionEndYear,
            year,
            reductionRates,
            sectenRateTo2030,
          )
          dataPoints.push({ year, value: reconstructed })
        }
      } else {
        const value = computePastOrPresentValue(year, historicalPoints, studyEmissions, studyStartYear, true)
        if (value !== null) {
          dataPoints.push({ year, value })
        }
      }
    }
  }

  if (displayCurrentStudyValueOnTrajectory) {
    dataPoints.push({ year: studyStartYear, value: studyEmissions })
  }

  let objectives = getObjectives({
    sectenTarget2030,
    rateTo2030: sectenRateTo2030,
    rateFrom2030To2050: sectenRateFrom2030To2050,
    fromYear: rateCalculationStartYear,
    fromEmissions: rateCalculationStartEmissions,
  })

  if (overshootAdjustment) {
    objectives = getObjectivesWithOvershootCompensation(
      studyEmissions,
      studyStartYear,
      objectives,
      overshootAdjustment,
      pastStudies,
    )
  }

  // Apply objectives to build the trajectory
  let currentEmissions = studyEmissions
  const startYearForReduction = Math.max(studyStartYear, SNBC_REFERENCE_YEAR)

  // Segment 1: From start year + 1 to 2030
  const annualReductionRateTo2030 = objectives[0].reductionRate
  for (let year = startYearForReduction + 1; year <= SNBC_MID_TARGET_YEAR; year++) {
    const yearlyReduction = currentEmissions * annualReductionRateTo2030
    currentEmissions = Math.max(0, currentEmissions - yearlyReduction)
    dataPoints.push({ year, value: currentEmissions })
  }

  const emissionsAt2030 = currentEmissions

  // Segment 2: From 2030 to 2050
  const annualReductionRateTo2050 = objectives[1].reductionRate
  for (let year = SNBC_MID_TARGET_YEAR + 1; year <= SNBC_FINAL_TARGET_YEAR; year++) {
    const yearlyReduction = emissionsAt2030 * annualReductionRateTo2050
    currentEmissions = Math.max(0, currentEmissions - yearlyReduction)
    dataPoints.push({ year, value: currentEmissions })
  }

  return dataPoints.sort((a, b) => a.year - b.year)
}
