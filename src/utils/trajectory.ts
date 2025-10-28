import { TrajectoryDataPoint } from '@/components/study/transitionPlan/TrajectoryGraph'
import { FullStudy } from '@/db/study'
import { getStudyTotalCo2EmissionsWithDep } from '@/services/study'
import { Translations } from '@/types/translation'
import { Action, ActionPotentialDeduction, ExternalStudy, TrajectoryType } from '@prisma/client'
import { getYearFromDate } from './time'

export type SBTIType = 'SBTI_15' | 'SBTI_WB2C'
export const SBTI_REDUCTION_RATE_15 = 0.042
export const SBTI_REDUCTION_RATE_WB2C = 0.025
const REFERENCE_YEAR = 2020
export const MID_TARGET_YEAR = 2030
export const TARGET_YEAR = 2050

interface CalculateTrajectoryParams {
  baseEmissions: number
  studyStartYear: number
  reductionRate: number
  startYear?: number
  endYear?: number
  maxYear?: number
  linkedStudies?: FullStudy[]
  externalStudies?: ExternalStudy[]
}

// TODO: Refactor this with ticket https://github.com/ABC-TransitionBasCarbone/bilan-carbone/issues/1808
const getLinkedEmissions = (year: number, linkedStudies?: FullStudy[], externalStudies?: ExternalStudy[]) => {
  const startDate = new Date(`01-01-${year}`)
  const endDate = new Date(`01-01-${year + 1}`)

  const linkedStudy = linkedStudies?.find((study) => study.startDate >= startDate && study.startDate < endDate)
  if (linkedStudy) {
    return getStudyTotalCo2EmissionsWithDep(linkedStudy)
  } else {
    const linkedExternalStudy = externalStudies?.find((study) => study.date >= startDate && study.date < endDate)
    return linkedExternalStudy?.totalCo2
  }
}

export const calculateOvershoot = (
  studyYear: number,
  referenceYear: number,
  result: number,
  percentage: number,
): number => {
  let sum = 0
  for (let i = referenceYear; i <= studyYear; i++) {
    sum += 1 - (studyYear - i) * percentage
  }
  return (studyYear - referenceYear + 1) * result - sum * result
}

export const calculateCumulativeBudget = (
  targetYear: number,
  referenceYear: number,
  result: number,
  percentage: number,
): number => {
  let budget = 0
  for (let i = referenceYear; i <= targetYear; i++) {
    budget += (1 - (i - referenceYear) * percentage) * result
  }
  return budget
}

export const calculateNewTargetYear = (cumulativeBudgetAdjusted: number, result: number, studyYear: number): number => {
  return 2 * (cumulativeBudgetAdjusted / result) + studyYear
}

export const calculateNewLinearReductionRate = (
  reductionTarget: number,
  newTargetYear: number,
  studyYear: number,
): number => {
  return reductionTarget / (newTargetYear - studyYear)
}

const calculateDataPoint = (
  year: number,
  baseEmissions: number,
  thresholdYear: number,
  absoluteReductionRate: number,
): TrajectoryDataPoint => {
  if (year <= thresholdYear) {
    return { year, value: baseEmissions }
  }

  const yearsFromThreshold = year - thresholdYear
  const newEmissions = baseEmissions - yearsFromThreshold * absoluteReductionRate * baseEmissions
  return { year, value: Math.max(0, newEmissions) }
}

export const calculateSBTiTrajectory = ({
  baseEmissions,
  studyStartYear,
  reductionRate,
  maxYear,
  linkedStudies,
  externalStudies,
}: CalculateTrajectoryParams) => {
  const dataPoints: TrajectoryDataPoint[] = []

  if (baseEmissions === 0) {
    const graphStartYear = studyStartYear < REFERENCE_YEAR ? studyStartYear : REFERENCE_YEAR
    const endYear = maxYear ?? TARGET_YEAR

    for (let year = graphStartYear; year <= endYear; year++) {
      const linkedEmissions = getLinkedEmissions(year, linkedStudies, externalStudies)
      if (linkedEmissions) {
        dataPoints.push({ year, value: linkedEmissions })
      } else {
        dataPoints.push({ year, value: 0 })
      }
    }

    return dataPoints
  }

  if (studyStartYear > REFERENCE_YEAR) {
    const overshoot = calculateOvershoot(studyStartYear, REFERENCE_YEAR, baseEmissions, reductionRate)
    const cumulativeBudget = calculateCumulativeBudget(TARGET_YEAR, REFERENCE_YEAR, baseEmissions, reductionRate)
    const cumulativeBudgetAdjusted = cumulativeBudget - overshoot
    const nty = calculateNewTargetYear(cumulativeBudgetAdjusted, baseEmissions, studyStartYear)
    const newReductionRate = calculateNewLinearReductionRate(1, nty, studyStartYear)

    for (let year = REFERENCE_YEAR; year <= Math.max(nty, maxYear ?? TARGET_YEAR); year++) {
      const linkedEmissions = getLinkedEmissions(year, linkedStudies, externalStudies)
      if (linkedEmissions) {
        dataPoints.push({ year, value: linkedEmissions })
      } else {
        dataPoints.push(calculateDataPoint(year, baseEmissions, studyStartYear, newReductionRate))
      }
    }
  } else {
    const reductionStartYear = REFERENCE_YEAR
    const graphStartYear = studyStartYear < REFERENCE_YEAR ? studyStartYear : REFERENCE_YEAR
    const targetYear = Math.ceil(REFERENCE_YEAR + 1 / reductionRate)
    const endYear = Math.max(targetYear, maxYear ?? TARGET_YEAR)

    for (let year = graphStartYear; year <= endYear; year++) {
      const linkedEmissions = getLinkedEmissions(year, linkedStudies, externalStudies)
      if (linkedEmissions) {
        dataPoints.push({ year, value: linkedEmissions })
      } else {
        dataPoints.push(calculateDataPoint(year, baseEmissions, reductionStartYear, reductionRate))
      }
    }
  }

  return dataPoints
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
  baseEmissions,
  studyStartYear,
  objectives,
  linkedStudies,
  externalStudies,
}: {
  baseEmissions: number
  studyStartYear: number
  objectives: Array<{ targetYear: number; reductionRate: number }>
  linkedStudies?: FullStudy[]
  externalStudies?: ExternalStudy[]
}): TrajectoryDataPoint[] => {
  if (objectives.length === 0) {
    return []
  }

  const dataPoints: TrajectoryDataPoint[] = []
  let currentValue = baseEmissions
  let startYear = studyStartYear

  for (let year = REFERENCE_YEAR; year < studyStartYear; year++) {
    const linkedEmissions = getLinkedEmissions(year, linkedStudies, externalStudies)
    if (linkedEmissions) {
      dataPoints.push({ year, value: linkedEmissions })
    } else {
      dataPoints.push({ year, value: baseEmissions })
    }
  }

  dataPoints.push({ year: studyStartYear, value: baseEmissions })

  const sortedObjectives = [...objectives].sort((a, b) => a.targetYear - b.targetYear)
  for (let i = 0; i < sortedObjectives.length; i++) {
    const objective = sortedObjectives[i]
    const absoluteReductionRate = Number(objective.reductionRate)
    const yearlyReduction = currentValue * absoluteReductionRate
    const isLastObjective = i === sortedObjectives.length - 1

    for (let year = startYear + 1; year <= objective.targetYear; year++) {
      currentValue = currentValue - yearlyReduction
      dataPoints.push({ year, value: Math.max(0, currentValue) })
    }

    if (isLastObjective && currentValue > 0) {
      let year = objective.targetYear + 1
      while (currentValue > 0) {
        currentValue = currentValue - yearlyReduction
        dataPoints.push({ year, value: Math.max(0, currentValue) })
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

export const calculateActionBasedTrajectory = ({
  baseEmissions,
  studyStartYear,
  actions,
  linkedStudies,
  externalStudies,
  maxYear,
}: {
  baseEmissions: number
  studyStartYear: number
  actions: Action[]
  linkedStudies?: FullStudy[]
  externalStudies?: ExternalStudy[]
  maxYear?: number
}): TrajectoryDataPoint[] => {
  const dataPoints: TrajectoryDataPoint[] = []

  for (let year = REFERENCE_YEAR; year < studyStartYear; year++) {
    const linkedEmissions = getLinkedEmissions(year, linkedStudies, externalStudies)
    if (linkedEmissions) {
      dataPoints.push({ year, value: linkedEmissions })
    } else {
      dataPoints.push({ year, value: baseEmissions })
    }
  }

  let currentEmissions = baseEmissions
  dataPoints.push({ year: studyStartYear, value: currentEmissions })

  const quantitativeActions = actions.filter(
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
            action.reductionEndYear ? getYearFromDate(action.reductionEndYear) : 0,
          ),
        )
      : 0

  const maxDefaultEndYear = Math.max(maxYear ?? TARGET_YEAR, TARGET_YEAR)
  const maxEndYear = Math.max(maxActionsEndYear, maxDefaultEndYear)
  const yearlyReductions: Record<number, number> = {}

  for (const action of quantitativeActions) {
    const startYear = action.reductionStartYear ? getYearFromDate(action.reductionStartYear) : 0
    const endYear = action.reductionEndYear ? getYearFromDate(action.reductionEndYear) : 0

    if (startYear === endYear) {
      yearlyReductions[startYear] = action.reductionValue ?? 0
    } else if (startYear <= endYear) {
      for (let year = startYear; year <= endYear; year++) {
        const actionDuration = endYear - startYear
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

  for (let year = studyStartYear + 1; year <= maxEndYear; year++) {
    const yearlyReduction = yearlyReductions[year] ?? 0
    currentEmissions = Math.max(0, currentEmissions - yearlyReduction)
    dataPoints.push({ year, value: currentEmissions })
  }

  return dataPoints
}
