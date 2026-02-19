import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import { StudyProps } from '@/components/hoc/withStudy'
import withStudyDetails from '@/components/hoc/withStudyDetails'
import withTransitionPlan, { TransitionPlanProps } from '@/components/hoc/withTransitionPlan'
import TransitionPlanInitPage from '@/components/pages/TransitionPlanInitPage'
import { getUserApplicationSettings } from '@/db/user'
import { getSectenData } from '@/services/serverFunctions/secten'
import { getTrajectories } from '@/services/serverFunctions/trajectory.serverFunction'
import { getLinkedAndExternalStudies, getStudyTransitionPlan } from '@/services/serverFunctions/transitionPlan'

const TransitionPlanInit = async ({ study, canEdit, user }: StudyProps & UserSessionProps & TransitionPlanProps) => {
  const [transitionPlanResponse, settings] = await Promise.all([
    getStudyTransitionPlan(study.id),
    getUserApplicationSettings(user.accountId),
  ])

  const transitionPlan = transitionPlanResponse.success ? transitionPlanResponse.data : null

  if (!transitionPlan) {
    return (
      <TransitionPlanInitPage
        study={study}
        canEdit={canEdit}
        transitionPlan={null}
        trajectories={[]}
        linkedStudies={[]}
        linkedExternalStudies={[]}
        validatedOnly={settings.validatedEmissionSourcesOnly}
        sectenData={[]}
      />
    )
  }

  const [trajectoriesResponse, linkedStudiesResponse, sectenDataResponse] = await Promise.all([
    getTrajectories(study.id, transitionPlan.id),
    getLinkedAndExternalStudies(transitionPlan.id),
    getSectenData(),
  ])

  return (
    <TransitionPlanInitPage
      study={study}
      canEdit={canEdit}
      transitionPlan={transitionPlan}
      trajectories={trajectoriesResponse.success ? trajectoriesResponse.data : []}
      linkedStudies={linkedStudiesResponse.success ? linkedStudiesResponse.data.linkedStudies : []}
      linkedExternalStudies={linkedStudiesResponse.success ? linkedStudiesResponse.data.externalStudies : []}
      validatedOnly={settings.validatedEmissionSourcesOnly}
      sectenData={sectenDataResponse.success ? sectenDataResponse.data : []}
    />
  )
}

export default withAuth(withStudyDetails(withTransitionPlan(TransitionPlanInit)))
