import { getUserApplicationSettings } from '@/db/user'
import { getLatestSectenVersion, getSectenData } from '@/services/serverFunctions/secten'
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

  const [
    trajectoriesResponse,
    linkedStudiesResponse,
    actionsResponse,
    sectenDataResponse,
    latestSectenVersionResponse,
  ] = await Promise.all([
    getTrajectories(studyId, transitionPlan.id),
    getLinkedAndExternalStudies(transitionPlan.id),
    getStudyActions(studyId),
    getSectenData(transitionPlan.sectenVersionId ?? undefined),
    getLatestSectenVersion(),
  ])

  const latestSectenVersion = latestSectenVersionResponse.success ? latestSectenVersionResponse.data : null

  const isSectenOutdated =
    latestSectenVersion !== null &&
    transitionPlan.sectenVersionId !== null &&
    transitionPlan.sectenVersionId !== latestSectenVersion.id

  return {
    transitionPlan,
    validatedOnly: settings.validatedEmissionSourcesOnly,
    trajectories: trajectoriesResponse.success ? trajectoriesResponse.data : [],
    linkedStudies: linkedStudiesResponse.success ? linkedStudiesResponse.data.linkedStudies : [],
    linkedExternalStudies: linkedStudiesResponse.success ? linkedStudiesResponse.data.externalStudies : [],
    actions: actionsResponse.success ? actionsResponse.data : null,
    sectenData: sectenDataResponse.success ? sectenDataResponse.data : [],
    latestSectenVersion,
    isSectenOutdated,
  }
}
