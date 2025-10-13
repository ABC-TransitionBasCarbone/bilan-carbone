export const SBTI_REDUCTION_RATE_15 = 0.042
export const SBTI_REDUCTION_RATE_2 = 0.025

export interface TrajectoryDataPoint {
  year: number
  value: number
}

interface CalculateTrajectoryParams {
  baseEmissions: number
  studyStartYear: number
  reductionRate: number
  startYear?: number
  endYear?: number
}

export const calculateTrajectory = ({
  baseEmissions,
  studyStartYear,
  reductionRate,
  startYear = 2020,
  endYear = 2050,
}: CalculateTrajectoryParams): TrajectoryDataPoint[] => {
  const dataPoints: TrajectoryDataPoint[] = []

  // TODO: Add logic if start year is after 2020, with overshoot compensation

  let currentEmissions = baseEmissions
  const reductionStartYear = 2020
  const graphStartYear = studyStartYear < 2020 ? studyStartYear : startYear

  for (let year = graphStartYear; year <= endYear; year++) {
    if (year < reductionStartYear) {
      dataPoints.push({ year, value: baseEmissions })
    } else if (year === reductionStartYear) {
      dataPoints.push({ year, value: currentEmissions })
    } else {
      currentEmissions = currentEmissions * (1 - reductionRate)
      dataPoints.push({ year, value: Math.max(0, currentEmissions) })
    }
  }

  return dataPoints
}
