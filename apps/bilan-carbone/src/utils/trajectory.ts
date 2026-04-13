import {
  MID_TARGET_YEAR,
  SBTI_REDUCTION_RATE_15,
  SBTI_REDUCTION_RATE_WB2C,
  SBTI_START_YEAR,
  SNBC_REFERENCE_YEAR,
  TARGET_YEAR,
  TRAJECTORY_15_ID,
  TRAJECTORY_WB2C_ID,
} from '@/constants/trajectory.constants'
import type { SectorPercentages } from '@/services/serverFunctions/trajectory.command'
import type {
  BaseObjective,
  ObjectiveGroup,
  OvershootAdjustment,
  PastStudy,
  TrajectoryData,
  TrajectoryDataPoint,
  TrajectoryResult,
  TrajectoryWithObjectives,
} from '@/types/trajectory.types'
import type { Translations } from '@/types/translation'
import { Action, SectenInfo } from '@repo/db-common'
import { ActionPotentialDeduction, StudyResultUnit, TrajectoryType } from '@repo/db-common/enums'
import { getActionBasedData } from './actionTrajectory.utils'
import { calculateCustomTrajectory, getCustomData } from './customTrajectory.utils'
import { getDefaultSBTiData, getDefaultSBTIReductionRate, getSBTiCorrectedRateAndEndYear } from './sbti'
import {
  calculateCustomSNBCSectoralTrajectory,
  calculateSectoralSNBCReductionRates,
  calculateSNBCTrajectory,
  getSNBCData,
} from './snbc'
import { getYearFromDateStr } from './time'
import {
  computePastOrPresentValue,
  getAllHistoricalStudyPoints,
  getEarliestPastStudyYear,
  getObjectivesWithOvershootCompensation,
  getTrajectoryEmissionsAtYear,
  isWithinThreshold,
} from './trajectory-shared.utils'

interface CalculateTrajectoriesWithHistoryParams {
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
  objectiveGroupsByTrajectoryId?: Map<string, ObjectiveGroup[]>
}

interface TrajectoryYearBounds {
  minYear: number
  maxYear: number
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
    minYear = Math.min(minYear, SNBC_REFERENCE_YEAR)
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
      minYear = Math.min(minYear, SNBC_REFERENCE_YEAR)
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

const getLatestPastStudy = (pastStudies: PastStudy[]): PastStudy | null => {
  if (pastStudies.length === 0) {
    return null
  }
  return pastStudies.reduce((mostRecent, current) => (current.year > mostRecent.year ? current : mostRecent))
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
  objectiveGroupsByTrajectoryId,
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
    objectiveGroupsByTrajectoryId,
  )

  const defaultTrajectoryDataPoints = defaultTrajectoryData?.data.currentTrajectory ?? []
  const earliestPastStudyYearForSBTI = getEarliestPastStudyYear(pastStudies)
  const sbtiDefaultTrajectoryPivotYear =
    earliestPastStudyYearForSBTI !== null && earliestPastStudyYearForSBTI > SBTI_START_YEAR
      ? earliestPastStudyYearForSBTI
      : SBTI_START_YEAR
  const defaultTrajectoryForSBTI = defaultTrajectoryDataPoints.filter((p) => p.year <= sbtiDefaultTrajectoryPivotYear)

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

export const getYearsToDisplay = (trajectories: TrajectoryData[]): number[] => {
  const allYears = trajectories.flatMap((traj) => {
    if (!traj) {
      return []
    }
    // We need both current and past points in case the current trajectory is only a single point due to being bellow threshold
    return [...traj.currentTrajectory.map((d) => d.year), ...(traj.previousTrajectory?.map((d) => d.year) ?? [])]
  })
  return Array.from(new Set(allYears)).sort((a, b) => a - b)
}

export const getDisplayedReferenceYearForTrajectoryType = (type: TrajectoryType, studyYear: number): number => {
  if (type === TrajectoryType.SBTI_15 || type === TrajectoryType.SBTI_WB2C) {
    return SBTI_START_YEAR
  } else if (type === TrajectoryType.SNBC_GENERAL || type === TrajectoryType.SNBC_SECTORAL) {
    return SNBC_REFERENCE_YEAR
  }

  // For custom trajectories, use the study year as reference year
  return studyYear
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
