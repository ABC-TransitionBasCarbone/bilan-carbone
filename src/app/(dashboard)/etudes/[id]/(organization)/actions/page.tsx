import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import { StudyProps } from '@/components/hoc/withStudy'
import withStudyDetails from '@/components/hoc/withStudyDetails'
import withTransitionPlan, { TransitionPlanProps } from '@/components/hoc/withTransitionPlan'
import ActionsPage from '@/components/pages/ActionsPage'
import NotFound from '@/components/pages/NotFound'
import { hasTransitionPlan } from '@/db/transitionPlan'
import { getUserApplicationSettings } from '@/db/user'
import { getSectenData } from '@/services/serverFunctions/secten'
import { getTrajectories } from '@/services/serverFunctions/trajectory.serverFunction'
import {
  getLinkedAndExternalStudies,
  getStudyActions,
  getStudyTransitionPlan,
} from '@/services/serverFunctions/transitionPlan'
import { redirect } from 'next/navigation'

const Actions = async ({ study, canEdit, user }: StudyProps & UserSessionProps & TransitionPlanProps) => {
  const studyHasTransitionPlan = await hasTransitionPlan(study.id)
  if (!studyHasTransitionPlan) {
    redirect(`/etudes/${study.id}/initialisation`)
  }

  const [transitionPlanResponse, settings] = await Promise.all([
    getStudyTransitionPlan(study.id),
    getUserApplicationSettings(user.accountId),
  ])

  if (!transitionPlanResponse.success || !transitionPlanResponse.data) {
    return <NotFound />
  }

  const transitionPlan = transitionPlanResponse.data

  const [actionsResponse, trajectoriesResponse, linkedStudiesResponse, sectenDataResponse] = await Promise.all([
    getStudyActions(study.id),
    getTrajectories(study.id, transitionPlan.id),
    getLinkedAndExternalStudies(transitionPlan.id),
    getSectenData(),
  ])

  if (!actionsResponse.success) {
    return <NotFound />
  }

  return (
    <ActionsPage
      study={study}
      actions={actionsResponse.data}
      transitionPlanId={transitionPlan.id}
      canEdit={canEdit}
      trajectories={trajectoriesResponse.success ? trajectoriesResponse.data : []}
      linkedStudies={linkedStudiesResponse.success ? linkedStudiesResponse.data.linkedStudies : []}
      linkedExternalStudies={linkedStudiesResponse.success ? linkedStudiesResponse.data.externalStudies : []}
      validatedOnly={settings.validatedEmissionSourcesOnly}
      sectenData={sectenDataResponse.success ? sectenDataResponse.data : []}
    />
  )
}

export default withAuth(withStudyDetails(withTransitionPlan(Actions)))
