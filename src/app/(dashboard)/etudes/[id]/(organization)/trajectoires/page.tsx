import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import { StudyProps } from '@/components/hoc/withStudy'
import withStudyDetails from '@/components/hoc/withStudyDetails'
import withTransitionPlan, { TransitionPlanProps } from '@/components/hoc/withTransitionPlan'
import TrajectoryReductionPage from '@/components/pages/TrajectoryReductionPage'
import { getUserApplicationSettings } from '@/db/user'
import { getTrajectories } from '@/services/serverFunctions/trajectory'
import {
  getLinkedAndExternalStudies,
  getStudyActions,
  getStudyTransitionPlan,
} from '@/services/serverFunctions/transitionPlan'

const TrajectoryReduction = async ({ study, canEdit, user }: StudyProps & UserSessionProps & TransitionPlanProps) => {
  const [transitionPlanResponse, settings] = await Promise.all([
    getStudyTransitionPlan(study.id),
    getUserApplicationSettings(user.accountId),
  ])

  if (!transitionPlanResponse.success || !transitionPlanResponse.data) {
    return (
      <TrajectoryReductionPage
        study={study}
        canEdit={canEdit}
        transitionPlan={null}
        validatedOnly={settings.validatedEmissionSourcesOnly}
      />
    )
  }

  const transitionPlan = transitionPlanResponse.data

  const [trajectoriesResponse, linkedStudiesResponse, actionsResponse] = await Promise.all([
    getTrajectories(study.id, transitionPlan.id),
    getLinkedAndExternalStudies(transitionPlan.id),
    getStudyActions(study.id),
  ])

  return (
    <TrajectoryReductionPage
      study={study}
      canEdit={canEdit}
      transitionPlan={transitionPlan}
      trajectories={trajectoriesResponse.success ? trajectoriesResponse.data : []}
      linkedStudies={linkedStudiesResponse.success ? linkedStudiesResponse.data.studies : []}
      linkedExternalStudies={linkedStudiesResponse.success ? linkedStudiesResponse.data.externalStudies : []}
      actions={actionsResponse.success ? actionsResponse.data : []}
      validatedOnly={settings.validatedEmissionSourcesOnly}
    />
  )
}

export default withAuth(withStudyDetails(withTransitionPlan(TrajectoryReduction)))
