import type {
  Action,
  ActionIndicator,
  ActionSite,
  ActionStep,
  ActionSubPost,
  ActionTag,
  ExternalStudy,
  Objective,
  ObjectiveSite,
  ObjectiveSubPost,
  ObjectiveTag,
  Study,
  StudySite,
  StudyTag,
  Trajectory,
  TransitionPlan,
  TransitionPlanStudy,
} from '@prisma/client'

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
export type TransitionPlanWithStudies = TransitionPlan & {
  study: {
    id: string
    name: string
    startDate: Date
  }
  transitionPlanStudies: TransitionPlanStudy[]
}

export type TransitionPlanWithRelations = TransitionPlan & {
  trajectories: Array<
    Trajectory & {
      objectives: ObjectiveWithScope[]
    }
  >
  transitionPlanStudies: Array<TransitionPlanStudy & { study: Pick<Study, 'startDate'> }>
  actions: Array<ActionWithRelations>
  externalStudies: ExternalStudy[]
}

export type TrajectoryWithObjectives = Trajectory & {
  objectives: Objective[]
}

export type ObjectiveWithScope = Objective & {
  sites: Array<ObjectiveSite & { studySite: StudySite }>
  tags: Array<ObjectiveTag & { studyTag: StudyTag }>
  subPosts: ObjectiveSubPost[]
}

export type TrajectoryWithObjectivesAndScope = Trajectory & {
  objectives: ObjectiveWithScope[]
}

export type ActionWithRelations = Action & {
  indicators: ActionIndicator[]
  steps: ActionStep[]
  sites: Array<ActionSite & { studySite: StudySite }>
  tags: Array<ActionTag & { studyTag: StudyTag }>
  subPosts: ActionSubPost[]
}
