import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import { StudyProps } from '@/components/hoc/withStudy'
import withStudyDetails from '@/components/hoc/withStudyDetails'
import withTransitionPlan, { TransitionPlanProps } from '@/components/hoc/withTransitionPlan'
import ActionsPage from '@/components/pages/ActionsPage'
import NotFound from '@/components/pages/NotFound'
import { loadTransitionPlanPageData } from '@/components/study/transitionPlan/transitionPlanPageData'
import { hasTransitionPlan } from '@/db/transitionPlan'
import { redirect } from 'next/navigation'

const Actions = async ({ study, canEdit, user }: StudyProps & UserSessionProps & TransitionPlanProps) => {
  const studyHasTransitionPlan = await hasTransitionPlan(study.id)
  if (!studyHasTransitionPlan) {
    redirect(`/etudes/${study.id}/initialisation`)
  }

  const data = await loadTransitionPlanPageData(study.id, user.accountId)
  if (!data || data.actions === null) {
    return <NotFound />
  }

  const { transitionPlan, validatedOnly, trajectories, linkedStudies, linkedExternalStudies, actions, sectenData } =
    data

  return (
    <ActionsPage
      study={study}
      actions={actions}
      transitionPlanId={transitionPlan.id}
      canEdit={canEdit}
      trajectories={trajectories}
      linkedStudies={linkedStudies}
      linkedExternalStudies={linkedExternalStudies}
      validatedOnly={validatedOnly}
      sectenData={sectenData}
    />
  )
}

export default withAuth(withStudyDetails(withTransitionPlan(Actions)))
