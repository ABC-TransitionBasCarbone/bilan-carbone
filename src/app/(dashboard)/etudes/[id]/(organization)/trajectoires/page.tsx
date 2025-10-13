import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import { StudyProps } from '@/components/hoc/withStudy'
import withStudyDetails from '@/components/hoc/withStudyDetails'
import withTransitionPlan, { TransitionPlanProps } from '@/components/hoc/withTransitionPlan'
import TrajectoryReductionPage from '@/components/pages/TrajectoryReductionPage'

const TrajectoryReduction = async ({ study, canEdit }: StudyProps & UserSessionProps & TransitionPlanProps) => {
  return <TrajectoryReductionPage study={study} canEdit={canEdit} />
}

export default withAuth(withStudyDetails(withTransitionPlan(TrajectoryReduction)))
