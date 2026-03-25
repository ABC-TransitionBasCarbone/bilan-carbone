export interface TrajectoryDataPoint {
  year: number
  value: number
}

export interface ObjectiveGroup {
  ratio: number
  objectives: BaseObjective[]
}
export interface PastStudy {
  id: string
  name: string
  type: 'linked' | 'external'
  year: number
  totalCo2: number
}
export interface BaseObjective {
  targetYear: number
  reductionRate: number
}
export interface OvershootAdjustment {
  referenceTrajectory: TrajectoryDataPoint[]
  referenceStudyYear: number
}
