import { TrajectoryDataPoint } from '@/components/study/transitionPlan/TrajectoryGraph'
import { SectenSector, SNBC_SECTOR_TARGET_EMISSIONS } from '@/constants/trajectories'
import { TrajectoryWithObjectives } from '@/db/transitionPlan'
import type { SectenInfo } from '@prisma/client'
import {
  computePastOrPresentValue,
  getAllHistoricalStudyPoints,
  getGraphStartYear,
  getObjectivesWithOvershootCompensation,
  OvershootAdjustment,
  PastStudy,
} from './trajectory'

// SNBC trajectory constants
const SNBC_REFERENCE_YEAR = 1990
const SNBC_SECTOR_FIRST_TARGET_YEAR = 2015
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

interface TrajectorySegment {
  startYear: number
  endYear: number
  reductionRate: number
}

interface TrajectoryTargetEmissions {
  2015?: number
  2030: number
  2050: number
}

interface ReductionRates {
  rateTo2015?: number
  rateTo2030: number
  rateTo2050: number
}

export const getSectenEmissionsByYear = (
  sectenData: SectenInfo[],
  year: number,
  sector?: SectenSector,
): number | null => {
  const info = sectenData.find((d) => d.year === year)
  if (!info) {
    return null
  }
  return sector ? info[sector] : info.total
}

const getLatestSectenYear = (sectenData: SectenInfo[]): number | null => {
  if (sectenData.length === 0) {
    return null
  }
  return Math.max(...sectenData.map((d) => d.year))
}

const getLatestSectenEmissions = (sectenData: SectenInfo[], sector?: SectenSector): number | null => {
  const latestYear = getLatestSectenYear(sectenData)
  if (latestYear === null) {
    return null
  }
  return getSectenEmissionsByYear(sectenData, latestYear, sector)
}

const getSectenYearlyReductionRates = (sectenData: SectenInfo[], sector?: SectenSector): Map<number, number> => {
  const rates = new Map<number, number>()

  for (let i = 1; i < sectenData.length; i++) {
    const prevEmissions = getSectenEmissionsByYear(sectenData, sectenData[i - 1].year, sector)
    const currEmissions = getSectenEmissionsByYear(sectenData, sectenData[i].year, sector)

    if (prevEmissions !== null && currEmissions !== null && prevEmissions > 0) {
      const reductionRate = (prevEmissions - currEmissions) / prevEmissions
      rates.set(sectenData[i].year, reductionRate)
    }
  }

  return rates
}

const getTrajectoryTargetEmissions = (
  sectenData: SectenInfo[],
  sector?: SectenSector,
): TrajectoryTargetEmissions | null => {
  if (sector) {
    return SNBC_SECTOR_TARGET_EMISSIONS[sector]
  }

  const emissions1990 = getSectenEmissionsByYear(sectenData, SNBC_REFERENCE_YEAR)
  if (emissions1990 === null) {
    return null
  }

  return {
    2030: emissions1990 * (1 - SNBC_2030_REDUCTION_RATE),
    2050: emissions1990 * (1 - SNBC_2050_REDUCTION_RATE),
  }
}

const calculateRateForSegment = (
  fromEmissions: number,
  toEmissions: number,
  fromYear: number,
  toYear: number,
): number | null => {
  if (fromEmissions <= 0 || fromEmissions <= toEmissions) {
    return 0
  }

  const years = toYear - fromYear
  if (years <= 0) {
    return null
  }

  const totalReduction = (fromEmissions - toEmissions) / fromEmissions
  return totalReduction / years
}

const getReductionStartYear = (studyStartYear: number, latestSectenYear: number): number => {
  if (studyStartYear < SNBC_REFERENCE_YEAR) {
    return SNBC_REFERENCE_YEAR
  }
  return Math.min(studyStartYear, latestSectenYear)
}

export const calculateSNBCReductionRates = (
  sectenData: SectenInfo[],
  studyStartYear: number,
  sector?: SectenSector,
): ReductionRates | null => {
  if (sectenData.length === 0) {
    return null
  }

  const targetEmissions = getTrajectoryTargetEmissions(sectenData, sector)
  if (!targetEmissions) {
    return null
  }

  const latestSectenYear = getLatestSectenYear(sectenData)
  if (latestSectenYear === null) {
    return null
  }

  const reductionStartYear = getReductionStartYear(studyStartYear, latestSectenYear)
  const reductionStartEmissions = getSectenEmissionsByYear(sectenData, reductionStartYear, sector)
  if (reductionStartEmissions === null || reductionStartEmissions <= 0) {
    return null
  }

  const rate2030To2050 = calculateRateForSegment(
    targetEmissions[2030],
    targetEmissions[2050],
    SNBC_MID_TARGET_YEAR,
    SNBC_FINAL_TARGET_YEAR,
  )
  if (rate2030To2050 === null) {
    return null
  }

  // Past 2030 OR already below 2030 target: use 2050 rate
  if (reductionStartYear >= SNBC_MID_TARGET_YEAR || reductionStartEmissions <= targetEmissions[2030]) {
    const rateTo2050 = calculateRateForSegment(
      reductionStartEmissions,
      targetEmissions[2050],
      reductionStartYear,
      SNBC_FINAL_TARGET_YEAR,
    )
    if (rateTo2050 === null) {
      return null
    }
    return { rateTo2030: rateTo2050, rateTo2050: rate2030To2050 }
  }

  // Sector-specific: calculate all 3 rates (1990→2015, 2015→2030, 2030→2050)
  if (sector && targetEmissions[2015] !== undefined) {
    const rate2015To2030 = calculateRateForSegment(
      targetEmissions[2015],
      targetEmissions[2030],
      SNBC_SECTOR_FIRST_TARGET_YEAR,
      SNBC_MID_TARGET_YEAR,
    )

    if (rate2015To2030 === null) {
      return null
    }

    if (reductionStartYear < SNBC_SECTOR_FIRST_TARGET_YEAR) {
      const rateTo2015 = calculateRateForSegment(
        reductionStartEmissions,
        targetEmissions[2015],
        reductionStartYear,
        SNBC_SECTOR_FIRST_TARGET_YEAR,
      )
      if (rateTo2015 === null) {
        return null
      }
      return { rateTo2015, rateTo2030: rate2015To2030, rateTo2050: rate2030To2050 }
    }

    return { rateTo2030: rate2015To2030, rateTo2050: rate2030To2050 }
  }

  // General trajectory: direct rate to 2030
  const rateTo2030 = calculateRateForSegment(
    reductionStartEmissions,
    targetEmissions[2030],
    reductionStartYear,
    SNBC_MID_TARGET_YEAR,
  )
  if (rateTo2030 === null) {
    return null
  }
  return { rateTo2030, rateTo2050: rate2030To2050 }
}

export const getSNBCGeneralDisplayedReductionRates = (trajectory: TrajectoryWithObjectives): ReductionRates | null => {
  const objective2030 = trajectory.objectives.find((obj) => obj.targetYear === 2030)
  const objective2050 = trajectory.objectives.find((obj) => obj.targetYear === 2050)
  if (objective2030 && objective2050) {
    return {
      rateTo2030: objective2030.reductionRate,
      rateTo2050: objective2050.reductionRate,
    }
  }
  return null
}

const getTrajectorySegments = (startYear: number, rates: ReductionRates): TrajectorySegment[] => {
  const segments: TrajectorySegment[] = []

  if (rates.rateTo2015) {
    segments.push({
      startYear,
      endYear: SNBC_SECTOR_FIRST_TARGET_YEAR,
      reductionRate: rates.rateTo2015,
    })
  }

  segments.push({
    startYear: rates.rateTo2015 ? SNBC_SECTOR_FIRST_TARGET_YEAR : startYear,
    endYear: SNBC_MID_TARGET_YEAR,
    reductionRate: rates.rateTo2030,
  })

  segments.push({
    startYear: SNBC_MID_TARGET_YEAR,
    endYear: SNBC_FINAL_TARGET_YEAR,
    reductionRate: rates.rateTo2050,
  })

  return segments
}

const buildFutureTrajectory = (
  startEmissions: number,
  segments: TrajectorySegment[],
  maxYear?: number,
): TrajectoryDataPoint[] => {
  const dataPoints: TrajectoryDataPoint[] = []
  let currentEmissions = startEmissions

  for (const segment of segments) {
    const yearlyReduction = currentEmissions * segment.reductionRate

    for (let year = segment.startYear + 1; year <= segment.endYear; year++) {
      currentEmissions = Math.max(0, currentEmissions - yearlyReduction)
      dataPoints.push({ year, value: currentEmissions })
    }
  }

  if (maxYear && maxYear > SNBC_FINAL_TARGET_YEAR) {
    for (let year = SNBC_FINAL_TARGET_YEAR + 1; year <= maxYear; year++) {
      dataPoints.push({ year, value: currentEmissions })
    }
  }

  return dataPoints
}

const interpolatePastEmissions = (
  fromEmissions: number,
  fromYear: number, // Most recent year to interpolate from
  toYear: number, // Earliest year to interpolate to
  reductionRates: Map<number, number>,
  firstReductionRate?: number,
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

    if (latestSectenYear !== null && year >= latestSectenYear) {
      // If no secten data for the year, use the first reduction rate
      rate = firstReductionRate
    }

    if (rate !== undefined && rate !== 1) {
      // From reduction formula E_n = E_n-1 * (1 - rate) => E_n-1 = E_n / (1 - rate)
      emissions = emissions / (1 - rate)
    }

    interpolatedEmissions.set(year, emissions)
  }

  return interpolatedEmissions
}

const buildPastTrajectory = (
  studyEmissions: number,
  studyStartYear: number,
  pastStudies: PastStudy[],
  reductionRates: Map<number, number>,
  calculatedRates: ReductionRates,
): TrajectoryDataPoint[] => {
  const dataPoints: TrajectoryDataPoint[] = []
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
    return dataPoints
  }

  const earliestPastStudyYear = pastStudies.length > 0 ? Math.min(...pastStudies.map((s) => s.year)) : null
  const interpolationFromYear = earliestPastStudyYear ?? studyStartYear
  const interpolationFromEmissions = earliestPastStudyYear
    ? pastStudies.find((s) => s.year === earliestPastStudyYear)!.totalCo2
    : studyEmissions

  const firstRate = calculatedRates.rateTo2015 ?? calculatedRates.rateTo2030

  const interpolatedEmissions = interpolatePastEmissions(
    interpolationFromEmissions,
    interpolationFromYear,
    graphStartYear,
    reductionRates,
    firstRate,
  )

  for (let year = graphStartYear; year < studyStartYear; year++) {
    if (year < interpolationFromYear) {
      const value = interpolatedEmissions.get(year)
      if (value !== undefined) {
        dataPoints.push({ year, value })
      }
    } else {
      const value = computePastOrPresentValue(year, historicalPoints, studyEmissions, studyStartYear)
      if (value !== null) {
        dataPoints.push({ year, value })
      }
    }
  }

  return dataPoints
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
export const calculateSNBCTrajectory = (
  params: CalculateTrajectoryParams,
  sector?: SectenSector,
): TrajectoryDataPoint[] => {
  const {
    studyEmissions,
    studyStartYear,
    sectenData,
    pastStudies = [],
    displayCurrentStudyValueOnTrajectory = true,
    overshootAdjustment,
    maxYear,
  } = params

  if (sectenData.length === 0) {
    return []
  }

  const futurReductionRates = calculateSNBCReductionRates(sectenData, studyStartYear, sector)
  if (futurReductionRates === null) {
    return []
  }

  const latestSectenYear = getLatestSectenYear(sectenData)
  const latestSectenEmissions = getLatestSectenEmissions(sectenData, sector)
  if (latestSectenYear === null || latestSectenEmissions === null) {
    return []
  }

  const sectenPastReductionRates = getSectenYearlyReductionRates(sectenData, sector)

  // Build past trajectory
  const pastDataPoints = buildPastTrajectory(
    studyEmissions,
    studyStartYear,
    pastStudies,
    sectenPastReductionRates,
    futurReductionRates, // Used for years between last secten available year and study start year
  )

  // Add current study point
  const dataPoints = [...pastDataPoints]
  if (displayCurrentStudyValueOnTrajectory) {
    dataPoints.push({ year: studyStartYear, value: studyEmissions })
  }

  // Apply overshoot compensation if needed
  let adjustedRates = futurReductionRates
  if (overshootAdjustment) {
    const objectives: { targetYear: number; reductionRate: number }[] = []
    if (futurReductionRates.rateTo2015) {
      objectives.push({ targetYear: SNBC_SECTOR_FIRST_TARGET_YEAR, reductionRate: futurReductionRates.rateTo2015 })
    }

    objectives.push({ targetYear: SNBC_MID_TARGET_YEAR, reductionRate: futurReductionRates.rateTo2030 })
    objectives.push({ targetYear: SNBC_FINAL_TARGET_YEAR, reductionRate: futurReductionRates.rateTo2050 })

    const correctedObjectives = getObjectivesWithOvershootCompensation(
      studyEmissions,
      studyStartYear,
      objectives,
      overshootAdjustment,
      pastStudies,
    )

    adjustedRates = {
      rateTo2015: correctedObjectives.find((o) => o?.targetYear === SNBC_SECTOR_FIRST_TARGET_YEAR)?.reductionRate ?? 0,
      rateTo2030: correctedObjectives.find((o) => o?.targetYear === SNBC_MID_TARGET_YEAR)?.reductionRate ?? 0,
      rateTo2050: correctedObjectives.find((o) => o?.targetYear === SNBC_FINAL_TARGET_YEAR)?.reductionRate ?? 0,
    }
  }

  // Build future trajectory using segments
  const startYearForReduction = Math.max(studyStartYear, SNBC_REFERENCE_YEAR)
  const segments = getTrajectorySegments(startYearForReduction, adjustedRates)
  const futureDataPoints = buildFutureTrajectory(studyEmissions, segments, maxYear)

  return [...dataPoints, ...futureDataPoints].sort((a, b) => a.year - b.year)
}
