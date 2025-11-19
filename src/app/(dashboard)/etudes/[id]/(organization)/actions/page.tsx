import withAuth from '@/components/hoc/withAuth'
import { StudyProps } from '@/components/hoc/withStudy'
import withStudyDetails from '@/components/hoc/withStudyDetails'
import withTransitionPlan, { TransitionPlanProps } from '@/components/hoc/withTransitionPlan'
import ActionsPage from '@/components/pages/ActionsPage'
import NotFound from '@/components/pages/NotFound'
import { hasTransitionPlan } from '@/db/transitionPlan'
import { getStudyActions, getStudyTransitionPlan } from '@/services/serverFunctions/transitionPlan'
import { redirect } from 'next/navigation'

const Actions = async ({ study, canEdit }: StudyProps & TransitionPlanProps) => {
  const studyHasTransitionPlan = await hasTransitionPlan(study.id)
  if (!studyHasTransitionPlan) {
    redirect(`/etudes/${study.id}/trajectoires`)
  }

  const [transitionPlan, actions] = await Promise.all([getStudyTransitionPlan(study.id), getStudyActions(study.id)])

  if (!actions.success || !transitionPlan.success || !transitionPlan.data) {
    return <NotFound />
  }

  return (
    <ActionsPage study={study} actions={actions.data} transitionPlanId={transitionPlan.data.id} canEdit={canEdit} />
  )
}

export default withAuth(withStudyDetails(withTransitionPlan(Actions)))
