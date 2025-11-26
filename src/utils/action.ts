import { ActionRelevance } from '@prisma/client'

export const RELEVANCE_TO_PRIORITY: Record<ActionRelevance, number> = {
  [ActionRelevance.ReductionWithinOrganisationCoreBusiness]: 1,
  [ActionRelevance.ReductionWithinOrganisationValueChain]: 1,
  [ActionRelevance.ReductionOutsideOrganisationValueChain]: 2,
  [ActionRelevance.Avoidance]: 3,
  [ActionRelevance.AvoidanceFinancing]: 4,
  [ActionRelevance.Sequestration]: 5,
  [ActionRelevance.Offsetting]: 6,
}

export const calculatePriorityFromRelevance = (relevances: ActionRelevance[]): number | null => {
  if (relevances.length === 0) {
    return null
  }

  return Math.min(...relevances.map((relevance) => RELEVANCE_TO_PRIORITY[relevance]))
}

export const getOrderedActionRelevances = (): ActionRelevance[] => {
  return Object.keys(RELEVANCE_TO_PRIORITY) as ActionRelevance[]
}
