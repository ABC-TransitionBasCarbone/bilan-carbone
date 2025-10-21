import { TrajectoryDataPoint } from '@/components/study/transitionPlan/TrajectoryGraph'

export const SBTI_REDUCTION_RATE_15 = 0.042
export const SBTI_REDUCTION_RATE_WB2C = 0.025
const REFERENCE_YEAR = 2020
const TARGET_YEAR = 2050

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
}: {
  baseEmissions: number
  studyStartYear: number
  reductionRate: number
  maxYear?: number
}) => {
  const dataPoints: TrajectoryDataPoint[] = []

  if (studyStartYear > REFERENCE_YEAR) {
    const overshoot = calculateOvershoot(studyStartYear, REFERENCE_YEAR, baseEmissions, reductionRate)
    const cumulativeBudget = calculateCumulativeBudget(TARGET_YEAR, REFERENCE_YEAR, baseEmissions, reductionRate)
    const cumulativeBudgetAdjusted = cumulativeBudget - overshoot
    const nty = calculateNewTargetYear(cumulativeBudgetAdjusted, baseEmissions, studyStartYear)
    const newReductionRate = calculateNewLinearReductionRate(1, nty, studyStartYear)

    // Create data points until a specific year which depends on other trajectories and calculated target year
    for (let year = REFERENCE_YEAR; year <= Math.max(nty, maxYear ?? TARGET_YEAR); year++) {
      dataPoints.push(calculateDataPoint(year, baseEmissions, studyStartYear, newReductionRate))
    }
  } else {
    const reductionStartYear = REFERENCE_YEAR
    const graphStartYear = studyStartYear < REFERENCE_YEAR ? studyStartYear : REFERENCE_YEAR
    const targetYear = Math.ceil(REFERENCE_YEAR + 1 / reductionRate)
    const endYear = Math.max(targetYear, maxYear ?? TARGET_YEAR)

    for (let year = graphStartYear; year <= endYear; year++) {
      dataPoints.push(calculateDataPoint(year, baseEmissions, reductionStartYear, reductionRate))
    }
  }

  return dataPoints
}
