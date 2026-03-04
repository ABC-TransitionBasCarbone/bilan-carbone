import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import { StudyProps } from '@/components/hoc/withStudy'
import withStudyDetails from '@/components/hoc/withStudyDetails'
import withTransitionPlan, { TransitionPlanProps } from '@/components/hoc/withTransitionPlan'
import NotFound from '@/components/pages/NotFound'
import TrajectoryPage from '@/components/pages/TrajectoryPage'
import { loadTransitionPlanPageData } from '@/components/study/transitionPlan/transitionPlanPageData'
import { hasTransitionPlan } from '@/db/transitionPlan'
import { redirect } from 'next/navigation'

const TrajectoryReduction = async ({ study, canEdit, user }: StudyProps & UserSessionProps & TransitionPlanProps) => {
  const studyHasTransitionPlan = await hasTransitionPlan(study.id)
  if (!studyHasTransitionPlan) {
    redirect(`/etudes/${study.id}/initialisation`)
  }

  const data = await loadTransitionPlanPageData(study.id, user.accountId)
  if (!data) {
    return <NotFound />
  }

  const { transitionPlan, validatedOnly, trajectories, linkedStudies, linkedExternalStudies, actions, sectenData } =
    data

  return (
    <TrajectoryPage
      study={study}
      canEdit={canEdit}
      transitionPlan={transitionPlan}
      trajectories={trajectories}
      linkedStudies={linkedStudies}
      linkedExternalStudies={linkedExternalStudies}
      actions={actions ?? []}
      validatedOnly={validatedOnly}
      sectenData={sectenData}
    />
  )
}

export default withAuth(withStudyDetails(withTransitionPlan(TrajectoryReduction)))
