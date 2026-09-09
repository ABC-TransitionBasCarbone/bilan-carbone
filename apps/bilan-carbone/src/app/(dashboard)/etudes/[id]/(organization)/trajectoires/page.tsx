import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import withStudyDetails, { StudyProps } from '@/components/hoc/withStudyDetails'
import withTransitionPlan, { TransitionPlanProps } from '@/components/hoc/withTransitionPlan'
import TrajectoryPage from '@/components/pages/TrajectoryPage'
import { loadTransitionPlanPageData } from '@/components/study/transitionPlan/transitionPlanPageData'
import { hasTransitionPlan } from '@/db/transitionPlan'
import NotFound from '@abc-transitionbascarbone/components/src/pages/NotFound'
import { redirect } from 'next/navigation'

const TrajectoryReduction = async ({
  study,
  canEdit,
  user,
  studyId,
}: StudyProps & UserSessionProps & TransitionPlanProps) => {
  const studyHasTransitionPlan = await hasTransitionPlan(studyId)
  if (!studyHasTransitionPlan) {
    redirect(`/etudes/${studyId}/initialisation`)
  }

  const data = await loadTransitionPlanPageData(studyId, user.accountId, study.startDate.getFullYear())
  if (!data) {
    return <NotFound />
  }

  const {
    transitionPlan,
    validatedOnly,
    trajectories,
    linkedStudies,
    linkedExternalStudies,
    actions,
    sectenData,
    oldestPastStudyYear,
  } = data

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
      oldestPastStudyYear={oldestPastStudyYear}
    />
  )
}

export default withAuth(withStudyDetails(withTransitionPlan(TrajectoryReduction)))
