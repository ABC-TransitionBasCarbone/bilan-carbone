import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import { StudyProps } from '@/components/hoc/withStudy'
import withStudyDetails from '@/components/hoc/withStudyDetails'
import withTransitionPlan, { TransitionPlanProps } from '@/components/hoc/withTransitionPlan'
import TrajectoryReductionPage from '@/components/pages/TrajectoryReductionPage'
import { getTrajectories } from '@/services/serverFunctions/trajectory'
import { getLinkedStudies, getStudyActions, getStudyTransitionPlan } from '@/services/serverFunctions/transitionPlan'

const TrajectoryReduction = async ({ study, canEdit }: StudyProps & UserSessionProps & TransitionPlanProps) => {
  const transitionPlanResponse = await getStudyTransitionPlan(study.id)

  if (!transitionPlanResponse.success || !transitionPlanResponse.data) {
    return <TrajectoryReductionPage study={study} canEdit={canEdit} transitionPlan={null} />
  }

  const transitionPlan = transitionPlanResponse.data

  const [trajectoriesResponse, linkedStudiesResponse, actionsResponse] = await Promise.all([
    getTrajectories(study.id, transitionPlan.id),
    getLinkedStudies(transitionPlan.id),
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
    />
  )
}

export default withAuth(withStudyDetails(withTransitionPlan(TrajectoryReduction)))
