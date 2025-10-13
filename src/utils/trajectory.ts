import { TrajectoryDataPoint } from '@/components/study/transitionPlan/TrajectoryGraph'
import { FullStudy } from '@/db/study'
import { getStudyTotalCo2EmissionsWithDep } from '@/services/study'
import { ExternalStudy, TrajectoryType } from '@prisma/client'

export type SBTIType = 'SBTI_15' | 'SBTI_WB2C'
export const SBTI_REDUCTION_RATE_15 = 0.042
export const SBTI_REDUCTION_RATE_WB2C = 0.025
const REFERENCE_YEAR = 2020
export const MID_TAREGT_YEAR = 2030
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
