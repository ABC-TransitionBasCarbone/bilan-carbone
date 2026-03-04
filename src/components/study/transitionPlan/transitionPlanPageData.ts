import { getUserApplicationSettings } from '@/db/user'
import { getSectenData } from '@/services/serverFunctions/secten'
import { getTrajectories } from '@/services/serverFunctions/trajectory.serverFunction'
import {
  getLinkedAndExternalStudies,
  getStudyActions,
  getStudyTransitionPlan,
} from '@/services/serverFunctions/transitionPlan'

export const loadTransitionPlanPageData = async (studyId: string, accountId: string) => {
  const [transitionPlanResponse, settings] = await Promise.all([
    getStudyTransitionPlan(studyId),
    getUserApplicationSettings(accountId),
  ])

  if (!transitionPlanResponse.success || !transitionPlanResponse.data) {
    return null
  }

  const transitionPlan = transitionPlanResponse.data

  const [trajectoriesResponse, linkedStudiesResponse, actionsResponse, sectenDataResponse] = await Promise.all([
    getTrajectories(studyId, transitionPlan.id),
    getLinkedAndExternalStudies(transitionPlan.id),
    getStudyActions(studyId),
    getSectenData(),
  ])

  return {
    transitionPlan,
    validatedOnly: settings.validatedEmissionSourcesOnly,
    trajectories: trajectoriesResponse.success ? trajectoriesResponse.data : [],
    linkedStudies: linkedStudiesResponse.success ? linkedStudiesResponse.data.linkedStudies : [],
    linkedExternalStudies: linkedStudiesResponse.success ? linkedStudiesResponse.data.externalStudies : [],
    actions: actionsResponse.success ? actionsResponse.data : null,
    sectenData: sectenDataResponse.success ? sectenDataResponse.data : [],
  }
}
