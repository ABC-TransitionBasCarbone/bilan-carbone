import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import { StudyProps } from '@/components/hoc/withStudy'
import withStudyDetails from '@/components/hoc/withStudyDetails'
import withTransitionPlan, { TransitionPlanProps } from '@/components/hoc/withTransitionPlan'
import ObjectivesPage from '@/components/pages/ObjectivesPage'
import { getTransitionPlanByStudyId } from '@/db/transitionPlan'
import { checkStudyHasObjectives, getTrajectories } from '@/services/serverFunctions/trajectory'
import { redirect } from 'next/navigation'

const Objectives = async ({ study, canEdit }: StudyProps & UserSessionProps & TransitionPlanProps) => {
  const hasObjectives = await checkStudyHasObjectives(study.id)
  if (!hasObjectives) {
    redirect(`/etudes/${study.id}/trajectoires`)
  }

  const transitionPlan = await getTransitionPlanByStudyId(study.id)
  if (!transitionPlan) {
    redirect(`/etudes/${study.id}/trajectoires`)
  }

  const trajectoriesResponse = await getTrajectories(study.id, transitionPlan.id)
  if (!trajectoriesResponse.success || trajectoriesResponse.data.length === 0) {
    redirect(`/etudes/${study.id}/trajectoires`)
  }

  const trajectories = trajectoriesResponse.data
  return (
    <ObjectivesPage study={study} canEdit={canEdit} trajectories={trajectories} transitionPlanId={transitionPlan.id} />
  )
}

export default withAuth(withStudyDetails(withTransitionPlan(Objectives)))
