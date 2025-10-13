import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import { StudyProps } from '@/components/hoc/withStudy'
import withStudyDetails from '@/components/hoc/withStudyDetails'
import TrajectoryReductionPage from '@/components/pages/TrajectoryReductionPage'
import {
  canEditTransitionPlan,
  canViewTransitionPlan,
  isFeatureTransitionPlanActive,
} from '@/services/permissions/study'
import { redirect } from 'next/navigation'

const TrajectoryReduction = async ({ study, user }: StudyProps & UserSessionProps) => {
  const isTransitionPlanActive = await isFeatureTransitionPlanActive(study.organizationVersion.environment)

  if (!isTransitionPlanActive) {
    redirect(`/etudes/${study.id}`)
  }

  const canView = await canViewTransitionPlan(user, study)
  if (!canView) {
    redirect(`/etudes/${study.id}`)
  }

  const canEdit = await canEditTransitionPlan(user, study)

  return <TrajectoryReductionPage study={study} canEdit={canEdit} />
}

export default withAuth(withStudyDetails(TrajectoryReduction))
