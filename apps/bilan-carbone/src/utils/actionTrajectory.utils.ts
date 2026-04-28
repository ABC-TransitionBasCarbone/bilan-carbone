import { TARGET_YEAR } from '@/constants/trajectory.constants'
import type { PastStudy, TrajectoryDataPoint } from '@/types/trajectory.types'
import type { Action } from '@repo/db-common'
import { ActionPotentialDeduction, StudyResultUnit } from '@repo/db-common/enums'
import { getYearFromDateStr } from '@repo/utils'
import { convertValue } from './study'
import {
  addHistoricalDataAndStudyPoint,
  getTrajectoryEmissionsAtYear,
  isWithinThreshold,
} from './trajectory-shared.utils'

interface CalculateActionBasedTrajectoryParams {
  studyEmissions: number
  studyStartYear: number
  studyUnit: StudyResultUnit
  actions: Action[]
  pastStudies?: PastStudy[]
  minYear?: number
  maxYear?: number
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
