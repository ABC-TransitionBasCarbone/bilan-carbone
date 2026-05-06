import {
  SECTEN_SECTORS,
  SectenSector,
  SNBC_FINAL_TARGET_YEAR,
  SNBC_REFERENCE_YEAR,
  SNBC_SECTOR_TARGET_EMISSIONS,
  TRAJECTORY_SNBC_GENERAL_ID,
} from '@/constants/trajectory.constants'
import { SectorPercentages } from '@/services/serverFunctions/trajectory.command'
import type {
  BaseObjective,
  OvershootAdjustment,
  PastStudy,
  TrajectoryDataPoint,
  TrajectoryWithObjectivesAndScope,
} from '@/types/trajectory.types'
import { TrajectoryData } from '@/types/trajectory.types'
import type { SectenInfo } from '@abc-transitionbascarbone/db-common'
import { TrajectoryType } from '@abc-transitionbascarbone/db-common/enums'
import { isSectenSector } from './secten'
import {
  computePastOrPresentValue,
  getAllHistoricalStudyPoints,
  getGraphStartYear,
  getObjectivesWithOvershootCompensation,
  getTrajectoryEmissionsAtYear,
  isFailedTrajectory,
  isWithinThreshold,
} from './trajectory-shared.utils'

// SNBC trajectory constants
const SNBC_SECTOR_FIRST_TARGET_YEAR = 2015
const SNBC_MID_TARGET_YEAR = 2030
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

export interface ReductionRates {
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

/**
 * Calculate the reduction rates for non-custom SNBC trajectories (SNBC_GENERAL and SNBC_SECTORAL)
 */
export const calculateBaseSNBCReductionRates = (
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

export const extractSNBCReductionRatesFromObjectives = (objectives: BaseObjective[]): ReductionRates | null => {
  const objective2015 = objectives.find((obj) => obj.targetYear === 2015)
  const objective2030 = objectives.find((obj) => obj.targetYear === 2030)
  const objective2050 = objectives.find((obj) => obj.targetYear === 2050)
  if (objective2030 && objective2050) {
    return {
      rateTo2015: objective2015?.reductionRate,
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

  const futurReductionRates = calculateBaseSNBCReductionRates(sectenData, studyStartYear, sector)
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

/**
 * Calculate yearly reduction rates for SNBC sectoral trajectory by deriving them from the actual combined trajectory.
 * This ensures the displayed rates match exactly what the trajectory building produces.
 * Returns yearly rates (not total reduction rates) to match SBTI and CUSTOM trajectory format.
 */
export const calculateSectoralSNBCReductionRates = (
  params: CalculateTrajectoryParams,
  sectorPercentages: SectorPercentages,
): ReductionRates | null => {
  const { sectenData, studyStartYear } = params

  if (sectenData.length === 0) {
    return null
  }

  const trajectory = calculateCustomSNBCSectoralTrajectory(params, sectorPercentages)

  const baselinePoint = trajectory.find((p) => p.year === studyStartYear)
  const point2015 = trajectory.find((p) => p.year === 2015)
  const point2030 = trajectory.find((p) => p.year === 2030)
  const point2050 = trajectory.find((p) => p.year === 2050)

  if (!baselinePoint || !point2030 || !point2050) {
    return null
  }

  const yearlyRate2030 = calculateRateForSegment(baselinePoint.value, point2030.value, studyStartYear, 2030)
  const yearlyRate2050 = calculateRateForSegment(point2030.value, point2050.value, 2030, 2050)

  if (yearlyRate2030 === null || yearlyRate2050 === null) {
    return null
  }

  const rates: ReductionRates = {
    rateTo2030: yearlyRate2030,
    rateTo2050: yearlyRate2050,
  }

  if (studyStartYear < 2015 && point2015) {
    const yearlyRate2015 = calculateRateForSegment(baselinePoint.value, point2015.value, studyStartYear, 2015)
    const adjustedRate2030 = calculateRateForSegment(point2015.value, point2030.value, 2015, 2030)
    if (yearlyRate2015 !== null && adjustedRate2030 !== null) {
      rates.rateTo2015 = yearlyRate2015
      rates.rateTo2030 = adjustedRate2030
    }
  }

  return rates
}

// Create proportional past studies for each sector based on percentages
const createPercentageBasedPastStudies = (pastStudies: PastStudy[] | undefined, percentage: number): PastStudy[] => {
  if (!pastStudies) {
    return []
  }

  return pastStudies
    .map((study) => ({
      ...study,
      totalCo2: study.totalCo2 * (percentage / 100),
    }))
    .sort((a, b) => a.year - b.year)
}

export const calculateCustomSNBCSectoralTrajectory = (
  params: CalculateTrajectoryParams,
  sectorPercentages: SectorPercentages,
): TrajectoryDataPoint[] => {
  const totalSectorPercentage = Object.values(sectorPercentages).reduce((sum, p) => sum + p, 0)
  const generalPercentage = 100 - totalSectorPercentage

  const allTrajectories: TrajectoryDataPoint[][] = []

  const allSectors = [...SECTEN_SECTORS, 'general'] as (SectenSector | 'general')[]
  for (const sector of allSectors) {
    const percentage = sector === 'general' ? generalPercentage : sectorPercentages[sector]
    const sectorEmissions = params.studyEmissions * (percentage / 100)
    const percentageBasedPastStudies = createPercentageBasedPastStudies(params.pastStudies, percentage)

    let sectorOvershootAdjustment: OvershootAdjustment | undefined

    if (params.overshootAdjustment) {
      const { referenceStudyYear } = params.overshootAdjustment
      const referenceStudyTotalEmissions = params.pastStudies?.find((s) => s.year === referenceStudyYear)?.totalCo2

      if (referenceStudyTotalEmissions) {
        const referenceSectorEmissions = referenceStudyTotalEmissions * (percentage / 100)
        const referencePercentageBasedPastStudies = createPercentageBasedPastStudies(
          params.pastStudies?.filter((s) => s.year < referenceStudyYear),
          percentage,
        )

        const referenceSectorTrajectory = calculateSNBCTrajectory(
          {
            studyEmissions: referenceSectorEmissions,
            studyStartYear: referenceStudyYear,
            sectenData: params.sectenData,
            pastStudies: referencePercentageBasedPastStudies,
            displayCurrentStudyValueOnTrajectory: true,
            overshootAdjustment: undefined,
            maxYear: params.maxYear,
          },
          sector === 'general' ? undefined : sector,
        )

        sectorOvershootAdjustment = {
          referenceTrajectory: referenceSectorTrajectory,
          referenceStudyYear,
        }
      }
    }

    allTrajectories.push(
      calculateSNBCTrajectory(
        {
          ...params,
          studyEmissions: sectorEmissions,
          pastStudies: percentageBasedPastStudies,
          overshootAdjustment: sectorOvershootAdjustment,
        },
        sector === 'general' ? undefined : sector,
      ),
    )
  }

  const allYears = new Set<number>()

  allTrajectories.forEach((trajectory) => {
    trajectory.forEach((point) => allYears.add(point.year))
  })

  const sortedYears = Array.from(allYears).sort((a, b) => a - b)

  const combinedTrajectory = sortedYears.map((year) => {
    const combinedValue = allTrajectories.reduce((sum, trajectory) => {
      const point = trajectory.find((p) => p.year === year)
      return sum + (point?.value ?? 0)
    }, 0)

    return { year, value: combinedValue }
  })

  return combinedTrajectory
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

export const calculateSNBCTrajectoryByType = (
  sectorId: string,
  params: CalculateTrajectoryParams,
): TrajectoryDataPoint[] => {
  if (sectorId === TRAJECTORY_SNBC_GENERAL_ID) {
    return calculateSNBCTrajectory(params)
  }
  if (isSectenSector(sectorId)) {
    return calculateSNBCTrajectory(params, sectorId)
  }
  return []
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
