import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import { StudyProps } from '@/components/hoc/withStudy'
import withStudyDetails from '@/components/hoc/withStudyDetails'
import withTransitionPlan, { TransitionPlanProps } from '@/components/hoc/withTransitionPlan'
import ObjectivesPage from '@/components/pages/ObjectivesPage'
import { getTrajectoriesByTransitionPlanId } from '@/db/trajectory'
import { getTransitionPlanByStudyId } from '@/db/transitionPlan'
import { redirect } from 'next/navigation'

const Objectives = async ({ study, canEdit }: StudyProps & UserSessionProps & TransitionPlanProps) => {
  const transitionPlan = await getTransitionPlanByStudyId(study.id)
  if (!transitionPlan) {
    redirect(`/etudes/${study.id}/trajectoires`)
  }

  const trajectories = await getTrajectoriesByTransitionPlanId(transitionPlan.id)
  if (trajectories.length === 0 || trajectories.some((trajectory) => trajectory.objectives.length === 0)) {
    redirect(`/etudes/${study.id}/trajectoires`)
  }

  return <ObjectivesPage study={study} canEdit={canEdit} />
}

export default withAuth(withStudyDetails(withTransitionPlan(Objectives)))
