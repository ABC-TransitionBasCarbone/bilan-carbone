import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import { StudyProps } from '@/components/hoc/withStudy'
import withStudyDetails from '@/components/hoc/withStudyDetails'
import TrajectoryReductionPage from '@/components/pages/TrajectoryReductionPage'
import { hasAccessToTransitionPlan } from '@/services/permissions/study'
import { redirect } from 'next/navigation'

const TrajectoryReduction = async ({ study, user }: StudyProps & UserSessionProps) => {
  const hasAccess = await hasAccessToTransitionPlan(study.organizationVersion.environment)

  if (!hasAccess) {
    redirect(`/etudes/${study.id}`)
  }

  return <TrajectoryReductionPage study={study} user={user} />
}

export default withAuth(withStudyDetails(TrajectoryReduction))
